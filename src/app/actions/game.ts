'use server';

import { cookies } from 'next/headers';
import { isCorrectAnswer } from '@/lib/answer-check';
import { GAME_ROOMS_COOKIE_KEY, getGameRooms } from '@/lib/room-selector';

export async function verifyAnswer(
  roomId: number,
  answer: string,
  variantId?: string,
): Promise<boolean> {
  const cookieStore = await cookies();
  const selectedRooms = getGameRooms(cookieStore.get(GAME_ROOMS_COOKIE_KEY)?.value);
  const room = selectedRooms[roomId - 1];
  if (!room) return false;
  return isCorrectAnswer(room, answer, variantId);
}
