import { create } from 'zustand';

interface GameState {
  code: string | null;
  username: string | null;
  gameState: any; // Game state from server
  setCode: (code: string | null) => void;
  setUsername: (username: string | null) => void;
  setGameState: (state: any) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  code: null,
  username: null,
  gameState: null,
  setCode: (code) => set({ code }),
  setUsername: (username) => set({ username }),
  setGameState: (gameState) => set({ gameState }),
  reset: () => set({ code: null, gameState: null }),
}));
