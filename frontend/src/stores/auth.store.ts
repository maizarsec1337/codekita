import { create } from "zustand";
import type { SessionPayload } from "@codekita/shared";

interface AuthState {
  user: SessionPayload | null;
  isLoading: boolean;
  setUser: (user: SessionPayload | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));