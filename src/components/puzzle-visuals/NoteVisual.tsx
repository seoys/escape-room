interface NoteVisualProps {
	title?: string;
	lines: string[];
	style?: 'diary' | 'list' | 'warning';
}

const BORDER_BY_STYLE: Record<NonNullable<NoteVisualProps['style']>, string> = {
	diary: '1px solid rgba(60, 42, 20, 0.35)',
	list: '1px solid rgba(60, 42, 20, 0.35)',
	warning: '2px solid #8b2a1d',
};

export default function NoteVisual({
	title,
	lines,
	style = 'list',
}: NoteVisualProps) {
	return (
		<div
			data-note-style={style}
			className="mb-6 mx-auto max-w-md rounded px-5 py-4 shadow-lg"
			style={{
				background: '#e9dcbc',
				color: '#2a2418',
				border: BORDER_BY_STYLE[style],
			}}
		>
			{title && (
				<div className="mb-2 border-b border-[rgba(60,42,20,0.35)] pb-1 text-sm font-bold">
					{title}
				</div>
			)}
			<ul className="flex flex-col gap-1">
				{lines.map((line, index) => (
					<li
						key={index}
						className={`border-b border-[rgba(60,42,20,0.18)] py-1 text-sm md:text-base ${style === 'diary' ? 'italic' : ''}`}
					>
						{line}
					</li>
				))}
			</ul>
		</div>
	);
}
