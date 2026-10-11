import { SymbolItem, SymbolRow } from '@/types/room';

interface SymbolRowsVisualProps {
	rows: SymbolRow[];
	background?: 'none' | 'clock';
}

function ClockFace() {
	return (
		<svg
			data-background="clock"
			aria-hidden="true"
			viewBox="0 0 200 200"
			className="pointer-events-none absolute inset-0 m-auto h-full max-h-72 w-full opacity-15"
		>
			<circle
				cx="100"
				cy="100"
				r="92"
				fill="none"
				stroke="#c9a24b"
				strokeWidth="4"
			/>
			{Array.from({ length: 12 }, (_, index) => {
				const angle = (index * Math.PI) / 6;
				return (
					<line
						key={index}
						x1={100 + 80 * Math.sin(angle)}
						y1={100 - 80 * Math.cos(angle)}
						x2={100 + 90 * Math.sin(angle)}
						y2={100 - 90 * Math.cos(angle)}
						stroke="#c9a24b"
						strokeWidth="4"
					/>
				);
			})}
		</svg>
	);
}

function Item({ item }: { item: SymbolItem }) {
	if (item.color) {
		return (
			<span
				role="img"
				aria-label={`${item.label ?? '색깔'} 등불`}
				className="inline-flex h-7 w-7 items-center justify-center rounded-full"
				style={{
					background: item.color,
					border: '2px solid rgba(255,255,255,0.35)',
				}}
			>
				{item.label && (
					<span className="text-[10px] font-bold leading-none text-white">
						{[...item.label][0]}
					</span>
				)}
			</span>
		);
	}
	if (item.op)
		return <span className="text-xl text-[#a38a4a]">{item.op}</span>;
	return <span className="text-2xl md:text-3xl">{item.glyph}</span>;
}

export default function SymbolRowsVisual({
	rows,
	background = 'none',
}: SymbolRowsVisualProps) {
	return (
		<div
			className="relative mb-6 mx-auto flex max-w-md flex-col gap-3 rounded px-4 py-5"
			style={{
				background: 'rgba(0,0,0,0.55)',
				border: '1px solid rgba(201,162,75,0.25)',
			}}
		>
			{background === 'clock' && <ClockFace />}
			{rows.map((row, rowIndex) => (
				<div
					key={rowIndex}
					className="relative flex flex-wrap items-center justify-center gap-2 text-[#e9dcbc]"
				>
					{row.items.map((item, itemIndex) => (
						<Item key={itemIndex} item={item} />
					))}
					<span className="text-xl text-[#a38a4a]">=</span>
					<span className="min-w-8 text-2xl font-bold md:text-3xl">
						{row.value ?? '?'}
					</span>
				</div>
			))}
		</div>
	);
}
