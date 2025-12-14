'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { rooms } from '@/lib/rooms';
import { Black_Han_Sans } from 'next/font/google';
import Image from 'next/image';
import { writeSession } from '@/lib/api/redisClient';
import { StoredSession } from '@/types/session';

const blackHanSans = Black_Han_Sans({
	weight: '400',
	subsets: ['latin'],
	display: 'swap',
});

export default function RoomPage() {
	const params = useParams();
	const router = useRouter();
	const parsedRoomId = Number.parseInt(params.roomId as string, 10);
	const roomId = Number.isFinite(parsedRoomId) ? parsedRoomId : 1;
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

		const targetRoom = rooms.find(r => r.id === roomId);
		if (!targetRoom) {
			router.replace(`/escape/${rooms[0].id}`);
			return;
		}

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

	const room = rooms.find(r => r.id === roomId);
	if (isLoading || !room) return <div className="text-white">Loading...</div>;

	const calculateSeconds = () => {
		const startTime = localStorage.getItem('startTime');
		if (!startTime) return null;

		const diff = Date.now() - new Date(startTime).getTime();
		return Math.max(0, Math.floor(diff / 1000));
	};

	const finalRoomId = rooms[rooms.length - 1]?.id ?? roomId;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting) return;

		if (answer.trim().toLowerCase() === room.answer.toLowerCase()) {
			setIsSubmitting(true);
			completeRoom(roomId);

			const isLastRoom = roomId >= finalRoomId;
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
		<div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-300">
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					backgroundImage: `url(/images/escape_room_${roomId}.png)`,
					backgroundSize: 'cover',
					backgroundAttachment: 'fixed',
					zIndex: -1,
				}}
			/>
			<div className="py-20">
				<div className="bg-black/60 w-[95%] md:w-[80%] max-w-6xl mx-auto rounded-3xl p-4 md:p-16 backdrop-blur-sm">
					<h2
						className={`${blackHanSans.className} text-2xl md:text-4xl text-center mb-4 md:mb-12 tracking-wider text-white`}
					>
						ROOM_{roomId}: {room.title}
					</h2>
					<div className="bg-slate-800/70 p-6 md:p-12 rounded-3xl mb-8 md:mb-12 border-4 border-amber-500/50">
						<p className="text-base md:text-lg text-center font-medium tracking-wide leading-relaxed whitespace-pre-wrap text-white">
							❓{room.question}
						</p>
						{roomId === 10 && (
							<div className="mt-8 rounded-xl overflow-hidden shadow-2xl border-4 border-amber-500/30">
								<Image
									src="/images/escape_room_11.png"
									alt="밀레"
									className="w-full max-w-2xl mx-auto"
									width={1000}
									height={1000}
								/>
							</div>
						)}
					</div>
					{showHint && (
						<div className="bg-amber-900/40 p-4 md:p-6 rounded-2xl mb-4 md:mb-6 border-2 border-amber-400/30">
							<p className="text-m md:text-m text-amber-100 font-medium tracking-wide">
								💡 힌트: {room.hint}
							</p>
						</div>
					)}
					{error && (
						<div className="bg-red-950/40 p-4 md:p-4 rounded-3xl mb-6 md:mb-8 border-4 border-red-600/30">
							<p className="text-base md:text-lg text-white text-center font-medium">
								{error}
							</p>
						</div>
					)}
					<form
						onSubmit={handleSubmit}
						className="space-y-4 md:space-y-8"
					>
						<div className="relative">
							<input
								ref={answerInputRef}
								type="text"
								value={answer}
								onChange={e => setAnswer(e.target.value)}
								placeholder="정답을 입력하세요"
								className="w-full h-17 md:h-48 px-4 md:px-8 bg-gray-900/70 rounded-2xl
		                  text-base md:text-lg text-center text-white placeholder-gray-500
		                  border-4 border-yellow-900/50
		                  focus:border-yellow-600/50 focus:outline-none
		                  transition-all duration-300
		                  shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)]
		                  focus:shadow-[inset_0_4px_8px_rgba(0,0,0,0.6),0_0_30px_rgba(234,179,8,0.2)]
		                  tracking-wider
		                  bg-[url('/images/old-paper-texture.png')] bg-cover bg-center bg-blend-multiply
		                  hover:bg-gray-800/70"
							/>
						</div>
						<div className="flex flex-col gap-3 md:gap-4">
							<div className="flex gap-3 md:gap-4">
								<button
									type="submit"
									disabled={isSubmitting}
									className="h-10 md:h-12 flex-1 rounded-xl text-base md:text-lg font-semibold text-white tracking-wider
		                  bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:outline-none
		                  transition-transform duration-150 ease-out hover:translate-y-[-1px] active:translate-y-[0]
		                  shadow-lg shadow-emerald-900/30 disabled:opacity-70 disabled:cursor-not-allowed"
								>
									{isSubmitting ? '확인 중...' : '제출하기'}
								</button>
								<button
									type="button"
									onClick={handleHint}
									disabled={hintsRemaining === 0 || showHint}
									className={`h-10 md:h-12 flex-1 rounded-xl text-base md:text-lg font-semibold tracking-wide transition-colors duration-150
		                  ${
								hintsRemaining > 0 && !showHint
									? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-900/30 focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:outline-none'
									: 'bg-gray-700/60 text-gray-400 border border-gray-600/30 cursor-not-allowed'
							}`}
								>
									힌트 ({hintsRemaining})
								</button>
							</div>
							<div className="flex gap-3 md:gap-4">
								<button
									type="button"
									onClick={handleBack}
									className="h-10 md:h-12 flex-1 rounded-xl text-base md:text-lg font-semibold text-white tracking-wider
		                  bg-slate-700 hover:bg-slate-600 focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:outline-none
		                  transition-transform duration-150 ease-out hover:translate-y-[-1px] active:translate-y-[0]"
								>
									뒤로가기
								</button>
								<button
									type="button"
									onClick={() => router.push('/')}
									className="h-10 md:h-12 flex-1 rounded-xl text-base md:text-lg font-semibold text-white tracking-wider
		                  bg-rose-600 hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:outline-none
		                  transition-transform duration-150 ease-out hover:translate-y-[-1px] active:translate-y-[0]"
								>
									메인으로
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
