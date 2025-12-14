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
	const [faceUpCards, setFaceUpCards] = useState<boolean[]>([]);

	useEffect(() => {
		const shuffled = shuffle([...cardWords]);
		setShuffledWords(shuffled);
		setFaceUpCards(Array(shuffled.length).fill(false));
	}, []);

	const handleCardClick = (index: number) => {
		setFaceUpCards(prev =>
			prev.map((isFaceUp, cardIndex) =>
				cardIndex === index ? !isFaceUp : isFaceUp,
			),
		);
	};

	return (
		<main className="min-h-screen p-10 bg-gray-100">
			<div className="grid grid-cols-4 gap-4 w-full max-w-screen-sm mx-auto">
				{shuffledWords.map((word, index) => (
					<Card
						key={index}
						word={word}
						index={index}
						isFaceUp={Boolean(faceUpCards[index])}
						onClick={handleCardClick}
					/>
				))}
			</div>
		</main>
	);
}
