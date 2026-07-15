import type { Relationship } from '../../types';
import {
  getRelationshipsByArtifactId,
  getSpaceRelationships,
  createRelationship,
  deleteRelationship
} from '../../services/cloudRepository';

export const relationshipRepository = {
  async getByArtifactId(artifactId: string): Promise<Relationship[]> {
    return getRelationshipsByArtifactId(artifactId);
  },

  async getSpaceRelationships(spaceId: string): Promise<Relationship[]> {
    return getSpaceRelationships(spaceId);
  },

  async create(relationship: Relationship): Promise<string> {
    return createRelationship(relationship);
  },

  async delete(id: string): Promise<void> {
    return deleteRelationship(id);
  }
};
