import React, { useState, useEffect } from 'react';
import type { Space } from '../../types';
import { getArtifactsBySpaceId } from '../../services/cloudRepository';
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
      const artifacts = await getArtifactsBySpaceId(space.id);
      setArtifactCount(artifacts.length);
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
      className="group relative bg-app-surface border border-border rounded-xl p-3 shadow-sm hover:shadow-md hover:border-border-strong cursor-pointer transition-all duration-150 flex flex-col justify-between h-32 select-none"
    >
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xl shadow-sm border border-black/5"
            style={{ backgroundColor: space.color + '20' }} // Subtle background tint
          >
            {space.icon}
          </div>
          <div>
            <h3 className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors truncate max-w-[150px]">{space.name}</h3>
            <span className="text-[9px] uppercase font-semibold text-text-secondary tracking-wider">{space.template}</span>
          </div>
        </div>

        {/* Action icons on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleFavorite}
            className={`p-0.5 rounded hover:bg-app-hover border border-transparent transition-colors ${space.favorite ? 'text-amber-500' : 'text-text-tertiary'}`}
            title={space.favorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star className="w-3 h-3 fill-current" />
          </button>
          <button 
            onClick={handleArchive}
            className="p-0.5 rounded hover:bg-app-hover text-text-secondary border border-transparent transition-colors"
            title="Archive Space"
          >
            <Archive className="w-3 h-3" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-0.5 rounded hover:bg-app-hover text-error border border-transparent transition-colors"
            title="Delete Space"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-text-secondary line-clamp-1 mt-1 leading-normal flex-1">
        {space.description || 'No description provided.'}
      </p>

      {/* Bottom Section: Progress & Counts */}
      <div className="space-y-1 mt-1.5">
        <div className="flex justify-between items-center text-[9px] text-text-secondary font-medium">
          <span>{artifactCount} Artifacts</span>
          <span>{space.progress}% Complete</span>
        </div>
        <div className="w-full h-1 bg-app-bg rounded-full overflow-hidden">
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
