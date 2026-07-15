import { cloudStorageEngine } from './storage';
import type { Artifact, Block, Relationship, Space, TimelineEvent } from '../types';

const FILE_NAMES = {
  spaces: 'spaces.json',
  artifacts: 'artifacts.json',
  blocks: 'blocks.json',
  relationships: 'relationships.json',
  timelineEvents: 'timelineEvents.json'
} as const;

type FileName = typeof FILE_NAMES[keyof typeof FILE_NAMES];

async function readItems<T>(fileName: FileName): Promise<T[]> {
  try {
    const data = await cloudStorageEngine.readJsonFile(fileName);
    return Array.isArray(data) ? (data as T[]) : [];
  } catch (error) {
    if (error instanceof Error && error.message.includes('No storage adapter connected')) {
      return [];
    }

    try {
      await cloudStorageEngine.writeJsonFile(fileName, []);
    } catch (writeError) {
      console.warn('Could not initialize file during readItems fallback', writeError);
    }
    return [];
  }
}

async function writeItems<T>(fileName: FileName, items: T[]): Promise<void> {
  await cloudStorageEngine.writeJsonFile(fileName, items);
}

async function appendTimelineEvent(event: TimelineEvent): Promise<void> {
  const events = await readItems<TimelineEvent>(FILE_NAMES.timelineEvents);
  events.push(event);
  await writeItems(FILE_NAMES.timelineEvents, events);
}

export async function initializeWorkspace(universeName: string): Promise<void> {
  await cloudStorageEngine.initializeUniverse(universeName);
  await Promise.all(
    Object.values(FILE_NAMES).map(async (fileName) => {
      await readItems(fileName);
    })
  );
}

// Spaces
export async function getAllSpaces(): Promise<Space[]> {
  return await readItems<Space>(FILE_NAMES.spaces);
}

export async function getSpaceById(id: string): Promise<Space | undefined> {
  const spaces = await readItems<Space>(FILE_NAMES.spaces);
  return spaces.find((item) => item.id === id);
}

export async function createSpace(space: Space): Promise<string> {
  const spaces = await readItems<Space>(FILE_NAMES.spaces);
  spaces.push(space);
  await writeItems(FILE_NAMES.spaces, spaces);

  await appendTimelineEvent({
    id: crypto.randomUUID(),
    spaceId: space.id,
    event: 'space_created',
    entityId: space.id,
    entityType: 'space',
    timestamp: Date.now()
  });

  return space.id;
}

export async function updateSpace(id: string, changes: Partial<Space>): Promise<number> {
  const spaces = await readItems<Space>(FILE_NAMES.spaces);
  const index = spaces.findIndex((item) => item.id === id);
  if (index === -1) {
    return 0;
  }

  spaces[index] = { ...spaces[index], ...changes, updatedAt: Date.now() };
  await writeItems(FILE_NAMES.spaces, spaces);
  return 1;
}

export async function deleteSpace(id: string): Promise<void> {
  const spaces = await readItems<Space>(FILE_NAMES.spaces);
  const artifacts = await readItems<Artifact>(FILE_NAMES.artifacts);
  const blocks = await readItems<Block>(FILE_NAMES.blocks);
  const relationships = await readItems<Relationship>(FILE_NAMES.relationships);
  const timelineEvents = await readItems<TimelineEvent>(FILE_NAMES.timelineEvents);

  const artifactsToRemove = artifacts.filter((artifact) => artifact.spaceId === id).map((artifact) => artifact.id);
  const remainingArtifacts = artifacts.filter((artifact) => artifact.spaceId !== id);
  const remainingBlocks = blocks.filter((block) => !artifactsToRemove.includes(block.artifactId));
  const remainingRelationships = relationships.filter(
    (relationship) => !artifactsToRemove.includes(relationship.sourceArtifactId) && !artifactsToRemove.includes(relationship.targetArtifactId)
  );
  const remainingTimelineEvents = timelineEvents.filter(
    (event) => event.spaceId !== id && !artifactsToRemove.includes(event.entityId)
  );
  const remainingSpaces = spaces.filter((space) => space.id !== id);

  await Promise.all([
    writeItems(FILE_NAMES.spaces, remainingSpaces),
    writeItems(FILE_NAMES.artifacts, remainingArtifacts),
    writeItems(FILE_NAMES.blocks, remainingBlocks),
    writeItems(FILE_NAMES.relationships, remainingRelationships),
    writeItems(FILE_NAMES.timelineEvents, remainingTimelineEvents)
  ]);
}

// Artifacts
export async function getAllArtifacts(): Promise<Artifact[]> {
  return await readItems<Artifact>(FILE_NAMES.artifacts);
}

export async function getArtifactsBySpaceId(spaceId: string): Promise<Artifact[]> {
  const artifacts = await readItems<Artifact>(FILE_NAMES.artifacts);
  return artifacts.filter((artifact) => artifact.spaceId === spaceId);
}

export async function getArtifactById(id: string): Promise<Artifact | undefined> {
  const artifacts = await readItems<Artifact>(FILE_NAMES.artifacts);
  return artifacts.find((item) => item.id === id);
}

