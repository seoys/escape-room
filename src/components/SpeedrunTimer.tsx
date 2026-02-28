'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Black_Han_Sans } from 'next/font/google';

const blackHanSans = Black_Han_Sans({
	weight: '400',
	subsets: ['latin'],
	display: 'swap',
});

// 3 minutes penalty per hint (180 seconds)
const PENALTY_SECONDS_PER_HINT = 180;

export default function SpeedrunTimer() {
	const [elapsedTime, setElapsedTime] = useState(0);
	const { hintsUsed } = useGameStore();

	useEffect(() => {
		const startTimeStr = localStorage.getItem('startTime');
		const endTimeStr = localStorage.getItem('endTime');
		
		if (!startTimeStr) return;

		const start = new Date(startTimeStr).getTime();
		let intervalId: NodeJS.Timeout;

		const updateTimer = () => {
			const now = endTimeStr ? new Date(endTimeStr).getTime() : Date.now();
			const elapsed = Math.max(0, Math.floor((now - start) / 1000));
			setElapsedTime(elapsed);
		};

		if (!endTimeStr) {
			intervalId = setInterval(updateTimer, 1000);
		}
		updateTimer(); // Initial call

		return () => clearInterval(intervalId);
	}, []); // Depend on empty array to just use interval. End time changes when room is completed? Wait, we can listen to it differently, or just rely on state.

	// Format as MM:SS (or HH:MM:SS)
	const formatTime = (totalSeconds: number) => {
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = totalSeconds % 60;
		if (h > 0) {
			return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
		}
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	};

	const penaltyTime = (hintsUsed ?? 0) * PENALTY_SECONDS_PER_HINT;
	const totalTime = elapsedTime + penaltyTime;

	return (
		<div className="flex flex-col items-center bg-black/60 border border-emerald-900/50 p-3 rounded shadow-lg backdrop-blur-sm">
			<div className={`text-2xl md:text-3xl text-emerald-400 tracking-wider ${blackHanSans.className}`}>
				{formatTime(totalTime)}
			</div>
			{penaltyTime > 0 && (
				<div className="text-xs text-red-500/90 font-mono tracking-widest mt-1">
					+ {formatTime(penaltyTime)} PENALTY ({hintsUsed} HINTS)
				</div>
			)}
		</div>
	);
}
