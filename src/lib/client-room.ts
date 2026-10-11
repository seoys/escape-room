import { ClientRoom, Room, RoomVariant } from '@/types/room';

export function shuffleItems<T>(items: T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

// Whitelist of fields that may reach the browser: never pass `answer` or `variants`.
export function toClientRoom(
	room: Room,
	variant: RoomVariant | undefined,
	shuffle: <T>(items: T[]) => T[] = shuffleItems,
): ClientRoom {
	const playable = variant ?? room;
	return {
		id: room.id,
		variantId: variant?.variantId,
		title: playable.title,
		question: playable.question,
		hint: playable.hint,
		type: playable.type,
		difficulty: playable.difficulty,
		inputType: playable.inputType,
		comboLength: playable.comboLength,
		tiles: playable.tiles ? shuffle(playable.tiles) : undefined,
		tileImages: playable.tileImages,
		visual: playable.visual,
		options: playable.options,
	};
}
