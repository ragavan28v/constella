import type { Artifact } from '../../types';
import {
  getAllArtifacts,
  getArtifactsBySpaceId,
  getArtifactById,
  createArtifact,
  updateArtifact,
  deleteArtifact
} from '../../services/cloudRepository';

export const artifactRepository = {
  async getAll(): Promise<Artifact[]> {
    return getAllArtifacts();
  },

  async getBySpaceId(spaceId: string): Promise<Artifact[]> {
    return getArtifactsBySpaceId(spaceId);
  },

  async getById(id: string): Promise<Artifact | undefined> {
    return getArtifactById(id);
  },

  async create(artifact: Artifact): Promise<string> {
    return createArtifact(artifact);
  },

  async update(id: string, changes: Partial<Artifact>): Promise<number> {
    return updateArtifact(id, changes);
  },

  async delete(id: string): Promise<void> {
    return deleteArtifact(id);
  }
};
