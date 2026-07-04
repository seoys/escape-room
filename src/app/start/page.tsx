'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { readSession, writeSession } from '@/lib/api/redisClient';
import { StoredSession } from '@/types/session';
import { getLevelFromAge } from '@/lib/age-group';
import { TOTAL_ROOMS } from '@/lib/constants';
import { Level } from '@/types/room';

const LEVEL_LABELS: Record<Level, { label: string; desc: string; detail: string }> = {
	1: { label: '제1관 [입문]', desc: '방 01 ~ 30', detail: '저택 초입의 가벼운 수수께끼들이 기다리고 있습니다.' },
	2: { label: '제2관 [심화]', desc: '방 31 ~ 60', detail: '서재 깊은 곳, 조금 더 얽힌 단서들을 풀어야 합니다.' },
	3: { label: '제3관 [고급]', desc: '방 61 ~ 90', detail: '지하실의 낡은 장치들이 정교한 추리를 요구합니다.' },
	4: { label: '제4관 [최상급]', desc: '방 91 ~ 120', detail: '가장 깊은 곳, 저택 최후의 진실이 기다립니다.' },
};

const GENDER_OPTIONS = [
	{ value: 'male', label: '남성' },
	{ value: 'female', label: '여성' },
	{ value: 'other', label: '밝히지 않음' },
] as const;

type Gender = 'male' | 'female' | 'other';

