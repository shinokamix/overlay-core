import { create } from "zustand";

type OverlayState = {
  isVisible: boolean;
  toggleVisibility: () => void;
};

export const useOverlayStore = create<OverlayState>((set) => ({
  isVisible: true,
  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
}));
