'use client';

import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext';
import { useEffect, useMemo, useRef, useState } from 'react';

interface PretextQuestionTextProps {
	text: string;
	className?: string;
}

const FONT = '16px "Noto Serif KR", "Playfair Display", serif';
const LINE_HEIGHT = 28;
const FALLBACK_WIDTH = 640;

export default function PretextQuestionText({
	text,
	className = '',
}: PretextQuestionTextProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(FALLBACK_WIDTH);

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

	const lines = useMemo(() => {
		try {
			const prepared = prepareWithSegments(text, FONT, {
				whiteSpace: 'pre-wrap',
				wordBreak: 'keep-all',
			});
			return layoutWithLines(prepared, width, LINE_HEIGHT).lines.map(line => line.text);
		} catch {
			return text.split('\n');
		}
	}, [text, width]);

	return (
		<div
			ref={containerRef}
			className={`pretext-question-text ${className}`}
			aria-label={text}
		>
			{lines.map((line, index) => (
				<span
					key={`${line}-${index}`}
					className="pretext-question-line"
					style={{ animationDelay: `${index * 90}ms` }}
					aria-hidden="true"
				>
					{line.length > 0 ? line : '\u00a0'}
				</span>
			))}
		</div>
	);
}
