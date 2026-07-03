import { create } from 'zustand';
import type { Space } from '../types';
import { spaceRepository } from '../db/repositories/spaceRepository';
import { useUniverseStore } from './universeStore';

interface SpaceState {
  spaces: Space[];
  activeSpaceId: string | null;
  loading: boolean;
  loadSpaces: () => Promise<void>;
  selectSpace: (id: string | null) => void;
  createSpace: (space: Space) => Promise<string>;
  updateSpace: (id: string, changes: Partial<Space>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
}

export const useSpaceStore = create<SpaceState>((set, get) => ({
  spaces: [],
  activeSpaceId: null,
  loading: false,
  loadSpaces: async () => {
    set({ loading: true });
    try {
      const spaces = await spaceRepository.getAll();
      set({ spaces, loading: false });
    } catch (error) {
      console.error("Error loading spaces", error);
      set({ loading: false });
    }
  },
  selectSpace: (activeSpaceId) => set({ activeSpaceId }),
  createSpace: async (space) => {
    const id = await spaceRepository.create(space);
    await get().loadSpaces();
    useUniverseStore.getState().loadStats();
    return id;
  },
  updateSpace: async (id, changes) => {
    await spaceRepository.update(id, changes);
    await get().loadSpaces();
  },
  deleteSpace: async (id) => {
    await spaceRepository.delete(id);
    if (get().activeSpaceId === id) {
      set({ activeSpaceId: null });
    }
    await get().loadSpaces();
    useUniverseStore.getState().loadStats();
  }
}));
