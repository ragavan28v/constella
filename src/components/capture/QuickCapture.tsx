import React, { useState, useEffect, useRef } from 'react';
import { useSpaceStore } from '../../stores/spaceStore';
import { useArtifactStore } from '../../stores/artifactStore';
import type { Artifact } from '../../types';
import { X, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickCaptureProps {
  onClose: () => void;
}

const ARTIFACT_TYPES = [
  'knowledge', 'snippet', 'bug', 'idea', 'resource', 'task', 'goal', 'bookmark'
] as const;

export const QuickCapture: React.FC<QuickCaptureProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { spaces, activeSpaceId, selectSpace } = useSpaceStore();
  const { createArtifact } = useArtifactStore();

  const [type, setType] = useState<Artifact['type']>('knowledge');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [spaceId, setSpaceId] = useState(activeSpaceId || '');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCapture = async (openAfterSave: boolean) => {
    if (!title.trim() || !spaceId) return;

    const newArt: Artifact = {
      id: crypto.randomUUID(),
      spaceId,
      type,
      title: title.trim(),
      description: body.trim(),
      status: 'active',
      priority: null,
      favorite: false,
      archived: false,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {}
    };

    const id = await createArtifact(newArt);
    onClose();

    if (openAfterSave) {
      selectSpace(spaceId);
      navigate(`/spaces/${spaceId}?artifact=${id}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-app-surface w-full max-w-lg rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-app-bg">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5 select-none">
            <BookOpen className="w-4 h-4 text-accent" />
            <span>Quick Capture Node</span>
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-app-hover text-text-secondary border border-transparent hover:border-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-left">
          {/* Type Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary select-none">Type</label>
            <div className="flex flex-wrap gap-2">
              {ARTIFACT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize select-none transition-colors border ${
                    type === t 
                      ? 'bg-accent/10 border-accent text-accent' 
                      : 'bg-app-bg border-border text-text-secondary hover:text-text-primary hover:bg-app-hover'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary select-none">Title *</label>
            <input
              ref={inputRef}
              type="text"
              required
              placeholder="e.g. Redux Toolkit boilerplate, Idea for layout"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-app-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          {/* Content Body */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary select-none">Context / Description</label>
            <textarea
              placeholder="Dump initial raw thoughts or descriptions here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-app-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 h-24 resize-none"
            />
          </div>

          {/* Space dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary select-none">Space *</label>
            <select
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-app-bg text-text-primary text-sm focus:outline-none"
            >
              <option value="">Select space target...</option>
              {spaces.filter(s => !s.archived).map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-5 py-3 border-t border-border bg-app-bg flex justify-end gap-3 select-none">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border bg-app-surface text-text-secondary rounded-lg text-xs font-medium hover:bg-app-hover"
          >
            Cancel
          </button>
          <button
            onClick={() => handleCapture(true)}
            disabled={!title.trim() || !spaceId}
            className="px-4 py-2 border border-accent bg-accent-light text-accent rounded-lg text-xs font-medium hover:bg-accent-light/60 disabled:opacity-50"
          >
            Capture & Open
          </button>
          <button
            onClick={() => handleCapture(false)}
            disabled={!title.trim() || !spaceId}
            className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover shadow-sm disabled:opacity-50"
          >
            Capture
          </button>
        </div>
      </div>
    </div>
  );
};
export default QuickCapture;
