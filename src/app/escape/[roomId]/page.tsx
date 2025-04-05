"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { rooms } from "@/lib/rooms";
import { Black_Han_Sans } from "next/font/google";

const blackHanSans = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const getQuestionEmoji = (type: string) => {
  switch (type) {
    case "number_pattern":
      return "🔢";
    case "ox_quiz":
      return "❓";
    case "drag_sort":
      return "📋";
    case "caesar_cipher":
      return "🔐";
    case "hidden_clue":
      return "🔍";
    case "maze_escape":
      return "🌟";
    case "spot_difference":
      return "👀";
    case "word_combination":
      return "📝";
    case "number_lock":
      return "🔒";
    case "icon_cipher":
      return "🎯";
    default:
      return "❓";
  }
};

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = parseInt(params.roomId as string);
  const {
    currentRoom,
    hintsRemaining,
    consumeHint,
    completeRoom,
    setCurrentRoom,
  } = useGameStore();
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedRoom = localStorage.getItem("currentRoom");
    if (savedRoom) {
      setCurrentRoom(parseInt(savedRoom));
    }
  }, []);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const room = rooms.find((r) => r.id === roomId);
        if (!room || roomId !== currentRoom) {
          router.push("/escape/" + currentRoom);
          return;
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load room:", err);
        router.push("/");
      }
    };
    loadRoom();
  }, [roomId, currentRoom, router]);

  const room = rooms.find((r) => r.id === roomId);
  if (isLoading || !room) return <div className="text-white">Loading...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.toLowerCase() === room.answer.toLowerCase()) {
      completeRoom(roomId);
      if (roomId === 10) {
        router.push("/finish");
      } else {
        setCurrentRoom(roomId + 1);
        router.push(`/escape/${roomId + 1}`);
      }
    } else {
      setError("틀렸습니다. 다시 시도해보세요.");
      setTimeout(() => setError(""), 2000);
    }
  };

  const handleHint = () => {
    if (hintsRemaining > 0) {
      consumeHint();
      setShowHint(true);
    }
  };

  const handleBack = () => {
    if (roomId === 1) {
      router.push("/");
    } else {
      setCurrentRoom(roomId - 1);
      router.push(`/escape/${roomId - 1}`);
    }
  };

  return (
    <div className="min-h-screen w-full relative">
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(/images/escape_room_${roomId}.png)`,
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          zIndex: -1,
        }}
      />
      <div className="py-20">
        <div className="bg-black/80 w-[80%] max-w-6xl mx-auto rounded-3xl p-8 md:p-16 backdrop-blur-sm">
          <div style={{ height: "70px" }}></div>
          <h2
            className={`${blackHanSans.className} md:text-6xl text-center mb-8 md:mb-12 tracking-wider text-white`}
            style={{ color: "#ffffff" }}
          >
            ROOM_{roomId}: {room.title}
          </h2>
          <div className="bg-slate-800/90 p-12 rounded-3xl mb-12 border-4 border-amber-500/50">
            <div style={{ height: "30px" }}></div>
            <div
              className="text-7xl mb-10 text-center"
              style={{ color: "#ffffff" }}
            >
              {getQuestionEmoji(room.type)}
            </div>
            <p
              className="text-4xl text-center font-medium tracking-wide leading-relaxed whitespace-pre-wrap"
              style={{ color: "#ffffff" }}
            >
              {room.question}
            </p>
            <div style={{ height: "30px" }}></div>
          </div>
          <div style={{ height: "10px" }}></div>
          {showHint && (
            <div
              className="bg-amber-900/50 p-10 rounded-3xl mb-12 border-4 border-amber-400/30"
              style={{ color: "#ffffff" }}
            >
              <p className="text-2xl text-amber-100 font-medium tracking-wide">
                💡 힌트: {room.hint}
              </p>
            </div>
          )}
          <div style={{ height: "10px" }}></div>
          {error && (
            <div
              className="bg-red-950/50 p-10 rounded-3xl mb-12 border-4 border-red-600/30"
              style={{ color: "#ffffff" }}
            >
              <p className="text-2xl text-white text-center font-medium">
                {error}
              </p>
            </div>
          )}
          <div style={{ height: "20px" }}></div>
          <form onSubmit={handleSubmit} className="space-y-14">
            <div className="relative">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="정답을 입력하세요"
                className="w-full h-80 px-16 py-20 bg-gray-900/90 rounded-3xl 
                          text-6xl text-center text-white placeholder-gray-500 
                          border-4 border-yellow-900/50 
                          focus:border-yellow-600/50 focus:outline-none 
                          transition-all duration-300
                          shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)]
                          focus:shadow-[inset_0_4px_8px_rgba(0,0,0,0.6),0_0_30px_rgba(234,179,8,0.2)]
                          resize-none
                          font-['Courier_New'] tracking-wider
                          bg-[url('/images/old-paper-texture.png')] bg-cover bg-center bg-blend-multiply
                          hover:bg-gray-800/90"
              />
            </div>
            <div className="flex gap-10">
              <button
                type="submit"
                className="flex-1 h-32 
                          bg-gradient-to-b from-green-900 to-green-950 
                          hover:from-green-800 hover:to-green-900
                          rounded-3xl text-5xl font-bold text-white tracking-wider
                          transition-all duration-300 transform
                          hover:scale-[1.02] active:scale-[0.98]
                          border-4 border-green-900/50 
                          shadow-[0_6px_0_rgb(20,83,45),0_12px_16px_rgba(0,0,0,0.4)]
                          hover:shadow-[0_4px_0_rgb(20,83,45),0_8px_12px_rgba(0,0,0,0.4)]
                          active:shadow-none"
              >
                제출하기
              </button>
              <button
                type="button"
                onClick={handleHint}
                disabled={hintsRemaining === 0 || showHint}
                className={`flex-1 h-32 rounded-3xl text-5xl font-bold tracking-wide
                          transition-all duration-300 transform
                          ${
                            hintsRemaining > 0 && !showHint
                              ? "bg-gradient-to-b from-blue-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 text-white border-4 border-blue-900/50 shadow-[0_6px_0_rgb(30,58,138),0_12px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_0_rgb(30,58,138),0_8px_12px_rgba(0,0,0,0.4)] hover:scale-[1.02] active:scale-[0.98] active:shadow-none"
                              : "bg-gray-900 text-gray-600 border-4 border-gray-800 cursor-not-allowed"
                          }`}
              >
                힌트 ({hintsRemaining})
              </button>
            </div>
            <div className="mt-10 flex gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 h-20
                          bg-gradient-to-b from-purple-800 to-purple-900
                          hover:from-purple-700 hover:to-purple-800
                          rounded-3xl text-3xl font-bold text-white tracking-wider
                          transition-all duration-300 transform
                          hover:scale-[1.02] active:scale-[0.98]
                          border-4 border-purple-700/50
                          shadow-[0_4px_0_rgb(88,28,135),0_8px_12px_rgba(0,0,0,0.4)]
                          hover:shadow-[0_2px_0_rgb(88,28,135),0_4px_8px_rgba(0,0,0,0.4)]
                          active:shadow-none"
              >
                뒤로가기
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex-1 h-20
                          bg-gradient-to-b from-indigo-800 to-indigo-900
                          hover:from-indigo-700 hover:to-indigo-800
                          rounded-3xl text-3xl font-bold text-white tracking-wider
                          transition-all duration-300 transform
                          hover:scale-[1.02] active:scale-[0.98]
                          border-4 border-indigo-700/50
                          shadow-[0_4px_0_rgb(67,56,202),0_8px_12px_rgba(0,0,0,0.4)]
                          hover:shadow-[0_2px_0_rgb(67,56,202),0_4px_8px_rgba(0,0,0,0.4)]
                          active:shadow-none"
              >
                메인으로
              </button>
            </div>
          </form>
          {/* <div className="text-2xl text-white text-center mt-14 font-medium tracking-wider">
            진행: {completedRooms.length}/10
          </div> */}
        </div>
      </div>
    </div>
  );
}
