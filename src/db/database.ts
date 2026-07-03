import Dexie, { type Table } from 'dexie';
import type { Space, Artifact, Block, Relationship, Tag, TimelineEvent } from '../types';

export class ConstellaDatabase extends Dexie {
  spaces!: Table<Space, string>;
  artifacts!: Table<Artifact, string>;
  blocks!: Table<Block, string>;
  relationships!: Table<Relationship, string>;
  tags!: Table<Tag, string>;
  timelineEvents!: Table<TimelineEvent, string>;

  constructor() {
    super('ConstellaDatabase');
    this.version(1).stores({
      spaces: 'id, name, favorite, archived, createdAt',
      artifacts: 'id, spaceId, type, status, favorite, archived, createdAt, *tags',
      blocks: 'id, artifactId, position',
      relationships: 'id, sourceArtifactId, targetArtifactId, relationshipType',
      tags: 'id, name',
      timelineEvents: 'id, spaceId, event, timestamp'
    });
  }
}

export const db = new ConstellaDatabase();
export default db;
