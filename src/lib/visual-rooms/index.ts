import 'server-only';
import { Room } from '@/types/room';
import { gridRooms } from './grid-rooms';
import { imageRooms } from './image-rooms';
import { noteRooms } from './note-rooms';
import { shapeRooms } from './shape-rooms';
import { statementRooms } from './statement-rooms';
import { symbolRooms } from './symbol-rooms';

export const visualRooms: Room[] = [
	...symbolRooms,
	...gridRooms,
	...noteRooms,
	...statementRooms,
	...shapeRooms,
	...imageRooms,
];
