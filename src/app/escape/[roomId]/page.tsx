import { rooms } from '@/lib/rooms-data';
import { notFound, redirect } from 'next/navigation';
import RoomClient from './RoomClient';


interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const resolvedParams = await params;
  const parsedRoomId = parseInt(resolvedParams.roomId, 10);
  
  if (!Number.isFinite(parsedRoomId) || parsedRoomId < 1) {
    redirect('/escape/1');
  }

  const room = rooms.find(r => r.id === parsedRoomId);

  if (!room) {
    if (parsedRoomId > rooms.length) {
       redirect('/escape/1');
    }
    notFound(); 
  }

  // Sanitize: Security measure to remove answer from client payload
  const sanitizedRoom = {
    id: room.id,
    title: room.title,
    question: room.question,
    hint: room.hint,
    type: room.type,
    difficulty: room.difficulty
  };
  const isLastRoom = room.id === rooms[rooms.length - 1]?.id;

  return (
    <RoomClient 
      room={sanitizedRoom} 
      roomId={room.id}
      isLastRoom={isLastRoom}
    />
  );
}
