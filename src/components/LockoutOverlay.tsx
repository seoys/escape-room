'use client';

import { useEffect, useRef, useState } from 'react';
import {
	LOCK_MS,
	MAX_WRONG,
	formatRemaining,
	remainingMs,
} from '@/lib/lockout';

export function LockoutView({ remainingMs: ms }: { remainingMs: number }) {
	return (
		<div
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="lockout-title"
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-6 backdrop-blur-sm"
		>
			<div
				className="w-full max-w-sm rounded px-6 py-8 text-center"
				style={{
					background: 'rgba(0, 0, 0, 0.75)',
					border: '1px solid rgba(201, 162, 75, 0.45)',
					boxShadow: '0 0 40px rgba(201, 162, 75, 0.15)',
				}}
			>
				<div className="mb-3 text-3xl" aria-hidden="true">
					🔒
				</div>
				<h2
					id="lockout-title"
					className="mb-2 text-lg font-bold"
					style={{ color: 'var(--color-brass)' }}
				>
					문제 풀이 잠금
				</h2>
				<p className="mb-6 text-sm leading-relaxed text-slate-300">
					총 {MAX_WRONG}번을 틀려 {LOCK_MS / 60000}분간 문제를 풀 수
					없습니다
				</p>
				<div
					className="mb-6 text-5xl font-bold tracking-widest"
					style={{ color: '#e8965a' }}
				>
					{formatRemaining(ms)}
				</div>
				<p className="text-xs text-[#a38a4a]">
					잠금이 풀리면 오답 횟수가 초기화됩니다
				</p>
			</div>
		</div>
	);
}

interface LockoutOverlayProps {
	lockUntil: number;
	onUnlock: () => void;
}

export default function LockoutOverlay({
	lockUntil,
	onUnlock,
}: LockoutOverlayProps) {
	const [now, setNow] = useState(() => Date.now());
	const unlockedRef = useRef(false);

	// The countdown is derived from Date.now() on every tick, so a throttled
	// background tab still shows (and ends) the lock at the right moment.
	useEffect(() => {
		unlockedRef.current = false;
		const tick = () => {
			const current = Date.now();
			setNow(current);
			if (current >= lockUntil && !unlockedRef.current) {
				unlockedRef.current = true;
				onUnlock();
			}
		};
		tick();
		const id = setInterval(tick, 250);
		return () => clearInterval(id);
	}, [lockUntil, onUnlock]);

	return <LockoutView remainingMs={remainingMs(lockUntil, now)} />;
}
