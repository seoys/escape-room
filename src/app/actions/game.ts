'use server';

import { getRoomsForAgeGroup } from '@/lib/room-selector';
import { AgeGroup } from '@/types/room';

export async function verifyAnswer(
  roomId: number,
  answer: string,
  ageGroup: AgeGroup = 'adult',
): Promise<boolean> {
  const selectedRooms = getRoomsForAgeGroup(ageGroup);
  const room = selectedRooms[roomId - 1];
  if (!room) return false;
  
  // Normalize string: lower case and completely remove all whitespaces/spaces
  const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '');
  
  const normalizedInput = normalize(answer);
  
  if (Array.isArray(room.answer)) {
    return room.answer.some(a => normalize(a) === normalizedInput);
  }
  
  return normalize(room.answer) === normalizedInput;
}
