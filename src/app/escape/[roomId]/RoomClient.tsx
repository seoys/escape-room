'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Black_Han_Sans } from 'next/font/google';
import Image from 'next/image';
import { writeSession } from '@/lib/api/redisClient';
import { StoredSession } from '@/types/session';
import { Room } from '@/types/room';
import { verifyAnswer } from '@/app/actions/game';
import TypewriterEffect from '@/components/TypewriterEffect';
import { TOTAL_ROOMS } from '@/lib/constants';

const blackHanSans = Black_Han_Sans({
	weight: '400',
	subsets: ['latin'],
	display: 'swap',
});

interface RoomClientProps {
	room: Omit<Room, 'answer'>;
	roomId: number;
	isLastRoom: boolean;
}

export default function RoomClient({
	room,
	roomId,
	isLastRoom,
}: RoomClientProps) {
	const router = useRouter();
	const {
		currentRoom,
		hintsRemaining,
		consumeHint,
		completeRoom,
		setCurrentRoom,
	} = useGameStore();

	const answerInputRef = useRef<HTMLInputElement>(null);
	const initialRoomRef = useRef(currentRoom);
	const [answer, setAnswer] = useState('');
	const [showHint, setShowHint] = useState(false);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [hydratedRoom, setHydratedRoom] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

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
		if (hydratedRoom === null) return;

		// Client-side quick check, actual validation is on server load
		if (roomId !== hydratedRoom) {
			router.replace(`/escape/${hydratedRoom}`);
			return;
		}

		const persistRoomEntry = async () => {
			try {
				const playerName = localStorage.getItem('playerName');
				if (!playerName) {
					router.replace('/');
					return;
				}

				const payload: StoredSession = {
					name: `escape_${playerName}`,
					host: localStorage.getItem('userHost'),
					userAgent: localStorage.getItem('userAgent'),
					platform: localStorage.getItem('userPlatform'),
					now: localStorage.getItem('startTime'),
					roomId,
					hintsRemaining,
				};

				await writeSession(playerName, payload);
			} catch (err) {
				console.error('Failed to persist room progress', err);
			} finally {
				setIsLoading(false);
			}
		};

		persistRoomEntry();
	}, [hydratedRoom, roomId, router, hintsRemaining]);

	if (isLoading) return <div className="text-white">Loading...</div>;

	const calculateSeconds = () => {
		const startTime = localStorage.getItem('startTime');
		if (!startTime) return null;

		const diff = Date.now() - new Date(startTime).getTime();
		return Math.max(0, Math.floor(diff / 1000));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting) return;

		setIsSubmitting(true);
		
		try {
			// Server-side validation
			const isValid = await verifyAnswer(roomId, answer);

			if (isValid) {
				completeRoom(roomId);

				if (isLastRoom) {
					const playerName = localStorage.getItem('playerName') || '';
					const seconds = calculateSeconds();
					const endTimestamp = new Date().toISOString();

					const payload: StoredSession = {
						name: `escape_${playerName}`,
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
						if (playerName) {
							await writeSession(playerName, payload);
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
				setTimeout(() => setError(''), 2000);
				setIsSubmitting(false);
			}
		} catch (err) {
			console.error('Validation error', err);
			setError('오류가 발생했습니다.');
			setIsSubmitting(false);
		}
	};

	const handleHint = () => {
		if (hintsRemaining > 0) {
			const nextHints = Math.max(0, hintsRemaining - 1);
			consumeHint();
			setShowHint(true);

			const playerName = localStorage.getItem('playerName') || '';
			if (playerName) {
				const payload: StoredSession = {
					name: `escape_${playerName}`,
					host: localStorage.getItem('userHost'),
					userAgent: localStorage.getItem('userAgent'),
					platform: localStorage.getItem('userPlatform'),
					now: localStorage.getItem('startTime'),
					roomId,
					hintsRemaining: nextHints,
				};
				writeSession(playerName, payload).catch(error => {
					console.warn('Failed to persist hint usage', error);
				});
			}
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

	return (
		<div className="min-h-screen bg-black text-slate-300 selection:bg-emerald-900 font-mono overflow-x-hidden relative">
			{/* Scanlines Effect */}
			<div className="fixed inset-0 pointer-events-none z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000000_3px)] opacity-10"></div>
			
			<div
				className="fixed inset-0 z-0 transition-opacity duration-1000"
				style={{
					backgroundImage: `url(/images/escape_room_${roomId}.png)`,
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
					<div className="text-xs text-slate-600 tracking-widest">
						STAGE_{roomId.toString().padStart(2, '0')}/{TOTAL_ROOMS}
					</div>
				</header>

				{/* Main Content Area */}
				<main className="flex-1 flex flex-col justify-center animate-fade-in-scale">
					<div className="bg-black/80 backdrop-blur-md border border-slate-800 p-8 md:p-12 rounded-sm shadow-2xl relative overflow-hidden group">
						{/* Decorative Corner Borders */}
						<div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-emerald-900/50 group-hover:border-emerald-500/50 transition-colors duration-500"></div>
						<div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-emerald-900/50 group-hover:border-emerald-500/50 transition-colors duration-500"></div>

						<h2 className={`${blackHanSans.className} text-3xl md:text-5xl text-slate-100 mb-8 tracking-widest`}>
							{room.title}
						</h2>

						<div className="mb-12 min-h-[120px] text-lg md:text-xl leading-relaxed text-slate-300 border-l-4 border-slate-700 pl-6 py-2">
							<TypewriterEffect text={room.question} speed={30} />
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

						{showHint && (
							<div className="bg-amber-950/20 border-l-2 border-amber-600/50 p-4 mb-8 animate-fade-in-scale">
								<p className="text-amber-500/90 text-sm tracking-wide">
									<span className="font-bold mr-2">[HINT LOG]:</span>
									{room.hint}
								</p>
							</div>
						)}

						{error && (
							<div className="bg-red-950/20 border border-red-900/50 p-4 mb-8 animate-shake">
								<p className="text-red-500/90 text-sm tracking-wide font-mono">
									[ERROR]: {error}
								</p>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-8">
							<div className="relative group/input">
								<div className="absolute inset-x-0 bottom-0 h-[1px] bg-slate-700 group-hover/input:bg-emerald-500/50 transition-colors duration-300"></div>
								<input
									ref={answerInputRef}
									type="text"
									value={answer}
									onChange={e => setAnswer(e.target.value)}
									placeholder="ENTER PASSCODE..."
									className="w-full bg-transparent py-4 text-2xl md:text-3xl text-emerald-500 placeholder-slate-800 text-center focus:outline-none font-mono tracking-[0.2em] uppercase"
									autoComplete="off"
								/>
							</div>

							<div className="flex flex-col md:flex-row gap-4 pt-8">
								<button
									type="button"
									onClick={handleBack}
									className="px-8 py-3 text-slate-500 text-sm hover:text-slate-300 transition-colors uppercase tracking-widest border border-transparent hover:border-slate-800"
								>
									Aborted
								</button>
								
								<button
									type="button"
									onClick={handleHint}
									disabled={hintsRemaining === 0 || showHint}
									className={`px-8 py-3 text-sm transition-all uppercase tracking-widest border ${
										hintsRemaining > 0 && !showHint
											? 'text-amber-600 border-amber-900/30 hover:bg-amber-900/10 hover:border-amber-700'
											: 'text-slate-700 border-transparent cursor-not-allowed'
									}`}
								>
									Decrpyt Hint ({hintsRemaining})
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
		</div>
	);
}
