import type { Block } from '../../types';
import {
  getBlocksByArtifactId,
  saveBlocks
} from '../../services/cloudRepository';

export const blockRepository = {
  async getByArtifactId(artifactId: string): Promise<Block[]> {
    return getBlocksByArtifactId(artifactId);
  },

  async saveBlocks(artifactId: string, blocks: Block[]): Promise<void> {
    return saveBlocks(artifactId, blocks);
  }
};
