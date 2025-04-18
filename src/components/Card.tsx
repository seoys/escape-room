'use client';
import Image from 'next/image';

interface CardProps {
	word: string;
	index: number;
	onClick: (index: number) => void;
	isFlipped: boolean;
}

export default function Card({ word, index, onClick, isFlipped }: CardProps) {
	return (
		<div
			className="w-20 h-32 perspective cursor-pointer"
			onClick={() => onClick(index)}
		>
			<div
				className={`relative w-full h-full transition-transform duration-500 transform ${isFlipped ? 'rotate-y-180' : ''}`}
			>
				{/* 카드 앞면 */}
				<div className="absolute w-full h-full backface-hidden bg-white border-2 border-orange-300 rounded-xl flex items-center justify-center text-2xl font-bold text-orange-800">
					{word}
				</div>
				{/* 카드 뒷면 */}
				<div className="absolute w-full h-full backface-hidden">
					<Image
						src="/images/card-back.png"
						alt="카드 뒷면"
						width={128}
						height={192}
						className="w-full h-full object-cover rounded-xl"
					/>
				</div>
			</div>
		</div>
	);
}
