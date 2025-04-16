'use client';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import Image from 'next/image';
import { useEffect } from 'react';

export default function FinishPage() {
	const { startTime, endTime } = useGameStore();
	// const [topUser, setTopUser] = useState<string[]>([]);

	const calculateTime = () => {
		if (!startTime || !endTime) return '시간 정보 없음';
		const diff = endTime.getTime() - startTime.getTime();
		const minutes = Math.floor(diff / 60000);
		const seconds = Math.floor((diff % 60000) / 1000);
		return `${minutes}분 ${seconds}초`;
	};

	const calculateSeconds = () => {
		if (!startTime || !endTime) return '시간 정보 없음';
		const diff = endTime.getTime() - startTime.getTime();
		const seconds = Math.floor((diff % 60000) / 1000);
		return seconds;
	};

	useEffect(() => {
		const updateRedis = async () => {
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
				roomId: 10,
				seconds: calculateSeconds(),
			};

			await fetch(
				`https://api.sosohappy.synology.me/v1/redis/${playerName}?data=${encodeURIComponent(JSON.stringify(data))}`,
				{
					method: 'POST',
				},
			);

			// const topUser = await fetch(
			// 	`https://api.sosohappy.synology.me/v1/redis/;
		};

		updateRedis();
	}, []);

	return (
		<main className="min-h-screen flex items-center justify-center relative overflow-hidden">
			<Image
				src="/images/finish_background.png"
				alt="배경 이미지"
				fill
				className="object-cover"
				priority
			/>
			<div className="relative z-10 max-w-2xl w-full mx-4">
				<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
					<h1 className="text-4xl font-bold mb-6 text-orange-800">
						🎉 축하합니다!
					</h1>
					<p className="text-xl text-gray-700 mb-8">
						모든 방을 성공적으로 탈출했습니다!
					</p>
					<div className="bg-orange-50 p-6 rounded-xl mb-8 shadow-inner">
						<p className="text-lg font-medium text-orange-900">
							총 소요 시간: {calculateTime()}
						</p>
					</div>
					<Link
						href="/"
						className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
					>
						처음으로 돌아가기
					</Link>
				</div>
			</div>
		</main>
	);
}