export default function StartPage() {
	const answerInputRef = useRef<HTMLInputElement>(null);
	const [name, setName] = useState('');
	const [gender, setGender] = useState<Gender>('male');
	const [age, setAge] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [shakeError, setShakeError] = useState(false);
	const [systemLogs, setSystemLogs] = useState<string[]>([]);
	const router = useRouter();
	const { setCurrentRoom, setHintsRemaining } = useGameStore();

	const parsedAge = parseInt(age, 10);
	const level =
		Number.isFinite(parsedAge) && parsedAge >= 8 && parsedAge <= 100
			? getLevelFromAge(parsedAge)
			: null;

	// Terminal typing simulation logs
	useEffect(() => {
		const logs = [
			'촛불을 밝히는 중...',
			'낡은 현관문의 빗장을 여는 중...',
			'저택의 먼지를 털어내는 중...',
			'방문객 기록부를 펼치는 중...',
			'이름과 나이를 기다리는 중...'
		];
		let currentIdx = 0;
		const interval = setInterval(() => {
			if (currentIdx < logs.length) {
				setSystemLogs(prev => [...prev, logs[currentIdx]]);
				currentIdx++;
			} else {
				clearInterval(interval);
			}
		}, 800);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (!isLoading && answerInputRef.current) {
			answerInputRef.current.focus();
		}
	}, [isLoading]);

	useEffect(() => {
		const bootstrap = async () => {
			if (!localStorage.getItem('startTime')) {
				try {
					await useGameStore.getState().initGame();
				} catch (error) {
					console.error('Failed to initialize game session', error);
				}
			}

			const storedName = localStorage.getItem('playerName');
			if (storedName) setName(storedName);

			const storedGender = localStorage.getItem('playerGender');
			if (storedGender === 'male' || storedGender === 'female' || storedGender === 'other') {
				setGender(storedGender);
			}
			const storedAge = localStorage.getItem('playerAge');
			if (storedAge) setAge(storedAge);

			setIsLoading(false);
		};

		bootstrap();
	}, []);

	const triggerError = (msg: string) => {
		setErrorMessage(msg);
		setShakeError(true);
		setTimeout(() => setShakeError(false), 500);
	};

	const handleStart = async () => {
		if (!name.trim()) {
			triggerError('이름을 알려주셔야 저택에 들어오실 수 있습니다.');
			return;
		}
		if (!Number.isFinite(parsedAge) || parsedAge < 8 || parsedAge > 100) {
			triggerError('나이는 8세에서 100세 사이로 입력해 주세요.');
			return;
		}

		setErrorMessage(null);
		setIsSubmitting(true);

		const trimmedName = name.trim();
		const currentLevel = getLevelFromAge(parsedAge);
		const playerKey = `escape_${trimmedName}_${gender}_${parsedAge}`;

		try {
			await useGameStore.getState().setPlayerName(trimmedName);
			localStorage.setItem('playerName', trimmedName);
			localStorage.setItem('playerGender', gender);
			localStorage.setItem('playerAge', parsedAge.toString());
			localStorage.setItem('playerLevel', currentLevel.toString());
			localStorage.setItem('playerKey', playerKey);
			document.cookie = `player_level=${currentLevel}; path=/; max-age=2592000`;

			const existingSession = await readSession(playerKey);

			if (existingSession) {
				if (
					typeof existingSession.hintsRemaining === 'number' &&
					existingSession.hintsRemaining >= 0
				) {
					setHintsRemaining(existingSession.hintsRemaining);
				}

				const isSameUser =
					existingSession.name === playerKey &&
					(existingSession.host === localStorage.getItem('userHost') ||
						existingSession.userAgent === localStorage.getItem('userAgent') ||
						existingSession.platform === localStorage.getItem('userPlatform'));

				if (existingSession.roomId === 'finish') {
					alert('이미 저택의 모든 방을 탈출하셨습니다. 기록실로 안내합니다.');
					router.push('/finish');
					return;
				}

				if (isSameUser) {
					alert('이전에 남기신 발자취를 찾았습니다. 마지막으로 계셨던 방으로 안내합니다.');
					const nextRoomId = Math.min(TOTAL_ROOMS, Number(existingSession.roomId) || 1);
					setCurrentRoom(nextRoomId);
					router.push(`/escape/${nextRoomId}`);
					return;
				}
			}

			const payload: StoredSession = {
				name: playerKey,
				displayName: trimmedName,
				gender,
				age: parsedAge,
				level: currentLevel,
				host: localStorage.getItem('userHost'),
				userAgent: localStorage.getItem('userAgent'),
				platform: localStorage.getItem('userPlatform'),
				now: localStorage.getItem('startTime'),
				roomId: 1,
				hintsRemaining: 3,
			};

			await writeSession(playerKey, payload);
			localStorage.setItem('score', '0');
			localStorage.setItem('combo', '0');
			localStorage.setItem('bestCombo', '0');

			setHintsRemaining(3);
			setCurrentRoom(1);
			router.push('/escape/1');
		} catch (error) {
			console.error('Failed to start game', error);
			triggerError('저택과의 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const levelInfo = level ? LEVEL_LABELS[level] : null;

	return (
		<div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none" style={{ background: 'var(--color-bg)' }}>
			{/* Static vignette */}
			<div className="vignette-bg" />

			{/* Main Grid */}
			<div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch animate-fade-in-scale">

				{/* ── Left Dossier Panel ( 기밀 조사 문서 ) ── */}
				<div className="flex flex-col justify-between p-8 rounded border border-slate-800 bg-slate-950/80 backdrop-blur-md relative overflow-hidden">
					{/* Watermark badge */}
					<div className="absolute -top-8 -right-8 w-44 h-44 rounded-full border-4 border-dashed border-[rgba(122,31,43,0.3)] flex items-center justify-center rotate-12 pointer-events-none">
						<span className="text-[10px] tracking-widest text-[rgba(122,31,43,0.4)] uppercase text-center font-bold">
							봉인된 기록<br />반출 금지
						</span>
					</div>

					{/* Header Stamp */}
					<div className="flex justify-between items-start">
						<div className="flex flex-col gap-1 text-[10px] text-slate-500 tracking-wider">
							<div>저택 관리 사무소</div>
							<div>기록 번호: #00A9-ESCAPE</div>
							<div>작성일: {new Date().toISOString().slice(0,10)}</div>
						</div>
						<div className="dossier-stamp px-3 py-1.5 text-xs font-bold border-2">
							봉인됨
						</div>
					</div>

					{/* Case Report Content */}
					<div className="my-8 flex-1 flex flex-col justify-center">
						<h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-6 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
							<span className="text-[#7a1f2b]">▶</span> 방문객 안내문
						</h1>

						<div className="space-y-4 text-xs leading-relaxed text-slate-400">
							<p className="border-l border-[#7a1f2b] pl-3 py-1">
								<strong>[안내]</strong> 이 저택은 오랜 세월 잠들어 있던 수수께끼의 방들로 이루어져 있습니다. 방문객은 각 방에 남겨진 단서를 풀어야만 다음 방으로 나아갈 수 있습니다.
							</p>
							<p>
								저택에는 <span className="text-[#c9a24b] font-bold">{TOTAL_ROOMS}개의 방</span>이 있으며, 각 방마다 감춰진 암호를 찾아내야 합니다.
							</p>
							<p>
								사용할 수 있는 단서(힌트)는 전체 여정 동안 <span className="text-[#e8965a] font-bold">3회</span>로 제한되며, 단서를 확인할 때마다 소요 시간에 페널티가 더해집니다.
							</p>
						</div>
					</div>

					{/* Terminal Output Screen at Bottom of Left Panel */}
					<div className="p-4 rounded bg-black/90 border border-[rgba(201,162,75,0.15)] text-[10px] text-[#c9a24b] h-32 overflow-y-auto custom-scrollbar flex flex-col gap-1">
						{systemLogs.map((log, idx) => (
							<div key={idx} className="flex gap-2">
								<span className="text-[rgba(201,162,75,0.5)]">·</span>
								<span>{log}</span>
							</div>
						))}
						<div className="flex gap-1 animate-pulse">
							<span className="text-[rgba(201,162,75,0.5)]">·</span>
							<span className="w-1.5 h-3 bg-[#c9a24b]" />
						</div>
					</div>
				</div>

				{/* ── Right Panel: Reception Desk Form ── */}
				<div className="antique-panel rounded p-8 flex flex-col justify-between relative overflow-hidden">
					<div className="corner-decor" />

					{/* Panel Header */}
					<div className="flex justify-between items-center mb-8 border-b border-[rgba(201,162,75,0.2)] pb-3">
						<div className="flex items-center gap-2">
							<span className="w-2.5 h-2.5 bg-[#c9a24b] rounded-full candle-flicker" />
							<span className="text-xs font-bold tracking-widest text-[#c9a24b] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
								저택 접수대
							</span>
						</div>
						<div className="text-[10px] text-[rgba(201,162,75,0.5)]">
							방문 기록부
						</div>
					</div>

					{/* Forms */}
					<div className="flex-1 flex flex-col justify-center gap-6">
						{/* Name */}
						<div className="flex flex-col gap-2">
							<div className="flex justify-between text-xs tracking-widest text-[#a38a4a]">
								<span>방문객 성함</span>
								<span>[필수]</span>
							</div>
							<input
								ref={answerInputRef}
								type="text"
								value={name}
								onChange={e => setName(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && handleStart()}
								placeholder="성함을 입력해 주세요..."
								className="antique-input"
								autoComplete="off"
							/>
						</div>

						{/* Gender Toggles */}
						<div className="flex flex-col gap-2">
							<div className="text-xs tracking-widest text-[#a38a4a]">
								성별
							</div>
							<div className="grid grid-cols-3 gap-2">
								{GENDER_OPTIONS.map(opt => (
									<button
										key={opt.value}
										type="button"
										onClick={() => setGender(opt.value)}
										className="py-3 text-xs tracking-wider transition-all duration-150 border"
										style={{
											background: gender === opt.value ? 'rgba(201, 162, 75, 0.12)' : 'rgba(0,0,0,0.4)',
											borderColor: gender === opt.value ? 'var(--color-brass)' : 'rgba(201, 162, 75, 0.15)',
											color: gender === opt.value ? 'var(--color-brass)' : '#6b5f45',
											boxShadow: gender === opt.value ? '0 0 10px rgba(201,162,75,0.12)' : 'none',
										}}
									>
										{opt.label}
									</button>
								))}
							</div>
						</div>

						{/* Age & Level */}
						<div className="flex flex-col gap-2">
							<div className="flex justify-between text-xs tracking-widest text-[#a38a4a]">
								나이
								{levelInfo && (
									<span className="text-[#c9a24b] font-bold animate-badge-pop">
										{levelInfo.label}
									</span>
								)}
							</div>
							<div className="relative">
								<input
									type="number"
									min={8}
									max={100}
									value={age}
									onChange={e => setAge(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && handleStart()}
									placeholder="나이를 입력해 주세요 (8 ~ 100)..."
									className="antique-input"
								/>
							</div>
							{levelInfo && (
								<div className="p-3 bg-[rgba(201,162,75,0.08)] border border-[rgba(201,162,75,0.2)] text-[11px] text-[#c9a24b]/80 leading-normal flex flex-col gap-1">
									<div><strong>[안내될 방]:</strong> {levelInfo.desc}</div>
									<div className="text-[#a38a4a]">{levelInfo.detail}</div>
								</div>
							)}
						</div>

						{/* Error reporting */}
						{errorMessage && (
							<div
								className={`flex items-start gap-2 p-3 bg-[rgba(122,31,43,0.15)] border border-[rgba(122,31,43,0.3)] rounded ${shakeError ? 'animate-shake' : ''}`}
							>
								<span className="text-[#e6a3ab] text-xs font-bold">⚠</span>
								<p className="text-xs text-[#e6a3ab] leading-normal">{errorMessage}</p>
							</div>
						)}
					</div>

					{/* Start Trigger */}
					<div className="mt-8 pt-4 border-t border-[rgba(201,162,75,0.2)]">
						<button
							type="button"
							onClick={handleStart}
							disabled={isSubmitting || isLoading}
							className="btn-antique w-full py-4 text-sm font-semibold tracking-widest disabled:opacity-40"
						>
							{isLoading ? (
								<span className="flex items-center justify-center gap-2">
									저택의 문을 확인하는 중...
								</span>
							) : isSubmitting ? (
								<span className="flex items-center justify-center gap-2">
									방문 기록을 남기는 중...
								</span>
							) : (
								<span className="flex items-center justify-center gap-2">
									저택으로 들어가기
								</span>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
