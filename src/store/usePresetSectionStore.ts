import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const usePresetSectionStore = create<PresetSectionState>()(
  persist(
    (set) => ({
      pinnedBySection: initialPinnedBySection,
      setPinned: (section, pinned) =>
        set((state) => ({
          pinnedBySection: { ...state.pinnedBySection, [section]: pinned },
        })),
    }),
    { name: 'engchat-preset-section' },
  ),
);
