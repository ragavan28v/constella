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
    <div className="bg-app-surface border border-border rounded-xl p-3.5 shadow-sm select-none text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl shadow-sm border border-black/5"
            style={{ backgroundColor: space.color + '20' }}
          >
            {space.icon}
          </div>
          {isEditing ? (
            <div className="space-y-1.5 flex flex-col">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-2 py-0.5 border border-border rounded-lg bg-app-bg text-text-primary text-sm font-bold focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-16 px-1 py-0.5 border border-border rounded bg-app-bg text-xs font-bold focus:outline-none text-center"
                />
                <span className="text-xs text-text-secondary">%</span>
              </div>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-80 block px-2 py-0.5 border border-border rounded bg-app-bg text-text-secondary text-xs focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-0.5">
              <h1 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <span>{space.name}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-accent-light text-accent">
                  {space.template}
                </span>
              </h1>
              <p className="text-xs text-text-secondary">{space.description || 'No description provided.'}</p>
              
              {/* Progress bar directly underneath */}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="w-20 h-1 bg-app-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ width: `${space.progress}%`, backgroundColor: space.color }}
                  />
                </div>
                <span className="text-[10px] font-bold text-text-secondary">{space.progress}% complete</span>
              </div>
            </div>
          )}
        </div>

        {/* Favorite & Edit Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className={`p-1 rounded hover:bg-app-hover border border-border transition-colors ${
              space.favorite ? 'text-amber-500 bg-amber-500/5' : 'text-text-secondary'
            }`}
            title={space.favorite ? 'Unfavorite Space' : 'Favorite Space'}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
          </button>
          {isEditing ? (
            <button
              onClick={handleSave}
              className="p-1 rounded bg-success text-white hover:bg-success/90 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded border border-border hover:bg-app-hover text-text-secondary transition-colors"
              title="Edit Space Details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default SpaceHeader;
