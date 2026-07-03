import { create } from 'zustand';
import type { Artifact } from '../types';
import { artifactRepository } from '../db/repositories/artifactRepository';
import { searchIndexManager } from '../search/searchIndex';
import { useUniverseStore } from './universeStore';

interface ArtifactState {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  loading: boolean;
  loadArtifacts: () => Promise<void>;
  loadArtifactsBySpace: (spaceId: string) => Promise<void>;
  selectArtifact: (id: string | null) => void;
  createArtifact: (artifact: Artifact) => Promise<string>;
  updateArtifact: (id: string, changes: Partial<Artifact>) => Promise<void>;
  deleteArtifact: (id: string) => Promise<void>;
}

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  artifacts: [],
  activeArtifactId: null,
  loading: false,
  loadArtifacts: async () => {
    set({ loading: true });
    try {
      const artifacts = await artifactRepository.getAll();
      set({ artifacts, loading: false });
    } catch (error) {
      console.error("Error loading artifacts", error);
      set({ loading: false });
    }
  },
  loadArtifactsBySpace: async (spaceId) => {
    set({ loading: true });
    try {
      const artifacts = await artifactRepository.getBySpaceId(spaceId);
      set({ artifacts, loading: false });
    } catch (error) {
      console.error("Error loading space artifacts", error);
      set({ loading: false });
    }
  },
  selectArtifact: (activeArtifactId) => set({ activeArtifactId }),
  createArtifact: async (artifact) => {
    const id = await artifactRepository.create(artifact);
    searchIndexManager.indexArtifact(artifact);
    
    // Refresh list if applicable
    const activeSpaceId = artifact.spaceId;
    if (activeSpaceId) {
      await get().loadArtifactsBySpace(activeSpaceId);
    } else {
      await get().loadArtifacts();
    }
    
    useUniverseStore.getState().loadStats();
    return id;
  },
  updateArtifact: async (id, changes) => {
    await artifactRepository.update(id, changes);
    const updatedObj = await artifactRepository.getById(id);
    if (updatedObj) {
      if (updatedObj.status === 'archived') {
        searchIndexManager.removeArtifact(id);
      } else {
        searchIndexManager.indexArtifact(updatedObj);
      }
      
      const activeSpaceId = updatedObj.spaceId;
      if (activeSpaceId) {
        await get().loadArtifactsBySpace(activeSpaceId);
      }
    }
  },
  deleteArtifact: async (id) => {
    const original = await artifactRepository.getById(id);
    await artifactRepository.delete(id);
    searchIndexManager.removeArtifact(id);
    
    if (get().activeArtifactId === id) {
      set({ activeArtifactId: null });
    }
    
    if (original && original.spaceId) {
      await get().loadArtifactsBySpace(original.spaceId);
    } else {
      await get().loadArtifacts();
    }
    
    useUniverseStore.getState().loadStats();
  }
}));
