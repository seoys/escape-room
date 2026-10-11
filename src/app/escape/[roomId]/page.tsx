import { notFound, redirect } from 'next/navigation';
import RoomClient from './RoomClient';
import { cookies } from 'next/headers';
import {
  LEVEL_COOKIE_KEY,
  getRoomsForLevel,
} from '@/lib/room-selector';
import { normalizeLevel } from '@/lib/level';
import { TOTAL_ROOMS } from '@/lib/constants';
import { toClientRoom } from '@/lib/client-room';


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

  const selectedVariant = room.variants?.length
    ? room.variants[Math.floor(Math.random() * room.variants.length)]
    : undefined;

  // Sanitize: Security measure to remove answer from client payload
  const sanitizedRoom = toClientRoom(room, selectedVariant);
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
