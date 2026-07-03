import { db } from '../database';
import type { Block } from '../../types';

export const blockRepository = {
  async getByArtifactId(artifactId: string): Promise<Block[]> {
    return db.blocks
      .where('artifactId')
      .equals(artifactId)
      .sortBy('position');
  },

  async saveBlocks(artifactId: string, blocks: Block[]): Promise<void> {
    await db.transaction('rw', [db.blocks], async () => {
      // Clear existing blocks for this artifact
      await db.blocks.where('artifactId').equals(artifactId).delete();
      // Put new blocks
      if (blocks.length > 0) {
        await db.blocks.bulkPut(blocks);
      }
    });
  }
};
