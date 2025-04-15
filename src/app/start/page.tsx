"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function StartPage() {
  const [name, setName] = useState("");
  const router = useRouter();

  const handleStart = () => {
    if (!name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    // 추후 전역 상태 저장도 가능
    // 예: useGameStore.getState().setPlayerName(name);
    router.push("/escape/1"); // 다음 페이지 경로
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <Image
        src="/images/start_background.png"
        alt="배경 이미지"
        fill
        className="object-cover"
        priority
      />
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl font-bold mb-6 text-orange-800">
            이름을 입력해주세요
          </h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 입력"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={handleStart}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            확인
          </button>
        </div>
      </div>
    </main>
  );
}
