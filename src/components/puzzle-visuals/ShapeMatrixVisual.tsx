import { ShapeCell, ShapeMark } from '@/types/room';

function Mark({ mark }: { mark: ShapeMark }) {
	const x = 10 + 20 * (mark.slot % 3);
	const y = 10 + 20 * Math.floor(mark.slot / 3);
	const paint = {
		fill: mark.filled ? 'currentColor' : 'none',
		stroke: 'currentColor',
		strokeWidth: 2,
	};
	switch (mark.shape) {
		case 'circle':
			return (
				<circle data-shape="circle" cx={x} cy={y} r={7} {...paint} />
			);
		case 'square':
			return (
				<rect
					data-shape="square"
					x={x - 7}
					y={y - 7}
					width={14}
					height={14}
					{...paint}
				/>
			);
		case 'triangle':
			return (
				<polygon
					data-shape="triangle"
					points={`${x},${y - 8} ${x + 8},${y + 7} ${x - 8},${y + 7}`}
					{...paint}
				/>
			);
		case 'diamond':
			return (
				<polygon
					data-shape="diamond"
					points={`${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`}
					{...paint}
				/>
			);
	}
}

export function ShapeCellView({
	cell,
	size = 72,
}: {
	cell: ShapeCell;
	size?: number;
}) {
	return (
		<svg
			viewBox="0 0 60 60"
			width={size}
			height={size}
			role="img"
			aria-label={`도형 ${cell.marks.length}개`}
			style={{ color: '#e9dcbc' }}
		>
			{cell.marks.map((mark, index) => (
				<Mark key={index} mark={mark} />
			))}
		</svg>
	);
}

export default function ShapeMatrixVisual({ cells }: { cells: ShapeCell[] }) {
	return (
		<div className="mb-6 mx-auto grid max-w-xs grid-cols-3 gap-2">
			{cells.map((cell, index) => (
				<div
					key={index}
					className="flex items-center justify-center rounded"
					style={{
						background: 'rgba(0,0,0,0.55)',
						border: '1px solid rgba(201,162,75,0.25)',
					}}
				>
					<ShapeCellView cell={cell} />
				</div>
			))}
			<div
				data-matrix-missing="true"
				className="flex items-center justify-center rounded text-3xl font-bold"
				style={{
					background: 'rgba(0,0,0,0.35)',
					border: '2px dashed rgba(201,162,75,0.5)',
					color: 'var(--color-brass)',
				}}
			>
				?
			</div>
		</div>
	);
}
