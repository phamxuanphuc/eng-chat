import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

export type PresetSection = 'translate' | 'rewrite' | 'improve' | 'summary';

type PresetSectionState = {
  pinnedBySection: Record<PresetSection, boolean>;
  setPinned: (section: PresetSection, pinned: boolean) => void;
};

const initialPinnedBySection: Record<PresetSection, boolean> = {
  translate: false,
  rewrite: false,
  improve: false,
  summary: false,
};

const memoryStorage = new Map<string, string>();
const storage: StateStorage = {
  getItem: (name) => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(name) : memoryStorage.get(name) ?? null;
    } catch {
      return memoryStorage.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
        return;
      }
    } catch {}
    memoryStorage.set(name, value);
  },
  removeItem: (name) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
        return;
      }
    } catch {}
    memoryStorage.delete(name);
  },
};

export const usePresetSectionStore = create<PresetSectionState>()(
  persist(
    (set) => ({
      pinnedBySection: initialPinnedBySection,
      setPinned: (section, pinned) =>
        set((state) => ({
          pinnedBySection: { ...state.pinnedBySection, [section]: pinned },
        })),
    }),
    { name: 'engchat-preset-section', storage: createJSONStorage(() => storage) },
  ),
);
