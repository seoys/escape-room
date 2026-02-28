'use client';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { fetchLeaderboardSessions } from '@/lib/api/redisClient';

export default function FinishPage() {
	const { startTime, endTime, hintsUsed } = useGameStore();
	const [playerName, setPlayerName] = useState('');
	const [topUsers, setTopUsers] = useState<
		{ name: string; seconds: number }[]
	>([]);
	const [timeLabel, setTimeLabel] = useState('시간 정보 없음');
	const [penaltyLabel, setPenaltyLabel] = useState('');
	const [leaderboardError, setLeaderboardError] = useState<string | null>(
		null,
	);

	useEffect(() => {
		const fetchTopUsers = async () => {
			try {
				const sessions = await fetchLeaderboardSessions();
				setTopUsers(
					sessions.slice(0, 5).map(session => ({
						name: session.name,
						seconds: session.seconds ?? 0,
					})),
				);
			} catch (error) {
				console.error('Failed to load leaderboard', error);
				setLeaderboardError('랭킹 정보를 불러오지 못했습니다.');
			}
		};

		setPlayerName(localStorage.getItem('playerName') as string);

		const storedStart =
			startTime?.getTime() ??
			(localStorage.getItem('startTime')
				? new Date(localStorage.getItem('startTime') as string).getTime()
				: null);
		const storedEnd =
			endTime?.getTime() ??
			(localStorage.getItem('endTime')
				? new Date(localStorage.getItem('endTime') as string).getTime()
				: null);

		if (storedStart && storedEnd) {
			const diff = storedEnd - storedStart;
			const realSeconds = Math.floor(diff / 1000);
			const usedHints =
				hintsUsed ??
				(localStorage.getItem('hintsUsed')
					? parseInt(localStorage.getItem('hintsUsed') as string, 10)
					: 0);
			const penaltySeconds = usedHints * 180;
			const totalSeconds = realSeconds + penaltySeconds;

			const minutes = Math.floor(totalSeconds / 60);
			const seconds = totalSeconds % 60;
			setTimeLabel(`${minutes}분 ${seconds}초`);
			if (penaltySeconds > 0) {
				setPenaltyLabel(`(+ 힌트 페널티 ${Math.floor(penaltySeconds / 60)}분 ${penaltySeconds % 60 > 0 ? `${penaltySeconds % 60}초` : ''})`);
			}
		}

		fetchTopUsers();
	}, [endTime, startTime, hintsUsed]);

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
							이름: {playerName}
						</p>
						<p className="text-lg font-medium text-orange-900 mt-2 flex flex-col items-center">
							<span>최종 소요 시간: {timeLabel}</span>
							{penaltyLabel && (
								<span className="text-sm text-red-600 font-bold mt-1">
									{penaltyLabel}
								</span>
							)}
						</p>
					</div>
					<div className="bg-orange-50 p-6 rounded-xl mb-8 shadow-inner">
						<h2 className="text-2xl font-bold text-orange-800 mb-4">
							🏆 TOP 5
						</h2>
						{leaderboardError ? (
							<p className="text-sm text-orange-900">
								{leaderboardError}
							</p>
						) : (
							<div className="space-y-3">
								{topUsers.map((user, index) => (
									<div
										key={user.name}
										className="flex items-center justify-between bg-white/80 p-3 rounded-lg"
									>
										<div className="flex items-center gap-2">
											<span className="font-bold text-orange-600 w-8">
												{index === 0 && '🥇'}
												{index === 1 && '🥈'}
												{index === 2 && '🥉'}
												{index > 2 && '🎖️'}
											</span>
											<span className="font-medium">
												{user.name.replace('escape_', '')}
											</span>
										</div>
										<span className="text-gray-600">
											{Math.floor(user.seconds / 60)}분{' '}
											{user.seconds % 60}초
										</span>
									</div>
								))}
								{topUsers.length === 0 ? (
									<p className="text-sm text-orange-900">
										아직 랭킹 정보가 없습니다.
									</p>
								) : null}
							</div>
						)}
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
