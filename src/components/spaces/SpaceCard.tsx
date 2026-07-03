import React, { useState, useEffect } from 'react';
import type { Space } from '../../types';
import { db } from '../../db/database';
import { Star, Trash2, Archive } from 'lucide-react';
import { useSpaceStore } from '../../stores/spaceStore';
import { useNavigate } from 'react-router-dom';

interface SpaceCardProps {
  space: Space;
}

export const SpaceCard: React.FC<SpaceCardProps> = ({ space }) => {
  const navigate = useNavigate();
  const { updateSpace, deleteSpace, selectSpace } = useSpaceStore();
  const [artifactCount, setArtifactCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const count = await db.artifacts.where('spaceId').equals(space.id).count();
      setArtifactCount(count);
    };
    fetchCount();
  }, [space.id]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateSpace(space.id, { favorite: !space.favorite });
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateSpace(space.id, { archived: !space.archived });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${space.name}" and all of its artifacts? This cannot be undone.`)) {
      await deleteSpace(space.id);
    }
  };

  const handleClick = () => {
    selectSpace(space.id);
    navigate(`/spaces/${space.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="group relative bg-app-surface border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-border-strong cursor-pointer transition-all duration-150 flex flex-col justify-between h-40 select-none"
    >
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl shadow-sm border border-black/5"
            style={{ backgroundColor: space.color + '20' }} // Subtle background tint
          >
            {space.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors truncate max-w-[140px]">{space.name}</h3>
            <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider">{space.template}</span>
          </div>
        </div>

        {/* Action icons on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleFavorite}
            className={`p-1 rounded hover:bg-app-hover border border-transparent transition-colors ${space.favorite ? 'text-amber-500' : 'text-text-tertiary'}`}
            title={space.favorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
          </button>
          <button 
            onClick={handleArchive}
            className="p-1 rounded hover:bg-app-hover text-text-secondary border border-transparent transition-colors"
            title="Archive Space"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1 rounded hover:bg-app-hover text-error border border-transparent transition-colors"
            title="Delete Space"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-text-secondary line-clamp-2 mt-2 leading-relaxed flex-1">
        {space.description || 'No description provided.'}
      </p>

      {/* Bottom Section: Progress & Counts */}
      <div className="space-y-1.5 mt-2">
        <div className="flex justify-between items-center text-[10px] text-text-secondary font-medium">
          <span>{artifactCount} Artifacts</span>
          <span>{space.progress}% Complete</span>
        </div>
        <div className="w-full h-1.5 bg-app-bg rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${space.progress}%`,
              backgroundColor: space.color
            }}
          />
        </div>
      </div>
    </div>
  );
};
