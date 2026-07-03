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
		{ name: string; seconds: number; ageGroup?: string }[]
	>([]);
	const [timeLabel, setTimeLabel] = useState('시간 정보 없음');
	const [penaltyLabel, setPenaltyLabel] = useState('');
	const [scoreLabel, setScoreLabel] = useState('0');
	const [comboLabel, setComboLabel] = useState('0');
	const [achievements, setAchievements] = useState<string[]>([]);
	const [leaderboardError, setLeaderboardError] = useState<string | null>(
		null,
	);

	useEffect(() => {
		const fetchTopUsers = async () => {
			try {
				const sessions = await fetchLeaderboardSessions();
				setTopUsers(
					sessions.slice(0, 5).map(session => ({
						name: session.displayName || session.name.replace('escape_', ''),
						seconds: session.seconds ?? 0,
						ageGroup: session.ageGroup,
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

			const finalScore = parseInt(localStorage.getItem('score') ?? '0', 10);
			const bestCombo = parseInt(localStorage.getItem('bestCombo') ?? '0', 10);
			setScoreLabel(`${Number.isFinite(finalScore) ? finalScore : 0}`);
			setComboLabel(`${Number.isFinite(bestCombo) ? bestCombo : 0}`);

			const unlocked: string[] = ['완주자: 모든 방 탈출 성공'];
			if (usedHints === 0) unlocked.push('무힌트 클리어: 힌트 없이 완료');
			if ((Number.isFinite(bestCombo) ? bestCombo : 0) >= 5) {
				unlocked.push('연쇄 해커: 콤보 5 이상 달성');
			}
			if (totalSeconds <= 20 * 60) unlocked.push('스피드 러너: 20분 이내 클리어');
			setAchievements(unlocked);
		}

		fetchTopUsers();
	}, [endTime, startTime, hintsUsed]);

	return (
		<main className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
			<Image
				src="/images/finish_background.png"
				alt="배경 이미지"
				fill
				className="object-cover opacity-40"
				priority
			/>
			<div className="vignette-bg" />
			<div className="relative z-10 max-w-2xl w-full mx-4">
				<div className="antique-panel rounded-2xl shadow-2xl p-8 text-center">
					<h1 className="text-4xl font-bold mb-6 text-[#c9a24b]" style={{ fontFamily: 'var(--font-display)' }}>
						🕯 탈출을 축하합니다
					</h1>
					<p className="text-xl text-slate-300 mb-8">
						저택의 모든 방에서 무사히 빠져나오셨습니다.
					</p>
					<div className="bg-[rgba(201,162,75,0.06)] border border-[rgba(201,162,75,0.2)] p-6 rounded-xl mb-8 shadow-inner">
						<p className="text-lg font-medium text-[#e8d9b0]">
							이름: {playerName}
						</p>
						<p className="text-lg font-medium text-[#e8d9b0] mt-2 flex flex-col items-center">
							<span>최종 소요 시간: {timeLabel}</span>
							{penaltyLabel && (
								<span className="text-sm text-[#e6a3ab] font-bold mt-1">
									{penaltyLabel}
								</span>
							)}
						</p>
						<p className="text-lg font-medium text-[#e8d9b0] mt-2">
							최종 점수: {scoreLabel}
						</p>
						<p className="text-lg font-medium text-[#e8d9b0] mt-1">
							최고 연속: x{comboLabel}
						</p>
					</div>

					<div className="bg-[rgba(201,162,75,0.06)] border border-[rgba(201,162,75,0.2)] p-6 rounded-xl mb-8 shadow-inner text-left">
						<h2 className="text-2xl font-bold text-[#c9a24b] mb-3 text-center" style={{ fontFamily: 'var(--font-display)' }}>
							남겨진 기록
						</h2>
						<ul className="space-y-2">
							{achievements.map(item => (
								<li
									key={item}
									className="bg-black/40 border border-[rgba(201,162,75,0.15)] rounded-lg px-3 py-2 text-[#e8d9b0] text-sm"
								>
									{item}
								</li>
							))}
						</ul>
					</div>
					<div className="bg-[rgba(201,162,75,0.06)] border border-[rgba(201,162,75,0.2)] p-6 rounded-xl mb-8 shadow-inner">
						<h2 className="text-2xl font-bold text-[#c9a24b] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
							방명록 TOP 5
						</h2>
						{leaderboardError ? (
							<p className="text-sm text-[#e8d9b0]">
								{leaderboardError}
							</p>
						) : (
							<div className="space-y-3">
								{topUsers.map((user, index) => (
									<div
										key={user.name}
										className="flex items-center justify-between bg-black/40 border border-[rgba(201,162,75,0.15)] p-3 rounded-lg"
									>
										<div className="flex items-center gap-2">
											<span className="font-bold text-[#c9a24b] w-8">
												{index === 0 && '🥇'}
												{index === 1 && '🥈'}
												{index === 2 && '🥉'}
												{index > 2 && '🕯'}
											</span>
											<span className="font-medium text-[#e8d9b0]">
												{user.name}
											</span>
											{user.ageGroup && (
												<span className="text-xs text-[#a38a4a]">
													({user.ageGroup})
												</span>
											)}
										</div>
										<span className="text-slate-400">
											{Math.floor(user.seconds / 60)}분{' '}
											{user.seconds % 60}초
										</span>
									</div>
								))}
								{topUsers.length === 0 ? (
									<p className="text-sm text-[#e8d9b0]">
										아직 방명록이 비어 있습니다.
									</p>
								) : null}
							</div>
						)}
					</div>

					<Link
						href="/"
						className="inline-block bg-[#c9a24b] hover:bg-[#dcb768] text-[#0d0b12] font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
					>
						처음으로 돌아가기
					</Link>
				</div>
			</div>
		</main>
	);
}
