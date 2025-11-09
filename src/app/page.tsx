'use client';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

const KEYHOLE_POSITION = { x: 50, y: 40 };
const KEYHOLE_RADIUS = 4;
const KEY_RANGE = {
	x: { min: 20, max: 80 },
	y: { min: 72, max: 88 },
};
const INITIAL_KEY_POSITION = {
	x: (KEY_RANGE.x.min + KEY_RANGE.x.max) / 2,
	y: KEY_RANGE.y.max,
};

const getRandomKeyPosition = () => ({
	x: KEY_RANGE.x.min + Math.random() * (KEY_RANGE.x.max - KEY_RANGE.x.min),
	y: KEY_RANGE.y.min + Math.random() * (KEY_RANGE.y.max - KEY_RANGE.y.min),
});

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

const isWithinKeyhole = (x: number, y: number) => {
	const dx = x - KEYHOLE_POSITION.x;
	const dy = y - KEYHOLE_POSITION.y;
	return Math.sqrt(dx * dx + dy * dy) <= KEYHOLE_RADIUS;
};

export default function Home() {
	const { initGame, setPlayerName: setPlayerNameInStore } = useGameStore();
	const router = useRouter();

	const [keyPosition, setKeyPosition] = useState(INITIAL_KEY_POSITION);
	const [isDragging, setIsDragging] = useState(false);
	const [hasUnlocked, setHasUnlocked] = useState(false);
	const [playerName, setPlayerName] = useState('');
	const [isStarting, setIsStarting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [dragPointerId, setDragPointerId] = useState<number | null>(null);
	const pointerOffsetRef = useRef({ x: 0, y: 0 });
	const hasUnlockedRef = useRef(false);

	const playgroundRef = useRef<HTMLDivElement>(null);

	const getPointerPercentage = useCallback(
		(clientX: number, clientY: number) => {
			if (!playgroundRef.current) return;
			const rect = playgroundRef.current.getBoundingClientRect();
			const left = ((clientX - rect.left) / rect.width) * 100;
			const top = ((clientY - rect.top) / rect.height) * 100;
			return { x: left, y: top };
		},
		[],
	);

	const updateKeyDirectly = useCallback(
		(clientX: number, clientY: number) => {
			const pointerPercent = getPointerPercentage(clientX, clientY);
			if (!pointerPercent) return;
			const targetPosition = {
				x: clamp(
					pointerPercent.x + pointerOffsetRef.current.x,
					KEY_RANGE.x.min,
					KEY_RANGE.x.max,
				),
				y: clamp(
					pointerPercent.y + pointerOffsetRef.current.y,
					KEY_RANGE.y.min,
					KEY_RANGE.y.max,
				),
			};
			setKeyPosition(targetPosition);

			if (
				!hasUnlockedRef.current &&
				isWithinKeyhole(targetPosition.x, targetPosition.y)
			) {
				hasUnlockedRef.current = true;
				setHasUnlocked(true);
			}
		},
		[getPointerPercentage],
	);

	const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		const pointerPercent = getPointerPercentage(
			event.clientX,
			event.clientY,
		);
		if (!pointerPercent) return;

		pointerOffsetRef.current = {
			x: keyPosition.x - pointerPercent.x,
			y: keyPosition.y - pointerPercent.y,
		};

		setIsDragging(true);
		setDragPointerId(event.pointerId);
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		if (!isDragging || event.pointerId !== dragPointerId) return;
		updateKeyDirectly(event.clientX, event.clientY);
	};

	const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.pointerId !== dragPointerId) return;
		setIsDragging(false);
		setDragPointerId(null);
		event.currentTarget.releasePointerCapture(event.pointerId);
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleWindowPointerMove = (event: PointerEvent) => {
			if (event.pointerId !== dragPointerId) return;
			event.preventDefault();
			updateKeyDirectly(event.clientX, event.clientY);
		};

		const handleWindowPointerUp = (event: PointerEvent) => {
			if (event.pointerId !== dragPointerId) return;
			setIsDragging(false);
			setDragPointerId(null);
		};

		window.addEventListener('pointermove', handleWindowPointerMove);
		window.addEventListener('pointerup', handleWindowPointerUp);

		return () => {
			window.removeEventListener('pointermove', handleWindowPointerMove);
			window.removeEventListener('pointerup', handleWindowPointerUp);
		};
	}, [dragPointerId, isDragging, updateKeyDirectly]);

	useEffect(() => {
		hasUnlockedRef.current = hasUnlocked;
	}, [hasUnlocked]);

	useEffect(() => {
		// avoid hydration mismatches by randomizing only on the client
		setKeyPosition(getRandomKeyPosition());
	}, []);

	const handleNameSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!playerName.trim()) {
			setFormError('이름을 입력해주세요.');
			return;
		}
		setFormError(null);
		setIsStarting(true);

		try {
			await initGame();
			setPlayerNameInStore(playerName.trim());
			router.push('/start');
		} catch (error) {
			console.error('Failed to start game', error);
			setFormError(
				'게임을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.',
			);
			setIsStarting(false);
		}
	};

	return (
		<main className="main-background">
			<div
				ref={playgroundRef}
				className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 text-center text-white"
			>
				<div className="mb-8 max-w-md rounded-full bg-black/50 px-6 py-3 text-sm font-medium tracking-wide backdrop-blur">
					열쇠🔑를 잡고 가운데 열쇠구멍에 끼워보세요.
				</div>

				<div
					className={`absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-300 transition-opacity duration-300 ${
						hasUnlocked ? 'opacity-0' : 'opacity-80'
					}`}
					style={{
						left: `${KEYHOLE_POSITION.x}%`,
						top: `${KEYHOLE_POSITION.y}%`,
					}}
					aria-hidden
				/>

				<div
					role="button"
					tabIndex={0}
					aria-label="열쇠를 드래그 해서 문을 열기"
					className="absolute z-10 cursor-grab active:cursor-grabbing"
					style={{
						left: `${keyPosition.x}%`,
						top: `${keyPosition.y}%`,
						transform: 'translate(-50%, -50%)',
					}}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onBlur={() => setIsDragging(false)}
					onKeyDown={event => {
						if (event.key === 'Enter' || event.key === ' ') {
							setHasUnlocked(true);
						}
					}}
				>
					<span className="text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
						🔑
					</span>
				</div>
			</div>

			{hasUnlocked && (
				<div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4">
					<form
						onSubmit={handleNameSubmit}
						className="w-full max-w-sm rounded-2xl bg-white/90 p-6 text-left text-gray-900 shadow-2xl backdrop-blur"
					>
						<h2 className="mb-3 text-lg font-semibold">
							탐험가의 이름을 알려주세요
						</h2>
						<p className="mb-4 text-sm text-gray-600">
							열쇠가 잠금을 풀었습니다! 방탈출 기록에 남길 이름을
							입력하면 게임이 시작돼요.
						</p>
						<label className="mb-2 block text-sm font-medium text-gray-700">
							이름
							<input
								type="text"
								value={playerName}
								onChange={event =>
									setPlayerName(event.target.value)
								}
								className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 outline-none ring-offset-2 focus:ring-2 focus:ring-indigo-500"
								placeholder="예: 퍼즐러"
								autoFocus
							/>
						</label>
						{formError ? (
							<p className="mb-3 text-sm text-red-600">
								{formError}
							</p>
						) : null}
						<button
							type="submit"
							disabled={isStarting}
							className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-center text-base font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
						>
							{isStarting ? '불러오는 중...' : '시작하기'}
						</button>
					</form>
				</div>
			)}
		</main>
	);
}