export async function createArtifact(artifact: Artifact): Promise<string> {
  const artifacts = await readItems<Artifact>(FILE_NAMES.artifacts);
  artifacts.push(artifact);
  await writeItems(FILE_NAMES.artifacts, artifacts);

  await appendTimelineEvent({
    id: crypto.randomUUID(),
    spaceId: artifact.spaceId,
    event: 'artifact_created',
    entityId: artifact.id,
    entityType: 'artifact',
    timestamp: Date.now()
  });

  return artifact.id;
}

export async function updateArtifact(id: string, changes: Partial<Artifact>): Promise<number> {
  const artifacts = await readItems<Artifact>(FILE_NAMES.artifacts);
  const index = artifacts.findIndex((item) => item.id === id);
  if (index === -1) {
    return 0;
  }

  const original = artifacts[index];
  const updated = { ...original, ...changes, updatedAt: Date.now() };
  artifacts[index] = updated;
  await writeItems(FILE_NAMES.artifacts, artifacts);

  if (original) {
    const isArchived = changes.archived === true && !original.archived;
    const eventType = isArchived ? 'artifact_archived' : 'artifact_updated';
    await appendTimelineEvent({
      id: crypto.randomUUID(),
      spaceId: original.spaceId,
      event: eventType,
      entityId: id,
      entityType: 'artifact',
      timestamp: Date.now()
    });
  }

  return 1;
}

export async function deleteArtifact(id: string): Promise<void> {
  const artifacts = await readItems<Artifact>(FILE_NAMES.artifacts);
  const blocks = await readItems<Block>(FILE_NAMES.blocks);
  const relationships = await readItems<Relationship>(FILE_NAMES.relationships);
  const timelineEvents = await readItems<TimelineEvent>(FILE_NAMES.timelineEvents);

  const remainingArtifacts = artifacts.filter((artifact) => artifact.id !== id);
  const remainingBlocks = blocks.filter((block) => block.artifactId !== id);
  const remainingRelationships = relationships.filter(
    (relationship) => relationship.sourceArtifactId !== id && relationship.targetArtifactId !== id
  );
  const remainingTimelineEvents = timelineEvents.filter((event) => event.entityId !== id);

  await Promise.all([
    writeItems(FILE_NAMES.artifacts, remainingArtifacts),
    writeItems(FILE_NAMES.blocks, remainingBlocks),
    writeItems(FILE_NAMES.relationships, remainingRelationships),
    writeItems(FILE_NAMES.timelineEvents, remainingTimelineEvents)
  ]);
}

// Blocks
export async function getBlocksByArtifactId(artifactId: string): Promise<Block[]> {
  const blocks = await readItems<Block>(FILE_NAMES.blocks);
  return blocks.filter((block) => block.artifactId === artifactId).sort((a, b) => a.position - b.position);
}

export async function saveBlocks(artifactId: string, blocks: Block[]): Promise<void> {
  const allBlocks = await readItems<Block>(FILE_NAMES.blocks);
  const remainingBlocks = allBlocks.filter((block) => block.artifactId !== artifactId);
  await writeItems(FILE_NAMES.blocks, [...remainingBlocks, ...blocks]);
}

// Relationships
export async function getRelationshipsByArtifactId(artifactId: string): Promise<Relationship[]> {
  const relationships = await readItems<Relationship>(FILE_NAMES.relationships);
  return relationships.filter(
    (relationship) => relationship.sourceArtifactId === artifactId || relationship.targetArtifactId === artifactId
  );
}

export async function getSpaceRelationships(spaceId: string): Promise<Relationship[]> {
  const artifacts = await readItems<Artifact>(FILE_NAMES.artifacts);
  const artifactIds = new Set(artifacts.filter((artifact) => artifact.spaceId === spaceId).map((artifact) => artifact.id));
  const relationships = await readItems<Relationship>(FILE_NAMES.relationships);
  return relationships.filter(
    (relationship) => artifactIds.has(relationship.sourceArtifactId) && artifactIds.has(relationship.targetArtifactId)
  );
}

export async function createRelationship(relationship: Relationship): Promise<string> {
  const relationships = await readItems<Relationship>(FILE_NAMES.relationships);
  relationships.push(relationship);
  await writeItems(FILE_NAMES.relationships, relationships);

  const artifacts = await readItems<Artifact>(FILE_NAMES.artifacts);
  const source = artifacts.find((artifact) => artifact.id === relationship.sourceArtifactId);
  if (source) {
    await appendTimelineEvent({
      id: crypto.randomUUID(),
      spaceId: source.spaceId,
      event: 'relationship_added',
      entityId: relationship.id,
      entityType: 'artifact',
      timestamp: Date.now()
    });
  }

  return relationship.id;
}

export async function deleteRelationship(id: string): Promise<void> {
  const relationships = await readItems<Relationship>(FILE_NAMES.relationships);
  const remainingRelationships = relationships.filter((relationship) => relationship.id !== id);
  await writeItems(FILE_NAMES.relationships, remainingRelationships);
}

// Timeline
export async function getTimelineEventsBySpaceId(spaceId: string): Promise<TimelineEvent[]> {
  const events = await readItems<TimelineEvent>(FILE_NAMES.timelineEvents);
  return events
    .filter((event) => event.spaceId === spaceId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function getRecentTimelineEvents(limit = 20): Promise<TimelineEvent[]> {
  const events = await readItems<TimelineEvent>(FILE_NAMES.timelineEvents);
  return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}
