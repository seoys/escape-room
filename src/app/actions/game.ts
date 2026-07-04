'use server';

import { getRoomsForLevel } from '@/lib/room-selector';
import { Level } from '@/types/room';

export async function verifyAnswer(
  roomId: number,
  answer: string,
  level: Level = 2,
  variantId?: string,
): Promise<boolean> {
  const selectedRooms = getRoomsForLevel(level);
  const room = selectedRooms[roomId - 1];
  if (!room) return false;
  const answerSource =
    variantId && room.variants
      ? room.variants.find(variant => variant.variantId === variantId) ?? room
      : room;

  // Normalize string: lower case and completely remove all whitespaces/spaces
  const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '');

  const normalizedInput = normalize(answer);

  if (Array.isArray(answerSource.answer)) {
    return answerSource.answer.some(a => normalize(a) === normalizedInput);
  }

  return normalize(answerSource.answer) === normalizedInput;
}
