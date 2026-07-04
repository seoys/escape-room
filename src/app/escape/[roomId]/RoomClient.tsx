'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Image from 'next/image';
import { writeSession } from '@/lib/api/redisClient';
import { StoredSession } from '@/types/session';
import { ClientRoom, Level } from '@/types/room';
import { verifyAnswer } from '@/app/actions/game';
import ComboLockInput from '@/components/ComboLockInput';
import TileOrderInput from '@/components/TileOrderInput';
import SpeedrunTimer from '@/components/SpeedrunTimer';
import ParticleBackground from '@/components/ParticleBackground';
import PretextQuestionText from '@/components/PretextQuestionText';
import { TOTAL_ROOMS } from '@/lib/constants';

interface RoomClientProps {
	room: ClientRoom;
	roomId: number;
	level: Level;
	isLastRoom: boolean;
}

interface Toast {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info';
}

export default function RoomClient({
	room,
	roomId,
	level,
	isLastRoom,
}: RoomClientProps) {
	const router = useRouter();
	const {
		currentRoom,
		hintsRemaining,
		hintsUsed,
		consumeHint,
		completeRoom,
		setCurrentRoom,
	} = useGameStore();

	const answerInputRef = useRef<HTMLInputElement>(null);
	const initialRoomRef = useRef(currentRoom);
	const [answer, setAnswer] = useState('');
	const [shownHintsCount, setShownHintsCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [hydratedRoom, setHydratedRoom] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isHintLayerOpen, setIsHintLayerOpen] = useState(false);
	const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);
	const [score, setScore] = useState(0);
	const [combo, setCombo] = useState(0);
	const [bestCombo, setBestCombo] = useState(0);
	const [toasts, setToasts] = useState<Toast[]>([]);
	const [inputShake, setInputShake] = useState(false);
	const [decoyPasscode, setDecoyPasscode] = useState('');
	const toastIdRef = useRef(0);

	// Show a quiet "checking the lock..." caption while the answer is verified
	useEffect(() => {
		setDecoyPasscode(isSubmitting ? '자물쇠를 맞춰보는 중...' : '');
	}, [isSubmitting]);

	const pushToast = (message: string, type: Toast['type'], duration = 2500) => {
		const id = ++toastIdRef.current;
		setToasts(prev => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts(prev => prev.filter(t => t.id !== id));
		}, duration);
	};

	useEffect(() => {
		const savedRoom = localStorage.getItem('currentRoom');
		const fallbackRoom = Number.isFinite(initialRoomRef.current) ? initialRoomRef.current : 1;
		const roomToUse = savedRoom ? parseInt(savedRoom, 10) : fallbackRoom;
		setCurrentRoom(roomToUse);
		setHydratedRoom(roomToUse);
	}, [setCurrentRoom]);

	useEffect(() => {
		if (!isLoading && answerInputRef.current) {
			answerInputRef.current.focus();
		}
	}, [isLoading]);

	useEffect(() => {
		const storedScore = parseInt(localStorage.getItem('score') ?? '0', 10);
		const storedCombo = parseInt(localStorage.getItem('combo') ?? '0', 10);
		const storedBestCombo = parseInt(localStorage.getItem('bestCombo') ?? '0', 10);
		setScore(Number.isFinite(storedScore) ? storedScore : 0);
		setCombo(Number.isFinite(storedCombo) ? storedCombo : 0);
		setBestCombo(Number.isFinite(storedBestCombo) ? storedBestCombo : 0);
	}, []);

	useEffect(() => {
		if (hydratedRoom === null) return;

		if (roomId !== hydratedRoom) {
			router.replace(`/escape/${hydratedRoom}`);
			return;
		}

		setShownHintsCount(0);
		setAnswer('');
		setIsHintLayerOpen(false);
		setActiveHintIndex(null);

		const persistRoomEntry = async () => {
			try {
				const playerName = localStorage.getItem('playerName');
				if (!playerName) {
					router.replace('/');
					return;
				}
				const playerKey = localStorage.getItem('playerKey') || playerName;

				const payload: StoredSession = {
					name: playerKey,
					displayName: playerName,
					gender: localStorage.getItem('playerGender') || undefined,
					age: parseInt(localStorage.getItem('playerAge') || '', 10) || undefined,
					level,
					host: localStorage.getItem('userHost'),
					userAgent: localStorage.getItem('userAgent'),
					platform: localStorage.getItem('userPlatform'),
					now: localStorage.getItem('startTime'),
					roomId,
					hintsRemaining,
				};

				await writeSession(playerKey, payload);
			} catch (err) {
				console.error('Failed to persist room progress', err);
			} finally {
				setIsLoading(false);
			}
		};

		persistRoomEntry();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hydratedRoom, roomId, router]);

	if (isLoading) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ background: 'var(--color-bg)' }}
			>
				<div className="flex flex-col items-center gap-4">
					<svg
						className="w-10 h-10 animate-spin"
						fill="none"
						viewBox="0 0 24 24"
						style={{ color: 'var(--color-brass)' }}
					>
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
					</svg>
					<p
						className="text-sm tracking-widest"
						style={{ color: 'var(--color-brass-dim)', fontFamily: 'var(--font-serif)' }}
					>
						다음 방으로 이동하는 중...
					</p>
				</div>
			</div>
		);
	}

	const calculateSeconds = () => {
		const startTime = localStorage.getItem('startTime');
		if (!startTime) return null;
		const diff = Date.now() - new Date(startTime).getTime();
		const realSeconds = Math.max(0, Math.floor(diff / 1000));
		const penaltySeconds = (hintsUsed ?? 0) * 180;
		return realSeconds + penaltySeconds;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting) return;

		setIsSubmitting(true);

		try {
			const isValid = await verifyAnswer(roomId, answer, level, room.variantId);

			if (isValid) {
				const baseScore = 100 + room.difficulty * 25;
				const comboBonus = combo * 15;
				const hintPenalty = shownHintsCount > 0 ? 40 : 0;
				const gainedScore = Math.max(30, baseScore + comboBonus - hintPenalty);
				const nextScore = score + gainedScore;
				const nextCombo = shownHintsCount > 0 ? 0 : combo + 1;
				const nextBestCombo = Math.max(bestCombo, nextCombo);

				setScore(nextScore);
				setCombo(nextCombo);
				setBestCombo(nextBestCombo);
				localStorage.setItem('score', nextScore.toString());
				localStorage.setItem('combo', nextCombo.toString());
				localStorage.setItem('bestCombo', nextBestCombo.toString());

				const comboText = nextCombo > 1 ? ` · 연속 x${nextCombo} 🔥` : '';
				pushToast(`문이 열렸습니다 (+${gainedScore}점${comboText})`, 'success', 2500);

				completeRoom(roomId);

				if (isLastRoom) {
					const playerName = localStorage.getItem('playerName') || '';
					const playerKey = localStorage.getItem('playerKey') || playerName;
					const seconds = calculateSeconds();
					const endTimestamp = new Date().toISOString();

					const payload: StoredSession = {
						name: playerKey,
						displayName: playerName,
						gender: localStorage.getItem('playerGender') || undefined,
						age: parseInt(localStorage.getItem('playerAge') || '', 10) || undefined,
						level,
						host: localStorage.getItem('userHost'),
						userAgent: localStorage.getItem('userAgent'),
						platform: localStorage.getItem('userPlatform'),
						roomId: 'finish',
						now: localStorage.getItem('startTime'),
						end: endTimestamp,
						seconds: seconds ?? undefined,
						hintsRemaining,
					};

					try {
						if (playerKey) await writeSession(playerKey, payload);
						localStorage.setItem('endTime', endTimestamp);
					} catch (err) {
						console.error('Failed to write completion session', err);
					} finally {
						setIsSubmitting(false);
					}

					router.push('/finish');
				} else {
					setCurrentRoom(roomId + 1);
					setIsSubmitting(false);
					router.push(`/escape/${roomId + 1}`);
				}
			} else {
				setInputShake(true);
				setTimeout(() => setInputShake(false), 500);
				setCombo(0);
				localStorage.setItem('combo', '0');
				pushToast('열쇠가 맞지 않습니다.', 'error', 2500);
				setIsSubmitting(false);
			}
		} catch (err) {
			console.error('Validation error', err);
			pushToast('확인 중 문제가 발생했습니다. 다시 시도해 주세요.', 'error', 2500);
			setIsSubmitting(false);
		}
	};

	const hintArray = Array.isArray(room.hint) ? room.hint : [room.hint];
	const canShowMoreHints = shownHintsCount < hintArray.length;
	const canUseHint = hintsRemaining > 0 && canShowMoreHints;

	const handleHint = () => {
		if (canUseHint) {
			const nextHints = Math.max(0, hintsRemaining - 1);
			const nextHintIndex = shownHintsCount;
			consumeHint();
			setShownHintsCount(prev => prev + 1);
			setActiveHintIndex(nextHintIndex);
			setIsHintLayerOpen(true);

			const playerName = localStorage.getItem('playerName') || '';
			const playerKey = localStorage.getItem('playerKey') || playerName;
			if (playerName) {
				const payload: StoredSession = {
					name: playerKey,
					displayName: playerName,
					gender: localStorage.getItem('playerGender') || undefined,
					age: parseInt(localStorage.getItem('playerAge') || '', 10) || undefined,
					level,
					host: localStorage.getItem('userHost'),
					userAgent: localStorage.getItem('userAgent'),
					platform: localStorage.getItem('userPlatform'),
					now: localStorage.getItem('startTime'),
					roomId,
					hintsRemaining: nextHints,
				};
				writeSession(playerKey, payload).catch(error => {
					console.warn('Failed to persist hint usage', error);
				});
			}
			return;
		}

		if (shownHintsCount > 0) {
			setActiveHintIndex(shownHintsCount - 1);
			setIsHintLayerOpen(true);
		}
	};

	const handleBack = () => {
		if (roomId === 1) {
			router.push('/');
		} else {
			setCurrentRoom(roomId - 1);
			router.push(`/escape/${roomId - 1}`);
		}
	};

	const handleGiveUp = () => {
		if (window.confirm('탐사를 포기하고 저택을 나가시겠습니까?')) {
			router.push('/');
		}
	};

	const progressPercent = Math.round((roomId / TOTAL_ROOMS) * 100);

	return (
		<div
			className="min-h-screen text-slate-300 overflow-x-hidden relative select-none"
			style={{
				background: 'var(--color-bg)',
				fontFamily: 'var(--font-serif)',
			}}
		>
			{/* Static vignette */}
			<div className="vignette-bg" />

			<ParticleBackground />

			{/* Background room image */}
			<div
				className="fixed inset-0 z-0 transition-opacity duration-1000"
				style={{
					backgroundImage: `url(/images/escape_room_${roomId}.png), url(/images/escape_room_25.png)`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					opacity: 0.08,
					filter: 'grayscale(100%) contrast(150%) blur(4px)',
				}}
			/>

			{/* ── Toast Console logs ── */}
			<div className="toast-container">
				{toasts.map(t => (
					<div
						key={t.id}
						className={`toast ${t.type === 'success' ? 'toast-success' : t.type === 'error' ? 'toast-error' : 'toast-success'}`}
					>
						{t.message}
					</div>
				))}
			</div>

			{/* ── Main Layout ── */}
			<div className="relative z-10 flex flex-col min-h-screen max-w-4xl mx-auto px-4 md:px-8 pb-12">

				{/* ── HUD ── */}
				<header className="pt-6 pb-4">
					{/* Progress bar */}
					<div className="hud-progress-track mb-5">
						<div
							className="hud-progress-fill"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>

					{/* HUD Row */}
					<div className="flex items-center justify-between gap-3">
						{/* Left: Prev Button / Status */}
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={handleBack}
								className="btn-antique py-1.5 px-3 text-[11px] leading-none"
							>
								{`< 이전 방`}
							</button>

							<div className="flex items-center gap-1.5">
								<span className="w-2 h-2 rounded-full bg-[#c9a24b] candle-flicker" />
								<span className="text-[10px] tracking-widest text-[#a38a4a]">
									탐사 중
								</span>
							</div>
						</div>

						{/* Center: Timer */}
						<SpeedrunTimer />

						{/* Right: Stats */}
						<div className="flex items-center gap-2">
							{/* Room ID */}
							<div className="hud-stat text-center border-[rgba(201,162,75,0.2)] bg-black/60">
								<div className="text-[9px] text-[#a38a4a] tracking-wider">방</div>
								<div className="text-xs font-bold text-slate-300">
									{roomId.toString().padStart(2, '0')}
									<span className="text-slate-700">/{TOTAL_ROOMS}</span>
								</div>
							</div>

							{/* Score */}
							<div className="hud-stat text-center border-[rgba(201,162,75,0.2)] bg-black/60 hidden sm:block">
								<div className="text-[9px] text-[#a38a4a] tracking-wider">점수</div>
								<div className="text-xs font-bold text-[#c9a24b]">{score}</div>
							</div>

							{/* Combo */}
							{combo > 1 && (
								<div
									className="hud-stat text-center"
									style={{
										background: 'rgba(232,150,90,0.08)',
										borderColor: 'rgba(232,150,90,0.3)',
									}}
								>
									<div className="text-[9px] text-[#e8965a] tracking-wider">연속</div>
									<div className="text-xs font-bold text-[#e8965a]">+{combo}</div>
								</div>
							)}

							{/* Hints */}
							<div
								className="hud-stat text-center"
								style={{
									background: hintsRemaining > 0 ? 'rgba(232,150,90,0.08)' : 'rgba(30,41,59,0.3)',
									borderColor: hintsRemaining > 0 ? 'rgba(232,150,90,0.25)' : 'rgba(100,116,139,0.15)',
								}}
							>
								<div className="text-[9px] text-[#a38a4a] tracking-wider">단서</div>
								<div
									className="text-xs font-bold"
									style={{ color: hintsRemaining > 0 ? '#e8965a' : '#475569' }}
								>
									🕯 {hintsRemaining}
								</div>
							</div>
						</div>
					</div>
				</header>

				{/* ── Main Sector Panel ── */}
				<main className="flex-1 flex flex-col justify-center py-6 animate-fade-in-scale">
					<div className="antique-panel rounded p-6 md:p-10 relative overflow-hidden">
						<div className="corner-decor" />

						{/* Top gold hairline */}
						<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[rgba(201,162,75,0.4)] to-transparent" />

						{/* Badge & Title block */}
						<div className="flex items-start gap-4 mb-6 border-b border-[rgba(201,162,75,0.2)] pb-5">
							<div
								className="flex-shrink-0 w-12 h-12 rounded border flex items-center justify-center text-lg font-bold"
								style={{
									background: 'rgba(201, 162, 75, 0.1)',
									borderColor: 'rgba(201, 162, 75, 0.35)',
									color: 'var(--color-brass)',
								}}
							>
								{roomId.toString().padStart(2, '0')}
							</div>
							<div>
								<div className="text-[10px] text-[#a38a4a] tracking-widest mb-1">
									{`${room.type} · 난이도 ${room.difficulty}`}
								</div>
								<h2
									className="text-xl md:text-3xl font-bold text-slate-100 tracking-wide"
									style={{ fontFamily: 'var(--font-display)' }}
								>
									{room.title}
								</h2>
							</div>
						</div>

						{/* Question board */}
						<div
							className="rounded p-5 md:p-6 mb-6"
							style={{
								background: 'rgba(0, 0, 0, 0.55)',
								border: '1px solid rgba(201, 162, 75, 0.15)',
								borderLeft: '4px solid var(--color-brass)',
							}}
						>
							<div className="text-[10px] text-[#a38a4a] tracking-wider mb-3 border-b border-[rgba(201,162,75,0.15)] pb-1">
								이 방에 남겨진 수수께끼
							</div>
							<PretextQuestionText
								text={room.question}
								className="text-sm md:text-base text-slate-300"
							/>
						</div>

						{/* Target image (Stage 10 spec) */}
						{roomId === 10 && (
							<div
								className="mb-6 rounded overflow-hidden bg-black/80"
								style={{ border: '1px solid rgba(201, 162, 75, 0.15)' }}
							>
								<Image
									src="/images/escape_room_11.png"
									alt="System Evidence"
									className="w-full grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
									width={800}
									height={400}
								/>
							</div>
						)}

						{/* Hints active log */}
						{shownHintsCount > 0 && (
							<div className="flex items-center gap-2 p-3 bg-[rgba(232,150,90,0.1)] border border-[rgba(232,150,90,0.25)] text-xs text-[#e8965a] rounded mb-6">
								<span className="text-sm">🕯</span>
								<span>
									{`단서 ${shownHintsCount} / ${hintArray.length}개를 확인했습니다.`}
								</span>
								<button
									type="button"
									onClick={() => setIsHintLayerOpen(true)}
									className="ml-auto text-[10px] underline text-[#a38a4a] hover:text-[#e8965a] transition-colors"
								>
									다시 보기
								</button>
							</div>
						)}

						{/* Interactive Console Decouple lock/input */}
						<form onSubmit={handleSubmit} className="flex flex-col gap-6">
							{room.inputType === 'combo-lock' ? (
								<ComboLockInput
									length={room.comboLength || 4}
									value={answer}
									onChange={setAnswer}
									disabled={isSubmitting}
									onComplete={() => {}}
								/>
							) : room.inputType === 'tile-order' ? (
								<TileOrderInput
									tiles={room.tiles || []}
									onChange={setAnswer}
									disabled={isSubmitting}
								/>
							) : (
								<div className="relative">
									{/* Verifying caption */}
									{decoyPasscode && (
										<div className="absolute -top-6 left-2 text-[10px] text-[#c9a24b] animate-pulse">
											{decoyPasscode}
										</div>
									)}

									<input
										ref={answerInputRef}
										type={
											room.inputType === 'number'
												? 'number'
												: room.inputType === 'password'
													? 'password'
													: 'text'
										}
										inputMode={room.inputType === 'number' ? 'numeric' : 'text'}
										value={answer}
										onChange={e => setAnswer(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter') {
												e.preventDefault();
												handleSubmit(e as unknown as React.FormEvent);
											}
										}}
										placeholder="암호를 입력하세요..."
										className={`antique-input py-4 text-xl md:text-2xl text-center tracking-[0.25em] uppercase ${inputShake ? 'animate-shake' : ''}`}
										autoComplete="off"
									/>
								</div>
							)}

							{/* Actions */}
							<div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[rgba(201,162,75,0.15)]">
								{/* Give Up button */}
								<button
									type="button"
									onClick={handleGiveUp}
									className="btn-antique-warn py-2 px-4 text-xs"
								>
									탐사 포기
								</button>

								{/* Hint trigger */}
								<button
									type="button"
									onClick={handleHint}
									disabled={!canUseHint && shownHintsCount === 0}
									className="btn-antique py-2 px-4 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
									style={{
										color: canUseHint || shownHintsCount > 0 ? 'var(--color-candle-amber)' : 'rgba(201,162,75,0.3)',
										borderColor: canUseHint || shownHintsCount > 0 ? 'var(--color-candle-amber)' : 'rgba(201,162,75,0.15)',
										background: canUseHint || shownHintsCount > 0 ? 'rgba(232,150,90,0.06)' : 'transparent',
									}}
								>
									{canUseHint
										? `🕯 단서 확인 (${hintsRemaining})`
										: shownHintsCount > 0
											? '🕯 단서 다시 보기'
											: '🕯 단서 없음'}
								</button>

								<div className="flex-1" />

								{/* Submit Button */}
								<button
									type="submit"
									disabled={isSubmitting}
									className="btn-antique py-3 px-8 text-xs font-bold tracking-widest disabled:opacity-50"
									style={{
										background: isSubmitting ? 'transparent' : 'rgba(201, 162, 75, 0.12)',
									}}
								>
									{isSubmitting ? '확인하는 중...' : '문 열기'}
								</button>
							</div>
						</form>
					</div>
				</main>

				{/* Footer */}
				<footer className="pt-4 text-center text-[9px] text-[rgba(201,162,75,0.3)] tracking-[0.2em]">
					저택은 조용히 당신을 지켜보고 있습니다
				</footer>
			</div>

			{/* ── Hint Decoder Screen (Modal) ── */}
			{isHintLayerOpen && shownHintsCount > 0 && (
				<div
					className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6"
					style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}
					onClick={() => setIsHintLayerOpen(false)}
					role="button"
					tabIndex={0}
					onKeyDown={e => { if (e.key === 'Escape') setIsHintLayerOpen(false); }}
					aria-label="Close hint layer"
				>
					<div
						className="antique-panel-warn rounded-lg w-full max-w-lg overflow-hidden animate-fade-in-scale relative"
						onClick={e => e.stopPropagation()}
					>
						<div className="corner-decor-warn" />

						{/* Modal header */}
						<div
							className="flex items-center justify-between px-6 py-4 border-b border-[rgba(232,150,90,0.25)]"
						>
							<div className="flex items-center gap-2 text-[#e8965a]">
								<span>🕯</span>
								<h3
									className="text-xs tracking-widest"
									style={{ fontFamily: 'var(--font-display)' }}
								>
									{`밝혀진 단서 (${shownHintsCount}/${hintArray.length})`}
								</h3>
							</div>
							<button
								type="button"
								onClick={() => setIsHintLayerOpen(false)}
								className="text-[rgba(232,150,90,0.6)] hover:text-[#e8965a] transition-colors text-base"
							>
								✕
							</button>
						</div>

						{/* Hints Log Screen */}
						<div className="p-6 flex flex-col gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
							{hintArray.slice(0, shownHintsCount).map((hint, index) => (
								<div
									key={index}
									className="rounded p-4"
									style={{
										background:
											activeHintIndex === index
												? 'rgba(232, 150, 90, 0.1)'
												: 'rgba(0,0,0,0.5)',
										border: `1px solid ${activeHintIndex === index ? 'rgba(232,150,90,0.4)' : 'rgba(232,150,90,0.1)'}`,
									}}
								>
									<div
										className="text-[9px] tracking-widest mb-1"
										style={{
											color: activeHintIndex === index ? 'var(--color-candle-amber)' : 'rgba(232,150,90,0.4)',
										}}
									>
										{`단서 ${(index + 1).toString().padStart(2, '0')}`}
									</div>
									<p className="text-slate-200 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
										{hint}
									</p>
								</div>
							))}

							{/* Reveal next hint */}
							{canUseHint && (
								<button
									type="button"
									onClick={() => {
										setIsHintLayerOpen(false);
										handleHint();
									}}
									className="w-full py-3 border border-dashed border-[rgba(232,150,90,0.35)] rounded text-xs transition-all duration-200 mt-2 text-[rgba(232,150,90,0.7)] hover:text-[#e8965a] hover:border-[rgba(232,150,90,0.6)]"
									style={{
										background: 'rgba(232,150,90,0.02)',
									}}
								>
									{`+ 다음 단서 확인하기 (남은 단서: ${hintsRemaining})`}
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
