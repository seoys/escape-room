import { notFound, redirect } from 'next/navigation';
import RoomClient from './RoomClient';
import { cookies } from 'next/headers';
import {
  LEVEL_COOKIE_KEY,
  getRoomsForLevel,
} from '@/lib/room-selector';
import { normalizeLevel } from '@/lib/level';
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

  const selectedVariant = room.variants?.length
    ? room.variants[Math.floor(Math.random() * room.variants.length)]
    : undefined;
  const playableRoom = selectedVariant ?? room;

  // Sanitize: Security measure to remove answer from client payload
  const sanitizedRoom = {
    id: room.id,
    variantId: selectedVariant?.variantId,
    title: playableRoom.title,
    question: playableRoom.question,
    hint: playableRoom.hint,
    type: playableRoom.type,
    difficulty: playableRoom.difficulty,
    inputType: playableRoom.inputType,
    comboLength: playableRoom.comboLength,
    tiles: playableRoom.tiles ? shuffleTiles(playableRoom.tiles) : undefined,
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
