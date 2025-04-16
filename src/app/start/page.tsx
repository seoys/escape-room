'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';
export default function StartPage() {
	const [name, setName] = useState('');
	const router = useRouter();

	const handleStart = async () => {
		const host: string = window.location.hostname;
		const userAgent: string = window.navigator.userAgent;
		const language: string = window.navigator.language;
		const platform: string = window.navigator.platform;
		const screenWidth: number = window.screen.width;
		const screenHeight: number = window.screen.height;
		const timeZone: string =
			Intl.DateTimeFormat().resolvedOptions().timeZone;
		const now: string = new Date().toISOString();

		if (!name.trim()) {
			alert('이름을 입력해주세요.');
			return;
		}

		const userData = await fetch(
			`https://api.sosohappy.synology.me/v1/redis/escape_${name}`,
		);

		const userDataJson = await userData.json();

		if (userDataJson.result) {
			const userInfo = JSON.parse(userDataJson.result);

			if (
				userInfo.name == name ||
				userInfo.host == host ||
				userInfo.userAgent == userAgent ||
				userInfo.language == language ||
				userInfo.platform == platform ||
				userInfo.screenWidth == screenWidth ||
				userInfo.screenHeight == screenHeight ||
				userInfo.timeZone == timeZone
			) {
				alert(
					'이미 존재하는 정보입니다. 마지막 방에서 게임을 진행합니다.',
				);
				router.push(`/escape/${userInfo.roomId}`);
				return;
			} else {
				router.push(`/escape/1`);
			}
		}

		const data = {
			name: `escape_${name}`,
			host,
			userAgent,
			language,
			platform,
			screenWidth,
			screenHeight,
			timeZone,
			now,
			roomId: 1,
		};

		fetch(
			`https://api.sosohappy.synology.me/v1/redis/${name}?data=${encodeURIComponent(JSON.stringify(data))}`,
			{
				method: 'POST',
			},
		);

		// 추후 전역 상태 저장도 가능
		// 예: useGameStore.getState().setPlayerName(name);
		useGameStore.getState().setPlayerName(name);
		useGameStore.getState().setHost(host);
		useGameStore.getState().setUserAgent(userAgent);
		useGameStore.getState().setLanguage(language);
		useGameStore.getState().setPlatform(platform);
		useGameStore.getState().setScreenWidth(screenWidth);
		useGameStore.getState().setScreenHeight(screenHeight);
		useGameStore.getState().setTimeZone(timeZone);

		router.push('/escape/1'); // 다음 페이지 경로
	};

	return (
		<main className="min-h-screen flex items-center justify-center relative overflow-hidden">
			<Image
				src="/images/start_background.png"
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
