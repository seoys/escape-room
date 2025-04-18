'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';

export default function StartPage() {
	const answerInputRef = useRef<HTMLInputElement>(null);
	const [name, setName] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const { setCurrentRoom } = useGameStore();

	useEffect(() => {
		if (!isLoading && answerInputRef.current) {
			answerInputRef.current.focus();
		}
	}, [isLoading]);

	const handleStart = async () => {
		if (!name.trim()) {
			alert('이름을 입력해주세요.');
			return;
		}

		await useGameStore.getState().setPlayerName(name);

		const userData = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/v1/redis/escape_${name}`,
		);
		const userDataJson = await userData.json();

		if (userDataJson.result) {
			const userInfo = JSON.parse(userDataJson.result);

			if (
				userInfo.name == name ||
				userInfo.host == localStorage.getItem('userHost') ||
				userInfo.userAgent == localStorage.getItem('userAgent') ||
				userInfo.platform == localStorage.getItem('userPlatform')
			) {
				if (userInfo.roomId === 'finish') {
					alert(
						'이 이름은 이미 게임을 완료하였습니다. 랭킹페이지로 이동합니다.',
					);

					router.push('/finish');
					return;
				}

				alert(
					'이미 존재하는 정보입니다. 마지막 방에서 게임을 진행합니다.',
				);

				setCurrentRoom(parseInt(userInfo.roomId));
				router.push(`/escape/${userInfo.roomId}`);
				return;
			} else {
				router.push(`/escape/1`);
			}
		}

		const data = {
			name: `escape_${name}`,
			host: localStorage.getItem('userHost'),
			userAgent: localStorage.getItem('userAgent'),
			platform: localStorage.getItem('userPlatform'),
			now: localStorage.getItem('startTime'),
			roomId: 1,
		};

		await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/v1/redis/escape_${name}?data=${encodeURIComponent(JSON.stringify(data))}`,
			{
				method: 'POST',
			},
		);

		router.push('/escape/1'); // 다음 페이지 경로

		// 추후 전역 상태 저장도 가능
		// 예: useGameStore.getState().setPlayerName(name);

		// useGameStore.getState().setHost(ipAddress);
		// useGameStore.getState().setUserAgent(browserInfo.userAgent);
		// useGameStore.getState().setPlatform(browserInfo.platform);
	};

	useEffect(() => {
		setIsLoading(false);
	}, []);

	return (
		<main className="min-h-screen flex items-center justify-center relative overflow-hidden">
			<Image
				src="/images/start_background.webp"
				alt="배경 이미지"
				fill
				className="object-cover"
				priority
			/>
			<div className="relative z-10 max-w-md w-full mx-4">
				<div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
					<h1 className="text-3xl font-bold mb-6 text-orange-800">
						이름을 입력해주세요
					</h1>
					<input
						type="text"
						value={name}
						onChange={e => setName(e.target.value)}
						ref={answerInputRef}
						placeholder="이름 입력"
						className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
					/>
					<button
						onClick={handleStart}
						className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
					>
						확인
					</button>
				</div>
			</div>
		</main>
	);
}
