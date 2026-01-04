'use server';

import { rooms } from '@/lib/rooms-data';

export async function verifyAnswer(roomId: number, answer: string): Promise<boolean> {
  const room = rooms.find(r => r.id === roomId);
  if (!room) return false;
  
  return room.answer.toLowerCase().trim() === answer.toLowerCase().trim();
}
