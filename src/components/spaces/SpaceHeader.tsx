import React, { useState } from 'react';
import type { Space } from '../../types';
import { Star, Check, Edit2 } from 'lucide-react';
import { useSpaceStore } from '../../stores/spaceStore';

interface SpaceHeaderProps {
  space: Space;
}

export const SpaceHeader: React.FC<SpaceHeaderProps> = ({ space }) => {
  const { updateSpace } = useSpaceStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(space.name);
  const [desc, setDesc] = useState(space.description);
  const [progress, setProgress] = useState(space.progress);

  const handleFavorite = async () => {
    await updateSpace(space.id, { favorite: !space.favorite });
  };

  const handleSave = async () => {
    await updateSpace(space.id, { 
      name: name.trim(), 
      description: desc.trim(),
      progress: Math.min(Math.max(progress, 0), 100)
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-app-surface border border-border rounded-2xl p-5 shadow-sm space-y-4 select-none text-left">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shadow-sm border border-black/5"
            style={{ backgroundColor: space.color + '20' }}
          >
            {space.icon}
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-2 py-1 border border-border rounded-lg bg-app-bg text-text-primary text-base font-bold focus:outline-none"
              />
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-80 block px-2 py-1 border border-border rounded-lg bg-app-bg text-text-secondary text-xs focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <span>{space.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-accent-light text-accent">
                  {space.template}
                </span>
              </h1>
              <p className="text-xs text-text-secondary mt-1">{space.description || 'No description provided.'}</p>
            </div>
          )}
        </div>

        {/* Favorite & Edit Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className={`p-1.5 rounded-lg border border-border hover:bg-app-hover transition-colors ${
              space.favorite ? 'text-amber-500 bg-amber-500/5' : 'text-text-secondary'
            }`}
            title={space.favorite ? 'Unfavorite Space' : 'Favorite Space'}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
          {isEditing ? (
            <button
              onClick={handleSave}
              className="p-1.5 rounded-lg bg-success text-white hover:bg-success/90 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg border border-border hover:bg-app-hover text-text-secondary transition-colors"
              title="Edit Space Details"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress slider bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-t border-border pt-4">
        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs font-semibold text-text-secondary w-20">Space Progress</span>
          {isEditing ? (
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
          ) : (
            <div className="flex-1 h-2 bg-app-bg rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ width: `${space.progress}%`, backgroundColor: space.color }}
              />
            </div>
          )}
          <span className="text-xs font-bold text-text-primary min-w-[30px] text-right">
            {isEditing ? progress : space.progress}%
          </span>
        </div>
      </div>
    </div>
  );
};
export default SpaceHeader;
