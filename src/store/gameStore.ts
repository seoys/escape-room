import { create } from "zustand";
import { GameState } from "@/types/room";

interface GameStore extends GameState {
  initGame: () => void;
  setCurrentRoom: (roomId: number) => void;
  consumeHint: () => void;
  completeRoom: (roomId: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  currentRoom: 1,
  hintsRemaining: 3,
  completedRooms: [],
  startTime: undefined,
  endTime: undefined,

  initGame: () => {
    localStorage.removeItem("currentRoom");
    set({
      currentRoom: 1,
      hintsRemaining: 3,
      completedRooms: [],
      startTime: new Date(),
      endTime: undefined,
    });
  },

  setCurrentRoom: (roomId) => {
    localStorage.setItem("currentRoom", roomId.toString());
    set({ currentRoom: roomId });
  },

  consumeHint: () =>
    set((state) => ({
      hintsRemaining: Math.max(0, state.hintsRemaining - 1),
    })),

  completeRoom: (roomId) =>
    set((state) => {
      const completedRooms = [...state.completedRooms, roomId];
      const endTime = roomId === 10 ? new Date() : state.endTime;
      return { completedRooms, endTime };
    }),
}));
