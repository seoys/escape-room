import 'server-only';
import { Room } from '@/types/room';
import { gridRooms } from './grid-rooms';
import { imageRooms } from './image-rooms';
import { noteRooms } from './note-rooms';
import { shapeRooms } from './shape-rooms';
import { statementRooms } from './statement-rooms';
import { symbolRooms } from './symbol-rooms';

// The sample rooms were authored (and are tested) under their original ids. This map
// assigns each one to the Level 1 room it replaces after the Level 1 content rewrite:
// sample id -> final room id. Matching rooms by type keeps Level 1's category mix:
// 연산 1~6, 관찰 7~10, 암호 11/13/15, 추리 16/18/19, 타일배열 24, 도형 28/30.
export const FINAL_ROOM_ID: Record<number, number> = {
	2: 1,
	7: 2,
	12: 3,
	20: 4,
	26: 5,
	16: 6,
	27: 7,
	29: 8,
	23: 9,
	13: 10,
	14: 11,
	4: 13,
	28: 15,
	25: 16,
	17: 18,
	15: 19,
	11: 24,
	8: 28,
	22: 30,
};

export const visualRooms: Room[] = [
	...symbolRooms,
	...gridRooms,
	...noteRooms,
	...statementRooms,
	...shapeRooms,
	...imageRooms,
].map(room => {
	const id = FINAL_ROOM_ID[room.id];
	if (id === undefined)
		throw new Error(`no final room id for sample ${room.id}`);
	return { ...room, id };
});
