'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { rooms } from '@/lib/rooms';
import { Black_Han_Sans } from 'next/font/google';

const blackHanSans = Black_Han_Sans({
	weight: '400',
	subsets: ['latin'],
	display: 'swap',
});

export default function RoomPage() {
	const params = useParams();
	const router = useRouter();
	const roomId = parseInt(params.roomId as string);
	const {
		currentRoom,
		hintsRemaining,
		consumeHint,
		completeRoom,
		setCurrentRoom,
	} = useGameStore();

	const [answer, setAnswer] = useState('');
	const [showHint, setShowHint] = useState(false);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const savedRoom = localStorage.getItem('currentRoom');
		if (savedRoom) {
			setCurrentRoom(parseInt(savedRoom));
		}
	}, []);

	useEffect(() => {
		const loadRoom = async () => {
			try {
				const room = rooms.find(r => r.id === roomId);
				if (!room || roomId !== currentRoom) {
					router.push('/escape/' + currentRoom);
					return;
				}

				// 룸정보를  업데이트함.
				const playerName = useGameStore.getState().playerName;
				const host = useGameStore.getState().host;
				const userAgent = useGameStore.getState().userAgent;
				const language = useGameStore.getState().language;
				const platform = useGameStore.getState().platform;
				const screenWidth = useGameStore.getState().screenWidth;
				const screenHeight = useGameStore.getState().screenHeight;
				const timeZone = useGameStore.getState().timeZone;
				const now = new Date().toISOString();

				const data = {
					name: `escape_${playerName}`,
					host,
					userAgent,
					language,
					platform,
					screenWidth,
					screenHeight,
					timeZone,
					now,
					roomId,
				};

				fetch(
					`https://api2.sosohappy.synology.me/v1/redis/escape_${playerName}?data=${encodeURIComponent(JSON.stringify(data))}`,
					{
						method: 'POST',
					},
				);

				setIsLoading(false);
			} catch (err) {
				console.error('Failed to load room:', err);
				router.push('/');
			}
		};
		loadRoom();
	}, [roomId, currentRoom, router]);

	const room = rooms.find(r => r.id === roomId);
	if (isLoading || !room) return <div className="text-white">Loading...</div>;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (answer.toLowerCase() === room.answer.toLowerCase()) {
			completeRoom(roomId);
			if (roomId === 10) {
				router.push('/finish');
			} else {
				setCurrentRoom(roomId + 1);
				router.push(`/escape/${roomId + 1}`);
			}
		} else {
			setError('틀렸습니다. 다시 시도해보세요.');
			setTimeout(() => setError(''), 2000);
		}
	};

	const handleHint = () => {
		if (hintsRemaining > 0) {
			consumeHint();
			setShowHint(true);
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
		<div className="min-h-screen w-full relative">
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
									className="h-10 md:h-12 flex-1
                          bg-gradient-to-br from-green-500/90 to-green-700/90
                          hover:from-green-400/90 hover:to-green-600/90
                          rounded-xl text-base md:text-lg font-bold text-white tracking-wider
                          transition-all duration-200 ease-out
                          hover:scale-[1.01] active:scale-[0.99]
                          border border-green-400/20
                          shadow-lg shadow-green-900/30
                          backdrop-blur-sm"
								>
									제출하기
								</button>
								<button
									type="button"
									onClick={handleHint}
									disabled={hintsRemaining === 0 || showHint}
									className={`h-10 md:h-12 flex-1 rounded-xl text-base md:text-lg font-bold tracking-wide
                          transition-all duration-200 ease-out backdrop-blur-sm
                          ${
								hintsRemaining > 0 && !showHint
									? 'bg-gradient-to-br from-amber-500/90 to-amber-700/90 hover:from-amber-400/90 hover:to-amber-600/90 text-white border border-amber-400/20 shadow-lg shadow-amber-900/30 hover:scale-[1.01] active:scale-[0.99]'
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
									className="h-10 md:h-12 flex-1
                          bg-gradient-to-br from-gray-600/90 to-gray-800/90
                          hover:from-gray-500/90 hover:to-gray-700/90
                          rounded-xl text-base md:text-lg font-bold text-white tracking-wider
                          transition-all duration-200 ease-out
                          hover:scale-[1.01] active:scale-[0.99]
                          border border-gray-400/20
                          shadow-lg shadow-gray-900/30
                          backdrop-blur-sm"
								>
									뒤로가기
								</button>
								<button
									type="button"
									onClick={() => router.push('/')}
									className="h-10 md:h-12 flex-1
                          bg-gradient-to-br from-red-500/90 to-red-700/90
                          hover:from-red-400/90 hover:to-red-600/90
                          rounded-xl text-base md:text-lg font-bold text-white tracking-wider
                          transition-all duration-200 ease-out
                          hover:scale-[1.01] active:scale-[0.99]
                          border border-red-400/20
                          shadow-lg shadow-red-900/30
                          backdrop-blur-sm"
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
