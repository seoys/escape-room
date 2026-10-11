import { Speaker } from '@/types/room';

export default function StatementsVisual({
	speakers,
}: {
	speakers: Speaker[];
}) {
	return (
		<ul className="mb-6 flex flex-col gap-3">
			{speakers.map(speaker => (
				<li key={speaker.id} className="flex items-start gap-3">
					<span
						className="shrink-0 rounded px-2 py-1 text-xs font-bold tracking-wider"
						style={{
							background: 'rgba(201, 162, 75, 0.15)',
							color: 'var(--color-brass)',
							border: '1px solid rgba(201, 162, 75, 0.35)',
						}}
					>
						{speaker.name}
					</span>
					<span
						className="rounded-lg px-3 py-2 text-sm md:text-base"
						style={{
							background: 'rgba(0, 0, 0, 0.55)',
							border: '1px solid rgba(201, 162, 75, 0.2)',
						}}
					>
						{speaker.says}
					</span>
				</li>
			))}
		</ul>
	);
}
