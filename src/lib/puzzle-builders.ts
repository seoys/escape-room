import { ShapeCell, ShapeName, SymbolItem, SymbolRow } from '@/types/room';

const OPERATORS = ['+', '-', '×', '='];

export type SymToken = string | SymbolItem;

export function symRow(tokens: SymToken[], value?: string): SymbolRow {
	const items: SymbolItem[] = tokens.map(token => {
		if (typeof token !== 'string') return token;
		return OPERATORS.includes(token)
			? { op: token as SymbolItem['op'] }
			: { glyph: token };
	});
	return value === undefined ? { items } : { items, value };
}

const SLOTS_BY_COUNT: Record<1 | 2 | 3, number[]> = {
	1: [4],
	2: [3, 5],
	3: [3, 4, 5],
};

export function shapeCell(
	shape: ShapeName,
	filled: boolean,
	count: 1 | 2 | 3,
): ShapeCell {
	return {
		marks: SLOTS_BY_COUNT[count].map(slot => ({ shape, filled, slot })),
	};
}
