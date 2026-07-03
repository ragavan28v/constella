import { db } from '../database';
import type { Artifact } from '../../types';

export const artifactRepository = {
  async getAll(): Promise<Artifact[]> {
    return db.artifacts.toArray();
  },

  async getBySpaceId(spaceId: string): Promise<Artifact[]> {
    return db.artifacts.where('spaceId').equals(spaceId).toArray();
  },

  async getById(id: string): Promise<Artifact | undefined> {
    return db.artifacts.get(id);
  },

  async create(artifact: Artifact): Promise<string> {
    await db.artifacts.put(artifact);
    
    // Log timeline event
    await db.timelineEvents.put({
      id: crypto.randomUUID(),
      spaceId: artifact.spaceId,
      event: 'artifact_created',
      entityId: artifact.id,
      entityType: 'artifact',
      timestamp: Date.now()
    });
    
    return artifact.id;
  },

  async update(id: string, changes: Partial<Artifact>): Promise<number> {
    const original = await db.artifacts.get(id);
    const updated = await db.artifacts.update(id, { ...changes, updatedAt: Date.now() });
    
    if (original) {
      const isArchived = changes.archived === true && !original.archived;
      const eventType = isArchived ? 'artifact_archived' : 'artifact_updated';
      
      await db.timelineEvents.put({
        id: crypto.randomUUID(),
        spaceId: original.spaceId,
        event: eventType,
        entityId: id,
        entityType: 'artifact',
        timestamp: Date.now()
      });
    }
    
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.artifacts, db.blocks, db.relationships, db.timelineEvents], async () => {
      const original = await db.artifacts.get(id);
      if (original) {
        // Delete all blocks for this artifact
        await db.blocks.where('artifactId').equals(id).delete();
        // Delete relationships
        await db.relationships.where('sourceArtifactId').equals(id).delete();
        await db.relationships.where('targetArtifactId').equals(id).delete();
        // Delete artifact itself
        await db.artifacts.delete(id);
        
        // Log delete or cleanup events if needed
        await db.timelineEvents.where('entityId').equals(id).delete();
      }
    });
  }
};
