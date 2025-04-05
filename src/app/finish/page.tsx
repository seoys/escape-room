"use client";
import Link from "next/link";
import { useGameStore } from "@/store/gameStore";
import Image from "next/image";

export default function FinishPage() {
  const { startTime, endTime } = useGameStore();

  const calculateTime = () => {
    if (!startTime || !endTime) return "시간 정보 없음";
    const diff = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}분 ${seconds}초`;
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <Image
        src="/images/finish_background.png"
        alt="배경 이미지"
        fill
        className="object-cover"
        priority
      />
      <div className="relative z-10 max-w-2xl w-full mx-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-4xl font-bold mb-6 text-orange-800">
            🎉 축하합니다!
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            모든 방을 성공적으로 탈출했습니다!
          </p>
          <div className="bg-orange-50 p-6 rounded-xl mb-8 shadow-inner">
            <p className="text-lg font-medium text-orange-900">
              총 소요 시간: {calculateTime()}
            </p>
          </div>
          <Link
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            처음으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
