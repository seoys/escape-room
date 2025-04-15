"use client";
import { useGameStore } from "@/store/gameStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { initGame } = useGameStore();
  const router = useRouter();
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    const currentRoom = localStorage.getItem("currentRoom");
    setHasProgress(!!currentRoom && currentRoom !== "1");
  }, []);

  const handleStartClick = () => {
    initGame();
    router.push("/start");
  };

  // const handleContinueClick = () => {
  //   const currentRoom = localStorage.getItem("currentRoom");
  //   if (currentRoom) {
  //     router.push(`/escape/${currentRoom}`);
  //   }
  // };

  return (
    <main className="main-background">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div
          className="start-button mb-4 -translate-y-50"
          onClick={handleStartClick}
          aria-label="게임 시작하기"
          role="button"
          tabIndex={0}
        />
      </div>
    </main>
  );
}
