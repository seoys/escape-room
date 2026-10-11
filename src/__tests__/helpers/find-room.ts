import assert from 'node:assert/strict';
import { Room } from '@/types/room';

export const roomById = (rooms: Room[], id: number): Room => {
	const room = rooms.find(r => r.id === id);
	assert.ok(room, `room ${id} missing`);
	return room;
};

export const gridOf = (room: Room) => {
	if (room.visual?.kind !== 'grid')
		throw new Error(`room ${room.id} is not a grid`);
	return room.visual;
};

export const noteLinesOf = (room: Room): string[] => {
	if (room.visual?.kind !== 'note')
		throw new Error(`room ${room.id} is not a note`);
	return room.visual.lines;
};
