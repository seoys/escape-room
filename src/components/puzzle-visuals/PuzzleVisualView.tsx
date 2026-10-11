import { PuzzleVisual } from '@/types/room';
import GridVisual from './GridVisual';
import ImageVisual from './ImageVisual';
import NoteVisual from './NoteVisual';
import ShapeMatrixVisual from './ShapeMatrixVisual';
import StatementsVisual from './StatementsVisual';
import SymbolRowsVisual from './SymbolRowsVisual';

export default function PuzzleVisualView({
	visual,
}: {
	visual?: PuzzleVisual;
}) {
	if (!visual) return null;
	switch (visual.kind) {
		case 'image':
			return (
				<ImageVisual
					src={visual.src}
					alt={visual.alt}
					width={visual.width}
					height={visual.height}
				/>
			);
		case 'grid':
			return <GridVisual rows={visual.rows} caption={visual.caption} />;
		case 'note':
			return (
				<NoteVisual
					title={visual.title}
					lines={visual.lines}
					style={visual.style}
				/>
			);
		case 'symbol-rows':
			return (
				<SymbolRowsVisual
					rows={visual.rows}
					background={visual.background}
				/>
			);
		case 'shape-matrix':
			return <ShapeMatrixVisual cells={visual.cells} />;
		case 'statements':
			return <StatementsVisual speakers={visual.speakers} />;
		default:
			console.warn(
				'Unknown puzzle visual kind',
				(visual as { kind?: unknown }).kind,
			);
			return null;
	}
}
