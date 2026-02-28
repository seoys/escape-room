'use client';

import { useState, useEffect } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}|:<>?';

interface GlitchTextProps {
	text: string;
	speed?: number;
}

export default function GlitchText({ text, speed = 30 }: GlitchTextProps) {
	const [displayText, setDisplayText] = useState('');

	useEffect(() => {
		let currentLength = 0;
		let scrambleInterval: NodeJS.Timeout;

		const scramble = () => {
			if (currentLength >= text.length) {
				clearInterval(scrambleInterval);
				setDisplayText(text);
				return;
			}

			let nextText = '';
			for (let i = 0; i < text.length; i++) {
				if (i < currentLength) {
					nextText += text[i];
				} else if (text[i] === ' ' || text[i] === '\n') {
					nextText += text[i];
				} else {
					nextText += CHARS[Math.floor(Math.random() * CHARS.length)];
				}
			}
			setDisplayText(nextText);
			currentLength += 1/2; // speed controls how fast real chars reveal
		};

		scrambleInterval = setInterval(scramble, speed);

		return () => clearInterval(scrambleInterval);
	}, [text, speed]);

	return <span className="whitespace-pre-wrap font-mono tracking-widest">{displayText}</span>;
}
