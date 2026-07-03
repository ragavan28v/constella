import { db } from '../database';
import type { Space } from '../../types';

export const spaceRepository = {
  async getAll(): Promise<Space[]> {
    return db.spaces.toArray();
  },

  async getById(id: string): Promise<Space | undefined> {
    return db.spaces.get(id);
  },

  async create(space: Space): Promise<string> {
    await db.spaces.put(space);
    // Log timeline event
    await db.timelineEvents.put({
      id: crypto.randomUUID(),
      spaceId: space.id,
      event: 'space_created',
      entityId: space.id,
      entityType: 'space',
      timestamp: Date.now()
    });
    return space.id;
  },

  async update(id: string, changes: Partial<Space>): Promise<number> {
    return db.spaces.update(id, { ...changes, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.spaces, db.artifacts, db.blocks, db.relationships, db.timelineEvents], async () => {
      // Find all artifacts in this space
      const artifacts = await db.artifacts.where('spaceId').equals(id).toArray();
      const artifactIds = artifacts.map(a => a.id);

      // Delete blocks for all artifacts
      if (artifactIds.length > 0) {
        await db.blocks.where('artifactId').anyOf(artifactIds).delete();
        await db.relationships.where('sourceArtifactId').anyOf(artifactIds).delete();
        await db.relationships.where('targetArtifactId').anyOf(artifactIds).delete();
      }

      // Delete artifacts
      await db.artifacts.where('spaceId').equals(id).delete();
      
      // Delete timeline events
      await db.timelineEvents.where('spaceId').equals(id).delete();

      // Delete space
      await db.spaces.delete(id);
    });
  }
};
