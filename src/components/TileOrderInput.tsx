'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface TileOrderInputProps {
	tiles: string[];
	tileImages?: Record<string, string>;
	onChange: (val: string) => void;
	disabled?: boolean;
}

// selectedIndices, not value, is the source of truth — value may be ambiguous with duplicate tiles
export default function TileOrderInput({
	tiles,
	tileImages,
	onChange,
	disabled,
}: TileOrderInputProps) {
	const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

	useEffect(() => {
		setSelectedIndices([]);
		onChange('');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tiles]);

	const handleTap = (index: number) => {
		if (disabled || selectedIndices.includes(index)) return;
		const nextIndices = [...selectedIndices, index];
		setSelectedIndices(nextIndices);
		onChange(nextIndices.map(i => tiles[i]).join(''));
	};

	const handleReset = () => {
		if (disabled) return;
		setSelectedIndices([]);
		onChange('');
	};

	const renderTile = (tile: string, size: number) =>
		tileImages?.[tile] ? (
			<Image
				src={tileImages[tile]}
				alt={`컷 ${tile}`}
				width={size}
				height={Math.round(size * 0.75)}
				unoptimized
				className="h-auto rounded"
				style={{ width: size }}
			/>
		) : (
			tile
		);

	const imageMode = Boolean(tileImages);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex min-h-[2.5rem] flex-wrap justify-center gap-2 rounded border border-[rgba(201,162,75,0.25)] bg-black/40 p-3">
				{selectedIndices.length === 0 ? (
					<span className="text-xs text-[rgba(201,162,75,0.4)]">
						{imageMode
							? '컷을 순서대로 탭하세요...'
							: '타일을 순서대로 탭하세요...'}
					</span>
				) : (
					selectedIndices.map((tileIndex, orderIndex) => (
						<span
							key={`selected-${orderIndex}`}
							className="antique-input relative px-3 py-1 text-sm"
							style={{ width: 'auto', display: 'inline-block' }}
						>
							{imageMode && (
								<span className="absolute -left-1 -top-1 rounded-full bg-[#c9a24b] px-1.5 text-[10px] font-bold text-black">
									{orderIndex + 1}
								</span>
							)}
							{renderTile(tiles[tileIndex], 72)}
						</span>
					))
				)}
			</div>

			<div className="flex flex-wrap justify-center gap-2">
				{tiles.map((tile, index) => (
					<button
						key={index}
						type="button"
						disabled={disabled || selectedIndices.includes(index)}
						onClick={() => handleTap(index)}
						className="btn-antique px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-30"
					>
						{renderTile(tile, 112)}
					</button>
				))}
			</div>

			<button
				type="button"
				onClick={handleReset}
				disabled={disabled || selectedIndices.length === 0}
				className="self-center text-[10px] text-[rgba(201,162,75,0.6)] underline transition-colors hover:text-[#c9a24b] disabled:cursor-not-allowed disabled:opacity-30"
			>
				다시 섞기
			</button>
		</div>
	);
}
