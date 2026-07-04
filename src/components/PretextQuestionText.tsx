'use client';

import {
	layoutNextLine,
	prepareWithSegments,
	type LayoutCursor,
} from '@chenglou/pretext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface PretextQuestionTextProps {
	text: string;
	className?: string;
}

const FONT = '16px "Noto Serif KR", "Playfair Display", serif';
const FALLBACK_WIDTH = 640;
const MAX_LINES = 64;

export default function PretextQuestionText({
	text,
	className = '',
}: PretextQuestionTextProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const lastFrameRef = useRef(0);
	const [width, setWidth] = useState(FALLBACK_WIDTH);
	const [shadowProgress, setShadowProgress] = useState(0);
	const [hasSettled, setHasSettled] = useState(false);
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		const element = containerRef.current;
		if (!element) return;

		const updateWidth = () => {
			setWidth(Math.max(240, Math.floor(element.clientWidth || FALLBACK_WIDTH)));
		};

		updateWidth();
		const observer = new ResizeObserver(updateWidth);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		setReducedMotion(media.matches);

		const updatePreference = () => setReducedMotion(media.matches);
		media.addEventListener('change', updatePreference);
		return () => media.removeEventListener('change', updatePreference);
	}, []);

	useEffect(() => {
		if (reducedMotion) {
			setHasSettled(true);
			setShadowProgress(1);
			return;
		}

		let animationFrame = 0;
		const startedAt = performance.now();

		const tick = (now: number) => {
			if (now - lastFrameRef.current > 90) {
				lastFrameRef.current = now;
				const progress = Math.min(1, (now - startedAt) / 2600);
				setShadowProgress(progress);

				if (progress >= 1) {
					setHasSettled(true);
					return;
				}
			}
			animationFrame = requestAnimationFrame(tick);
		};

		setHasSettled(false);
		setShadowProgress(0);
		animationFrame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(animationFrame);
	}, [reducedMotion]);

	const getShadowOffset = useCallback((lineIndex: number) => {
		if (reducedMotion || hasSettled) return 0;

		const shadowCenter = shadowProgress * 12 - 2;
		const distance = Math.abs(lineIndex - shadowCenter);
		const overlap = Math.max(0, 1 - distance / 2.2);
		return Math.round(overlap * Math.min(width * 0.28, 150));
	}, [hasSettled, reducedMotion, shadowProgress, width]);

	const lines = useMemo(() => {
		try {
			const prepared = prepareWithSegments(text, FONT, {
				whiteSpace: 'pre-wrap',
				wordBreak: 'keep-all',
			});
			const nextLines: Array<{ text: string; offset: number }> = [];
			let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

			for (let lineIndex = 0; lineIndex < MAX_LINES; lineIndex += 1) {
				const offset = getShadowOffset(lineIndex);
				const availableWidth = Math.max(220, width - offset);
				const line = layoutNextLine(prepared, cursor, availableWidth);
				if (!line) break;

				nextLines.push({ text: line.text, offset });

				if (
					line.end.segmentIndex === cursor.segmentIndex &&
					line.end.graphemeIndex === cursor.graphemeIndex
				) {
					break;
				}
				cursor = line.end;
			}

			return nextLines;
		} catch {
			return text.split('\n').map(line => ({ text: line, offset: 0 }));
		}
	}, [text, width, getShadowOffset]);

	return (
		<div
			ref={containerRef}
			className={`pretext-question-text ${className}`}
			aria-label={text}
		>
			{!reducedMotion && !hasSettled && (
				<span
					className="pretext-shadow-sweep"
					style={{ transform: `translateY(${shadowProgress * 128 - 18}px)` }}
					aria-hidden="true"
				/>
			)}
			{lines.map((line, index) => (
				<span
					key={index}
					className="pretext-question-line"
					style={{
						animationDelay: `${index * 90}ms`,
						marginLeft: `${line.offset}px`,
						maxWidth: `calc(100% - ${line.offset}px)`,
					}}
					aria-hidden="true"
				>
					{line.text.length > 0 ? line.text : '\u00a0'}
				</span>
			))}
		</div>
	);
}
