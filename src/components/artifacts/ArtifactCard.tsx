import React from 'react';
import type { Artifact } from '../../types';
import * as Icons from 'lucide-react';
import { Star, Trash2, Archive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useArtifactStore } from '../../stores/artifactStore';

interface ArtifactCardProps {
  artifact: Artifact;
  onOpen: () => void;
}

const TYPE_CONFIG: Record<Artifact['type'], { icon: keyof typeof Icons; color: string; bg: string }> = {
  knowledge: { icon: 'BookOpen', color: '#5B4EE8', bg: '#EEF2FF' },
  snippet: { icon: 'Code2', color: '#16A34A', bg: '#F0FDF4' },
  bug: { icon: 'Bug', color: '#DC2626', bg: '#FFF1F2' },
  idea: { icon: 'Lightbulb', color: '#D97706', bg: '#FFFBEB' },
  resource: { icon: 'Link', color: '#0284C7', bg: '#F0F9FF' },
  media: { icon: 'Image', color: '#475569', bg: '#F8FAFC' },
  task: { icon: 'CheckSquare', color: '#475569', bg: '#F8FAFC' },
  goal: { icon: 'Target', color: '#7C3AED', bg: '#FAF5FF' },
  bookmark: { icon: 'Bookmark', color: '#EA580C', bg: '#FFF7ED' },
  document: { icon: 'FileText', color: '#737373', bg: '#F5F5F5' },
  voice_note: { icon: 'Mic', color: '#DB2777', bg: '#FDF2F8' },
};

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onOpen }) => {
  const { updateArtifact, deleteArtifact } = useArtifactStore();
  const config = TYPE_CONFIG[artifact.type] || { icon: 'FileText', color: '#737373', bg: '#F5F5F5' };
  const IconComponent = Icons[config.icon] as React.ComponentType<{ className?: string }>;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateArtifact(artifact.id, { favorite: !artifact.favorite });
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateArtifact(artifact.id, { status: artifact.status === 'archived' ? 'active' : 'archived', archived: !artifact.archived });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${artifact.title}"?`)) {
      await deleteArtifact(artifact.id);
    }
  };

  return (
    <div 
      onClick={onOpen}
      className="group relative bg-app-surface border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-border-strong cursor-pointer transition-all duration-150 flex flex-col justify-between h-36 text-left select-none"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          {/* Badge */}
          <span 
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors"
            style={{ backgroundColor: config.bg, color: config.color }}
          >
            {IconComponent && <IconComponent className="w-3 h-3" />}
            <span>{artifact.type}</span>
          </span>

          {/* Hover tools */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleFavorite}
              className={`p-1 rounded hover:bg-app-hover border border-transparent transition-colors ${artifact.favorite ? 'text-amber-500' : 'text-text-tertiary'}`}
              title={artifact.favorite ? 'Unfavorite' : 'Favorite'}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
            </button>
            <button 
              onClick={handleArchive}
              className="p-1 rounded hover:bg-app-hover text-text-secondary border border-transparent transition-colors"
              title="Archive"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleDelete}
              className="p-1 rounded hover:bg-app-hover text-error border border-transparent transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-1 leading-snug">
          {artifact.title}
        </h3>
        {artifact.description && (
          <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
            {artifact.description}
          </p>
        )}
      </div>

      {/* Footer Tags & Date */}
      <div className="flex items-center justify-between mt-3">
        {/* Tags */}
        <div className="flex gap-1 overflow-hidden max-w-[140px]">
          {artifact.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 bg-app-bg text-[10px] text-text-secondary rounded border border-border">
              #{tag}
            </span>
          ))}
          {artifact.tags.length > 2 && (
            <span className="text-[10px] text-text-tertiary">+{artifact.tags.length - 2}</span>
          )}
        </div>

        {/* Date updated */}
        <span className="text-[10px] text-text-tertiary">
          {formatDistanceToNow(artifact.updatedAt)} ago
        </span>
      </div>
    </div>
  );
};
export default ArtifactCard;
