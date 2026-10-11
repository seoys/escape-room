import { Room, RoomVariant } from '@/types/room';

export interface ValidationDeps {
	fileExists: (publicPath: string) => boolean;
}

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, '');

const answersOf = (entry: Room | RoomVariant): string[] =>
	Array.isArray(entry.answer) ? entry.answer : [entry.answer];

function validateEntry(
	entry: Room | RoomVariant,
	label: string,
	deps: ValidationDeps,
): string[] {
	const errors: string[] = [];
	const fail = (message: string) => errors.push(`${label}: ${message}`);

	if (entry.inputType === 'choice') {
		const options = entry.options ?? [];
		if (options.length === 0) {
			fail('choice room needs options');
		} else {
			const values = options.map(option => option.value);
			if (new Set(values).size !== values.length)
				fail('duplicate option values');
			if (!answersOf(entry).some(a => values.includes(a))) {
				fail('answer is not one of the option values');
			}
		}
	}

	for (const option of entry.options ?? []) {
		if (option.image && !deps.fileExists(option.image)) {
			fail(`option image not found: ${option.image}`);
		}
	}

	if (entry.inputType === 'tile-order') {
		const tiles = entry.tiles ?? [];
		const joined = normalize(tiles.join(''));
		if (
			tiles.length === 0 ||
			!answersOf(entry).some(a => normalize(a) === joined)
		) {
			fail('answer must equal the joined tiles');
		}
	}

	if (entry.tileImages) {
		const tiles = entry.tiles ?? [];
		for (const tile of tiles) {
			const src = entry.tileImages[tile];
			if (!src) fail(`tileImages is missing tile ${tile}`);
			else if (!deps.fileExists(src))
				fail(`tile image not found: ${src}`);
		}
	}

	const visual = entry.visual;
	if (visual) {
		switch (visual.kind) {
			case 'image':
				if (!deps.fileExists(visual.src))
					fail(`image not found: ${visual.src}`);
				break;
			case 'grid':
				if (visual.rows.length === 0) fail('grid has no rows');
				break;
			case 'note':
				if (visual.lines.length === 0) fail('note has no lines');
				break;
			case 'symbol-rows':
				if (visual.rows.length === 0) fail('symbol-rows has no rows');
				break;
			case 'shape-matrix':
				if (visual.cells.length !== 8)
					fail('shape-matrix needs exactly 8 cells');
				break;
			case 'statements':
				if (visual.speakers.length === 0)
					fail('statements has no speakers');
				break;
		}
	}

	return errors;
}

export function validateRoom(room: Room, deps: ValidationDeps): string[] {
	return [
		...validateEntry(room, `room ${room.id}`, deps),
		...(room.variants ?? []).flatMap(variant =>
			validateEntry(
				variant,
				`room ${room.id} variant ${variant.variantId}`,
				deps,
			),
		),
	];
}
