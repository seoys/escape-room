'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';

const SEAL_RINGS = [
	{
		id: 'outer',
		label: '바깥 봉인',
		size: 'min(78vw, 420px)',
		symbols: ['◆', '✦', '▲', '●', '✧', '■'],
		targetIndex: 1,
		stepClass: 'home-seal-step-outer',
	},
	{
		id: 'middle',
		label: '중앙 봉인',
		size: 'min(58vw, 310px)',
		symbols: ['☾', '◇', '✶', '⬟', '○'],
		targetIndex: 2,
		stepClass: 'home-seal-step-middle',
	},
	{
		id: 'inner',
		label: '안쪽 봉인',
		size: 'min(38vw, 205px)',
		symbols: ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'],
		targetIndex: 3,
		stepClass: 'home-seal-step-inner',
	},
] as const;

const getRandomRotations = () =>
	SEAL_RINGS.map(ring => {
		const next = Math.floor(Math.random() * ring.symbols.length);
		return next === ring.targetIndex
			? (next + 1) % ring.symbols.length
			: next;
	});

const normalizeRotation = (rotation: number, length: number) =>
	((rotation % length) + length) % length;

export default function Home() {
	const router = useRouter();
	const [rotations, setRotations] = useState(() =>
		SEAL_RINGS.map(() => 0),
	);
	const [isHydrated, setIsHydrated] = useState(false);
	const [hasUnlocked, setHasUnlocked] = useState(false);

	useEffect(() => {
		setRotations(getRandomRotations());
		setIsHydrated(true);
	}, []);

	const alignedCount = useMemo(
		() =>
			SEAL_RINGS.filter(
				(ring, index) =>
					normalizeRotation(rotations[index], ring.symbols.length) ===
					ring.targetIndex,
			).length,
		[rotations],
	);

	useEffect(() => {
		if (isHydrated && alignedCount === SEAL_RINGS.length) {
			const timer = window.setTimeout(() => setHasUnlocked(true), 420);
			return () => window.clearTimeout(timer);
		}
		setHasUnlocked(false);
	}, [alignedCount, isHydrated]);

	const rotateRing = (ringIndex: number) => {
		if (hasUnlocked) return;
		setRotations(prev =>
			prev.map((rotation, index) =>
				index === ringIndex ? rotation + 1 : rotation,
			),
		);
	};

	return (
		<main className="main-background">
			<Image
				src="/images/escape_room_main.png"
				alt=""
				fill
				priority
				quality={65}
				sizes="100vw"
				className="object-cover"
			/>
			<div className="home-start-stage relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 text-center text-white">
				<div className="home-start-copy">
					<div className="text-[10px] tracking-[0.45em] text-[#c9a24b]/70">
						SOSO HAPPY ESCAPE ARCHIVE
					</div>
					<h1
						className="mt-3 text-4xl font-bold tracking-wide text-slate-100 md:text-6xl"
						style={{ fontFamily: 'var(--font-display)' }}
					>
						저택의 봉인
					</h1>
					<div className="mt-4 text-xs tracking-[0.35em] text-[#e8d9b0]/75">
						{`SEAL ${alignedCount} / ${SEAL_RINGS.length}`}
					</div>
				</div>

				<div
					className={`home-seal-board ${hasUnlocked ? 'home-seal-board-open' : ''}`}
					aria-label="저택의 봉인 장치"
				>
					<div className="home-seal-target" aria-hidden="true">
						✦
					</div>
					<div className="home-seal-core" aria-hidden="true">
						<div className="home-seal-core-light" />
					</div>

					{SEAL_RINGS.map((ring, ringIndex) => {
						const rotation = normalizeRotation(
							rotations[ringIndex],
							ring.symbols.length,
						);
						const isAligned = rotation === ring.targetIndex;

						return (
							<button
								key={ring.id}
								type="button"
								aria-label={`${ring.label} 회전`}
								aria-pressed={isAligned}
								className={`home-seal-ring ${ring.stepClass} ${
									isAligned ? 'home-seal-ring-aligned' : ''
								}`}
								style={
									{
										'--seal-size': ring.size,
										'--seal-rotation': `${-rotation * (360 / ring.symbols.length)}deg`,
									} as CSSProperties
								}
								onClick={() => rotateRing(ringIndex)}
							>
								<span className="home-seal-ring-track" aria-hidden="true">
									{ring.symbols.map((symbol, symbolIndex) => (
										<span
											key={`${ring.id}-${symbol}`}
											className="home-seal-symbol"
											style={
												{
													'--symbol-angle': `${
														symbolIndex * (360 / ring.symbols.length)
													}deg`,
												} as CSSProperties
											}
										>
											{symbol}
										</span>
									))}
								</span>
							</button>
						);
					})}

					<div className="home-seal-status" aria-hidden="true">
						{SEAL_RINGS.map((ring, index) => (
							<span
								key={ring.id}
								className={
									normalizeRotation(rotations[index], ring.symbols.length) ===
									ring.targetIndex
										? 'bg-[#c9a24b]'
										: 'bg-[#c9a24b]/20'
								}
							/>
						))}
					</div>
				</div>

				{hasUnlocked && (
					<div className="fixed inset-0 z-20 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
						<div className="antique-panel relative w-full max-w-sm rounded p-6 text-left shadow-2xl">
							<div className="corner-decor" />
							<h2
								className="mb-3 text-xl font-semibold text-slate-100"
								style={{ fontFamily: 'var(--font-display)' }}
							>
								봉인이 풀렸습니다
							</h2>
							<p className="mb-5 text-sm leading-relaxed text-slate-300">
								저택이 방문객의 기록을 요구합니다. 다음 문서에 이름,
								성별, 나이를 남기면 방들이 열립니다.
							</p>
							<button
								type="button"
								onClick={() => router.push('/start')}
								className="btn-antique w-full py-3 text-sm font-bold tracking-widest"
							>
								저택으로 들어가기
							</button>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
