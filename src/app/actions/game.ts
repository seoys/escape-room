'use server';

import { rooms } from '@/lib/rooms-data';

export async function verifyAnswer(roomId: number, answer: string): Promise<boolean> {
  const room = rooms.find(r => r.id === roomId);
  if (!room) return false;
  
  // Normalize string: lower case and completely remove all whitespaces/spaces
  const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '');
  
  const normalizedInput = normalize(answer);
  
  if (Array.isArray(room.answer)) {
    return room.answer.some(a => normalize(a) === normalizedInput);
  }
  
  return normalize(room.answer) === normalizedInput;
}
