import { notFound, redirect } from 'next/navigation';
import RoomClient from './RoomClient';
import { cookies } from 'next/headers';
import {
  LEVEL_COOKIE_KEY,
  getRoomsForLevel,
} from '@/lib/room-selector';
import { normalizeLevel } from '@/lib/age-group';
import { TOTAL_ROOMS } from '@/lib/constants';


interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const resolvedParams = await params;
  const parsedRoomId = parseInt(resolvedParams.roomId, 10);
  const cookieStore = await cookies();
  const level = normalizeLevel(cookieStore.get(LEVEL_COOKIE_KEY)?.value);
  const selectedRooms = getRoomsForLevel(level);

  if (!Number.isFinite(parsedRoomId) || parsedRoomId < 1) {
    redirect('/escape/1');
  }

  if (parsedRoomId > TOTAL_ROOMS) {
    redirect('/escape/1');
  }

  const room = selectedRooms[parsedRoomId - 1];

  if (!room) {
    notFound();
  }

  const shuffleTiles = (tiles: string[]): string[] => {
    const arr = [...tiles];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Sanitize: Security measure to remove answer from client payload
  const sanitizedRoom = {
    id: room.id,
    title: room.title,
    question: room.question,
    hint: room.hint,
    type: room.type,
    difficulty: room.difficulty,
    inputType: room.inputType,
    comboLength: room.comboLength,
    tiles: room.tiles ? shuffleTiles(room.tiles) : undefined,
  };
  const isLastRoom = parsedRoomId === TOTAL_ROOMS;

  return (
    <RoomClient
      room={sanitizedRoom}
      roomId={parsedRoomId}
      level={level}
      isLastRoom={isLastRoom}
    />
  );
}
