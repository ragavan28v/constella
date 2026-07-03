import { db } from '../database';
import type { Relationship } from '../../types';

export const relationshipRepository = {
  async getByArtifactId(artifactId: string): Promise<Relationship[]> {
    return db.relationships
      .filter(r => r.sourceArtifactId === artifactId || r.targetArtifactId === artifactId)
      .toArray();
  },

  async getSpaceRelationships(spaceId: string): Promise<Relationship[]> {
    // Get all artifact IDs in this space first
    const artifacts = await db.artifacts.where('spaceId').equals(spaceId).toArray();
    const artifactIds = new Set(artifacts.map(a => a.id));

    // Get all relationships and filter for ones where both source and target are in the space
    return db.relationships
      .filter(r => artifactIds.has(r.sourceArtifactId) && artifactIds.has(r.targetArtifactId))
      .toArray();
  },

  async create(relationship: Relationship): Promise<string> {
    await db.relationships.put(relationship);
    
    // Log relationship creation to timeline
    const source = await db.artifacts.get(relationship.sourceArtifactId);
    if (source) {
      await db.timelineEvents.put({
        id: crypto.randomUUID(),
        spaceId: source.spaceId,
        event: 'relationship_added',
        entityId: relationship.id,
        entityType: 'artifact',
        timestamp: Date.now()
      });
    }

    return relationship.id;
  },

  async delete(id: string): Promise<void> {
    await db.relationships.delete(id);
  }
};
