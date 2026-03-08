'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';
import { readSession, writeSession } from '@/lib/api/redisClient';
import { StoredSession } from '@/types/session';
import { getAgeGroupFromAge } from '@/lib/room-selector';
import { TOTAL_ROOMS } from '@/lib/constants';

export default function StartPage() {
	const answerInputRef = useRef<HTMLInputElement>(null);
	const [name, setName] = useState('');
	const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
	const [age, setAge] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const router = useRouter();
	const { setCurrentRoom, setHintsRemaining } = useGameStore();

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
			if (storedName) {
				setName(storedName);
			}
			const storedGender = localStorage.getItem('playerGender');
			if (storedGender === 'male' || storedGender === 'female' || storedGender === 'other') {
				setGender(storedGender);
			}
			const storedAge = localStorage.getItem('playerAge');
			if (storedAge) {
				setAge(storedAge);
			}

			setIsLoading(false);
		};

		bootstrap();
	}, []);

	const handleStart = async () => {
		if (!name.trim()) {
			setErrorMessage('이름을 입력해주세요. :)');
			return;
		}
		const parsedAge = parseInt(age, 10);
		if (!Number.isFinite(parsedAge) || parsedAge < 8 || parsedAge > 100) {
			setErrorMessage('나이는 8세 이상 100세 이하로 입력해주세요.');
			return;
		}

		setErrorMessage(null);
		setIsSubmitting(true);

		const trimmedName = name.trim();
		const ageGroup = getAgeGroupFromAge(parsedAge);
		const playerKey = `escape_${trimmedName}_${gender}_${parsedAge}`;

		try {
			await useGameStore.getState().setPlayerName(trimmedName);
			localStorage.setItem('playerName', trimmedName);
			localStorage.setItem('playerGender', gender);
			localStorage.setItem('playerAge', parsedAge.toString());
			localStorage.setItem('playerAgeGroup', ageGroup);
			localStorage.setItem('playerKey', playerKey);
			document.cookie = `player_age_group=${ageGroup}; path=/; max-age=2592000`;

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
					(existingSession.host ===
						localStorage.getItem('userHost') ||
						existingSession.userAgent ===
							localStorage.getItem('userAgent') ||
						existingSession.platform ===
							localStorage.getItem('userPlatform'));

				if (existingSession.roomId === 'finish') {
					alert(
						'이 이름은 이미 게임을 완료했습니다. 랭킹 페이지로 이동합니다.',
					);
					router.push('/finish');
					return;
				}

				if (isSameUser) {
					alert(
						'이미 존재하는 정보입니다. 마지막 방에서 게임을 진행합니다.',
					);

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
				ageGroup,
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
			setErrorMessage(
				'게임을 시작하는 중 문제가 발생했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="min-h-screen flex items-center justify-center relative overflow-hidden">
			<Image
				src="/images/escape_room_main.png"
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
					<select
						value={gender}
						onChange={e => setGender(e.target.value as 'male' | 'female' | 'other')}
						className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
					>
						<option value="male">남성</option>
						<option value="female">여성</option>
						<option value="other">기타</option>
					</select>
					<input
						type="number"
						min={8}
						max={100}
						value={age}
						onChange={e => setAge(e.target.value)}
						placeholder="나이 입력"
						className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
					/>
					{errorMessage ? (
						<p className="mb-4 text-sm text-red-600">
							{errorMessage}
						</p>
					) : null}
					<button
						onClick={handleStart}
						disabled={isSubmitting || isLoading}
						className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{isLoading
							? '준비 중...'
							: isSubmitting
								? '확인 중...'
								: '확인'}
					</button>
				</div>
			</div>
		</main>
	);
}
