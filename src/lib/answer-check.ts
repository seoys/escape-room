import { Room } from '@/types/room';

// Lower case and drop every whitespace character before comparing.
const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, '');

export function isCorrectAnswer(
	room: Room,
	answer: string,
	variantId?: string,
): boolean {
	const source =
		variantId && room.variants
			? (room.variants.find(variant => variant.variantId === variantId) ??
				room)
			: room;
	const input = normalize(answer);
	const accepted = Array.isArray(source.answer)
		? source.answer
		: [source.answer];
	return accepted.some(candidate => normalize(candidate) === input);
}
