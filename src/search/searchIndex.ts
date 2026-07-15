import { Index } from 'flexsearch';
import type { Artifact } from '../types';
import { cloudStorageEngine } from '../services/storage';
import { getAllArtifacts } from '../services/cloudRepository';

// Instantiate index with default tokenization
const searchIndex = new Index({
  tokenize: 'forward'
});

// Map to store quick reference details of indexed documents
const documentMap = new Map<string, { id: string; title: string; spaceId: string; type: string; tags: string[] }>();

export const searchIndexManager = {
  indexArtifact(artifact: Artifact) {
    const textToIndex = `${artifact.title} ${artifact.description || ''} ${artifact.tags.join(' ')}`;
    searchIndex.add(artifact.id, textToIndex);
    documentMap.set(artifact.id, {
      id: artifact.id,
      title: artifact.title,
      spaceId: artifact.spaceId,
      type: artifact.type,
      tags: artifact.tags
    });
  },

  removeArtifact(id: string) {
    searchIndex.remove(id);
    documentMap.delete(id);
  },

  async initialize() {
    if (!cloudStorageEngine.isConnected()) {
      return;
    }

    searchIndex.clear();
    documentMap.clear();
    
    const artifacts = await getAllArtifacts();
    for (const artifact of artifacts) {
      if (artifact.status !== 'archived') {
        this.indexArtifact(artifact);
      }
    }
  },

  search(query: string) {
    if (!query.trim()) return [];
    
    const results = searchIndex.search(query, 10);
    return results.map(id => documentMap.get(id as string)).filter(Boolean);
  }
};
