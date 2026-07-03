export interface Space {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  template: 'learning' | 'project' | 'research' | 'dream' | 'personal' | 'blank';
  favorite: boolean;
  archived: boolean;
  progress: number;
  createdAt: number;
  updatedAt: number;
  settings: Record<string, unknown>;
}

export interface Artifact {
  id: string;
  spaceId: string;
  type: 'knowledge' | 'snippet' | 'bug' | 'idea' | 'resource' | 'media' | 'task' | 'goal' | 'bookmark' | 'document' | 'voice_note';
  title: string;
  description: string;
  status: 'active' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high' | null;
  favorite: boolean;
  archived: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

export interface Block {
  id: string;
  artifactId: string;
  type: string;
  position: number;
  content: unknown;
  metadata: Record<string, unknown>;
}

export interface Relationship {
  id: string;
  sourceArtifactId: string;
  targetArtifactId: string;
  relationshipType: 'related' | 'depends_on' | 'inspired_by' | 'uses' | 'references' | 'parent' | 'child';
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TimelineEvent {
  id: string;
  spaceId: string;
  event: 'space_created' | 'artifact_created' | 'artifact_updated' | 'artifact_archived' | 'goal_completed' | 'relationship_added';
  entityId: string;
  entityType: 'space' | 'artifact';
  timestamp: number;
}

export interface UniverseStats {
  totalSpaces: number;
  totalArtifacts: number;
  streak: number;
}
