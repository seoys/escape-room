import { GridCell } from '@/types/room';

const ARROW_GLYPH: Record<NonNullable<GridCell['arrow']>, string> = {
	up: '↑',
	down: '↓',
	left: '←',
	right: '→',
};

interface GridVisualProps {
	rows: GridCell[][];
	caption?: string;
}

export default function GridVisual({ rows, caption }: GridVisualProps) {
	const columns = Math.max(...rows.map(row => row.length));
	return (
		<div className="mb-6">
			<div
				className="mx-auto grid max-w-sm gap-2"
				style={{
					gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
				}}
			>
				{rows.flatMap((row, rowIndex) =>
					row.map((cell, colIndex) => {
						const mark = cell.mark ?? 'none';
						return (
							<div
								key={`${rowIndex}-${colIndex}`}
								data-cell-mark={mark}
								className="relative flex aspect-square items-center justify-center rounded text-2xl font-bold md:text-3xl"
								style={{
									background: 'rgba(0, 0, 0, 0.55)',
									color: '#e9dcbc',
									border:
										mark === 'highlight'
											? '2px solid var(--color-brass)'
											: mark === 'hidden'
												? '2px dashed rgba(201, 162, 75, 0.5)'
												: '1px solid rgba(201, 162, 75, 0.25)',
									boxShadow:
										mark === 'highlight'
											? '0 0 14px rgba(232, 150, 90, 0.55)'
											: undefined,
								}}
							>
								{mark === 'hidden' ? '?' : cell.text}
								{cell.arrow && (
									<span
										aria-label={`화살표 ${cell.arrow}`}
										className="absolute bottom-0.5 right-1.5 text-sm"
										style={{ color: 'var(--color-brass)' }}
									>
										{ARROW_GLYPH[cell.arrow]}
									</span>
								)}
							</div>
						);
					}),
				)}
			</div>
			{caption && (
				<p className="mt-3 text-center text-xs md:text-sm text-[#a38a4a]">
					{caption}
				</p>
			)}
		</div>
	);
}
