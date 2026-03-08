import { notFound, redirect } from 'next/navigation';
import RoomClient from './RoomClient';
import { cookies } from 'next/headers';
import {
  AGE_GROUP_COOKIE_KEY,
  getRoomsForAgeGroup,
  normalizeAgeGroup,
} from '@/lib/room-selector';
import { TOTAL_ROOMS } from '@/lib/constants';


interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const resolvedParams = await params;
  const parsedRoomId = parseInt(resolvedParams.roomId, 10);
  const cookieStore = await cookies();
  const ageGroup = normalizeAgeGroup(cookieStore.get(AGE_GROUP_COOKIE_KEY)?.value);
  const selectedRooms = getRoomsForAgeGroup(ageGroup);
  
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

  // Sanitize: Security measure to remove answer from client payload
  const sanitizedRoom = {
    id: room.id,
    title: room.title,
    question: room.question,
    hint: room.hint,
    type: room.type,
    difficulty: room.difficulty,
    inputType: room.inputType,
    comboLength: room.comboLength
  };
  const isLastRoom = parsedRoomId === TOTAL_ROOMS;

  return (
    <RoomClient 
      room={sanitizedRoom} 
      roomId={parsedRoomId}
      ageGroup={ageGroup}
      isLastRoom={isLastRoom}
    />
  );
}
