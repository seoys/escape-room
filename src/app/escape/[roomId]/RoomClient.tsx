'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Black_Han_Sans } from 'next/font/google';
import Image from 'next/image';
import { writeSession } from '@/lib/api/redisClient';
import { StoredSession } from '@/types/session';
import { AgeGroup, Room } from '@/types/room';
import { verifyAnswer } from '@/app/actions/game';
import ComboLockInput from '@/components/ComboLockInput';
import SpeedrunTimer from '@/components/SpeedrunTimer';
import ParticleBackground from '@/components/ParticleBackground';
import { TOTAL_ROOMS } from '@/lib/constants';

const blackHanSans = Black_Han_Sans({
	weight: '400',
	subsets: ['latin'],
	display: 'swap',
});

interface RoomClientProps {
	room: Omit<Room, 'answer'>;
	roomId: number;
	ageGroup: AgeGroup;
	isLastRoom: boolean;
}

export default function RoomClient({
	room,
	roomId,
	ageGroup,
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
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [hydratedRoom, setHydratedRoom] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isHintLayerOpen, setIsHintLayerOpen] = useState(false);
	const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);
	const [score, setScore] = useState(0);
	const [combo, setCombo] = useState(0);
	const [bestCombo, setBestCombo] = useState(0);
	const [roundMessage, setRoundMessage] = useState('');

	useEffect(() => {
		const savedRoom = localStorage.getItem('currentRoom');
		const fallbackRoom = Number.isFinite(initialRoomRef.current)
			? initialRoomRef.current
			: 1;
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

		// Client-side quick check, actual validation is on server load
		if (roomId !== hydratedRoom) {
			router.replace(`/escape/${hydratedRoom}`);
			return;
		}

		// Reset local state when navigated to a different room ID
		setShownHintsCount(0);
		setAnswer('');
		setError('');
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
						ageGroup,
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

	if (isLoading) return <div className="text-white">Loading...</div>;

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
			// Server-side validation
			const isValid = await verifyAnswer(roomId, answer, ageGroup);

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
				setRoundMessage(`+${gainedScore}점 획득`);
				setTimeout(() => setRoundMessage(''), 1800);

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
						ageGroup,
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
						if (playerKey) {
							await writeSession(playerKey, payload);
						}
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
				setError('틀렸습니다. 다시 시도해보세요.');
				setCombo(0);
				localStorage.setItem('combo', '0');
				setRoundMessage('콤보 끊김');
				setTimeout(() => setRoundMessage(''), 1800);
				setTimeout(() => setError(''), 2000);
				setIsSubmitting(false);
			}
		} catch (err) {
			console.error('Validation error', err);
			setError('오류가 발생했습니다.');
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
					ageGroup,
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
		if (window.confirm('정말 진행을 포기하시겠습니까? 처음 화면으로 돌아갑니다.')) {
			router.push('/');
		}
	};

	return (
		<div className="min-h-screen bg-black text-slate-300 selection:bg-emerald-900 font-mono overflow-x-hidden relative">
			{/* Scanlines Effect */}
			<div className="fixed inset-0 pointer-events-none z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000000_3px)] opacity-10 mix-blend-overlay"></div>
			
			<ParticleBackground />
			
				<div
					className="fixed inset-0 z-0 transition-opacity duration-1000"
					style={{
						backgroundImage: `url(/images/escape_room_${roomId}.png), url(/images/escape_room_25.png)`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						opacity: 0.25,
						filter: 'grayscale(80%) contrast(120%) blur(2px)',
					}}
			/>

			<div className="relative z-10 flex flex-col min-h-screen p-6 md:p-12 max-w-5xl mx-auto">
				{/* Top Bar */}
				<header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-4">
					<div className="flex items-center gap-2 text-emerald-600/80">
						<span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
						<span className="text-xs tracking-[0.2em] uppercase">System Online</span>
					</div>
					<SpeedrunTimer />
					<div className="text-right">
						<div className="text-xs text-slate-600 tracking-widest">
							STAGE_{roomId.toString().padStart(2, '0')}/{TOTAL_ROOMS}
						</div>
						<div className="text-[11px] text-emerald-500/80 tracking-wider mt-1">
							SCORE {score} • COMBO x{combo}
						</div>
					</div>
				</header>

				{/* Main Content Area */}
				<main className="flex-1 flex flex-col justify-center animate-fade-in-scale z-10">
					<div className="glass-panel p-8 md:p-12 rounded-xl relative overflow-hidden group">
						{/* Decorative Corner Borders */}
						<div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-emerald-900/50 group-hover:border-emerald-500/50 transition-colors duration-500"></div>
						<div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-emerald-900/50 group-hover:border-emerald-500/50 transition-colors duration-500"></div>

						<h2 className={`${blackHanSans.className} text-3xl md:text-5xl text-slate-100 mb-8 tracking-widest`}>
							{room.title}
						</h2>

						<div className="mb-12 text-lg md:text-xl leading-relaxed text-slate-300 border-l-4 border-slate-700">
							<div className="pl-6 py-2 whitespace-pre-wrap">
								{room.question}
							</div>
						</div>

						{roomId === 10 && (
							<div className="mb-8 border border-slate-700 p-2 bg-black">
								<Image
									src="/images/escape_room_11.png"
									alt="Evidence"
									className="w-full grayscale opacity-80 hover:opacity-100 transition-opacity duration-500"
									width={800}
									height={400}
								/>
							</div>
						)}

						{shownHintsCount > 0 && (
							<div className="bg-amber-950/20 border border-amber-700/40 p-3 mb-8">
								<p className="text-amber-500/90 text-xs tracking-[0.2em] uppercase">
									Hints Unlocked: {shownHintsCount}/{hintArray.length}
								</p>
							</div>
						)}

						{error && (
							<div className="glass-panel border-red-900/50 p-4 mb-8 animate-screen-tear">
								<p className="text-red-500/90 text-sm tracking-wide font-mono animate-glitch">
									[ERROR]: {error}
								</p>
							</div>
						)}

						{roundMessage && (
							<div className="border border-emerald-700/40 bg-emerald-950/20 p-3 mb-8">
								<p className="text-emerald-400 text-sm tracking-[0.16em] uppercase">
									{roundMessage}
								</p>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-8">
							{room.inputType === 'combo-lock' ? (
								<ComboLockInput
									length={room.comboLength || 4}
									value={answer}
									onChange={setAnswer}
									disabled={isSubmitting}
									onComplete={() => {
										// Optional auto-submit can be triggered here if desired
										// handleSubmit(new Event('submit') as unknown as React.FormEvent);
									}}
								/>
							) : (
								<div className="relative group/input">
									<div className="absolute inset-x-0 bottom-0 h-[1px] bg-slate-700 group-hover/input:bg-emerald-500/50 transition-colors duration-300"></div>
									<input
										ref={answerInputRef}
										type={room.inputType === 'number' ? 'number' : room.inputType === 'password' ? 'password' : 'text'}
										inputMode={room.inputType === 'number' ? 'numeric' : 'text'}
										value={answer}
										onChange={e => setAnswer(e.target.value)}
										onKeyDown={e => {
											// Enter 키 입력 시 폼 제출 보장
											if (e.key === 'Enter') {
												e.preventDefault();
												handleSubmit(e as unknown as React.FormEvent);
											}
										}}
										placeholder="ENTER PASSCODE..."
										className="w-full bg-transparent py-4 text-2xl md:text-3xl text-emerald-500 placeholder-slate-800 text-center focus:outline-none font-mono tracking-[0.2em] uppercase transition-all duration-300 focus:scale-105"
										autoComplete="off"
									/>
								</div>
							)}

							<div className="flex flex-col md:flex-row gap-4 pt-8">
								<button
									type="button"
									onClick={handleBack}
									className="px-8 py-3 text-slate-500 text-sm hover:text-slate-300 transition-colors uppercase tracking-widest border border-transparent hover:border-slate-800"
								>
									{roomId === 1 ? 'Home' : 'Previous'}
								</button>
								
								<button
									type="button"
									onClick={handleGiveUp}
									className="px-8 py-3 text-red-800/80 text-sm hover:text-red-500 transition-colors uppercase tracking-widest border border-transparent hover:border-red-900/30 hover:bg-red-900/10"
								>
									Give Up
								</button>
								
								<button
									type="button"
									onClick={handleHint}
									disabled={!canUseHint && shownHintsCount === 0}
									className={`px-8 py-3 text-sm transition-all uppercase tracking-widest border ${
										canUseHint || shownHintsCount > 0
											? 'text-amber-600 border-amber-900/30 hover:bg-amber-900/10 hover:border-amber-700'
											: 'text-slate-700 border-transparent cursor-not-allowed'
									}`}
								>
									{canUseHint ? `Decrypt Hint (${hintsRemaining})` : 'View Hint'}
								</button>

								<button
									type="submit"
									disabled={isSubmitting}
									className="flex-1 bg-slate-900 hover:bg-emerald-900/20 text-emerald-600 border border-emerald-900/30 hover:border-emerald-500/50 py-4 px-8 transition-all duration-300 uppercase tracking-[0.2em] font-bold group relative overflow-hidden"
								>
									<span className="relative z-10">
										{isSubmitting ? 'VERIFYING...' : 'EXECUTE'}
									</span>
									<div className="absolute inset-0 bg-emerald-900/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
								</button>
							</div>
						</form>
					</div>
				</main>
				
				<footer className="mt-12 text-center text-slate-800 text-[10px] tracking-[0.3em]">
					SECURE CONNECTION ESTABLISHED • ID: {localStorage.getItem('userHost') || 'UNKNOWN'}
				</footer>
			</div>

			{isHintLayerOpen && shownHintsCount > 0 && (
				<div
					className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
					onClick={() => setIsHintLayerOpen(false)}
					role="button"
					tabIndex={0}
					onKeyDown={e => {
						if (e.key === 'Escape') setIsHintLayerOpen(false);
					}}
					aria-label="Close hint layer"
				>
					<div
						className="w-full max-w-2xl border border-amber-600/50 bg-slate-950/95 p-6 md:p-8"
						onClick={e => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-amber-400 text-sm md:text-base tracking-[0.2em] uppercase">
								Hint Layer
							</h3>
							<button
								type="button"
								className="px-3 py-1 text-xs border border-amber-700/50 text-amber-500 hover:bg-amber-900/20"
								onClick={() => setIsHintLayerOpen(false)}
							>
								닫기
							</button>
						</div>

						<div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
							{hintArray.slice(0, shownHintsCount).map((hint, index) => (
								<div
									key={index}
									className={`border p-3 ${
										activeHintIndex === index
											? 'border-amber-500 bg-amber-950/30'
											: 'border-slate-700 bg-slate-900/60'
									}`}
								>
									<p className="text-xs text-amber-600 tracking-widest mb-1">
										HINT {index + 1}
									</p>
									<p className="text-sm md:text-base text-slate-200 whitespace-pre-wrap">{hint}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
