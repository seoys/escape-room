'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import { cardWords } from '@/lib/cardWords';

function shuffle<T>(array: T[]): T[] {
	return array
		.map(item => ({ item, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ item }) => item);
}

export default function CardGamePage() {
	const [shuffledWords, setShuffledWords] = useState<string[]>([]);
	const [flipped, setFlipped] = useState<boolean[]>([]);

	useEffect(() => {
		const shuffled = shuffle([...cardWords]);
		setShuffledWords(shuffled);
		setFlipped(Array(shuffled.length).fill(true)); // 처음에는 모든 카드가 뒷면
	}, []);

	const handleCardClick = () => {
		const newFlipped = [...flipped];
		// newFlipped[index] = !newFlipped[index]; // 클릭할 때마다 앞/뒷면 토글
		setFlipped(newFlipped);
	};

	return (
		<main className="min-h-screen p-10 bg-gray-100">
			<div className="grid grid-cols-4 gap-4 w-full max-w-screen-sm mx-auto">
				{shuffledWords.map((word, index) => (
					<Card
						key={index}
						word={word}
						index={index}
						isFlipped={!flipped[index]} // isFlipped 값을 반전
						onClick={handleCardClick}
					/>
				))}
			</div>
		</main>
	);
}
