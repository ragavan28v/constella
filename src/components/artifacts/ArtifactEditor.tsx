import React, { useState, useEffect, useRef } from 'react';
import type { Artifact, Block } from '../../types';
import { useArtifactStore } from '../../stores/artifactStore';
import { blockRepository } from '../../db/repositories/blockRepository';
import { BlockEditor } from '../editor/BlockEditor';
import { ArrowLeft, Plus, X, Tag } from 'lucide-react';

interface ArtifactEditorProps {
  artifactId: string;
  onClose: () => void;
}

export const ArtifactEditor: React.FC<ArtifactEditorProps> = ({ artifactId, onClose }) => {
  const { updateArtifact } = useArtifactStore();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const saveTimeoutRef = useRef<any>(null);

  // Load artifact details and blocks
  useEffect(() => {
    const fetchArtifact = async () => {
      const db = await import('../../db/database');
      const art = await db.default.artifacts.get(artifactId);
      if (art) {
        setArtifact(art);
        setTitle(art.title);
        setDescription(art.description || '');
        setTags(art.tags || []);
        
        // Load blocks
        const blocks = await blockRepository.getByArtifactId(artifactId);
        if (blocks.length > 0) {
          // TipTap JSON is stored in the content field of the first block or as structured nodes
          setContent(blocks[0].content);
        } else {
          setContent('');
        }
      }
    };
    fetchArtifact();
  }, [artifactId]);

  // Debounced auto-save triggers on title, description, tags, or content change
  const triggerAutoSave = (updatedFields: { title?: string; description?: string; tags?: string[]; content?: any }) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const fieldsToUpdate: Partial<Artifact> = {};
        if (updatedFields.title !== undefined) fieldsToUpdate.title = updatedFields.title;
        if (updatedFields.description !== undefined) fieldsToUpdate.description = updatedFields.description;
        if (updatedFields.tags !== undefined) fieldsToUpdate.tags = updatedFields.tags;

        // Save metadata fields
        if (Object.keys(fieldsToUpdate).length > 0) {
          await updateArtifact(artifactId, fieldsToUpdate);
        }

        // Save Editor Blocks
        if (updatedFields.content !== undefined) {
          const blockObj: Block = {
            id: crypto.randomUUID(),
            artifactId: artifactId,
            type: 'tiptap_content',
            position: 0,
            content: updatedFields.content,
            metadata: {}
          };
          await blockRepository.saveBlocks(artifactId, [blockObj]);
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Auto save failed", err);
        setSaveStatus('idle');
      }
    }, 800);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave({ title: val });
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);
    triggerAutoSave({ description: val });
  };

  const handleContentChange = (newJson: any) => {
    setContent(newJson);
    triggerAutoSave({ content: newJson });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updated = [...tags, newTag.trim()];
      setTags(updated);
      triggerAutoSave({ tags: updated });
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter(t => t !== tagToRemove);
    setTags(updated);
    triggerAutoSave({ tags: updated });
  };

  if (!artifact) {
    return (
      <div className="py-12 text-center text-xs text-text-tertiary animate-pulse">
        Opening artifact...
      </div>
    );
  }

  return (
    <div className="flex-1 bg-app-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full text-left">
      {/* Top Header toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-app-bg select-none">
        <button 
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to list</span>
        </button>

        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-[11px] text-text-tertiary animate-pulse">Saving changes...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[11px] text-success font-medium">Changes saved</span>
          )}
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-accent/10 text-accent">
            {artifact.type}
          </span>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Title & Description Inputs */}
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Artifact"
            className="w-full text-2xl font-bold text-text-primary bg-transparent outline-none border-b border-transparent hover:border-border focus:border-accent pb-1 transition-colors"
          />
          <input
            type="text"
            value={description}
            onChange={handleDescChange}
            placeholder="Add brief description/context..."
            className="w-full text-sm text-text-secondary bg-transparent outline-none"
          />
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-2 select-none">
          <Tag className="w-3.5 h-3.5 text-text-tertiary" />
          {tags.map(tag => (
            <span 
              key={tag} 
              className="flex items-center gap-1 px-2 py-0.5 bg-app-bg border border-border text-xs text-text-secondary rounded"
            >
              <span>#{tag}</span>
              <button 
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-error"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {showTagInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                autoFocus
                placeholder="tag name..."
                className="px-1.5 py-0.5 border border-border rounded text-xs bg-app-bg text-text-primary outline-none focus:ring-1 focus:ring-accent"
              />
              <button onClick={handleAddTag} className="text-xs text-accent font-semibold hover:underline">Add</button>
            </div>
          ) : (
            <button 
              onClick={() => setShowTagInput(true)}
              className="text-xs text-accent font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add tag</span>
            </button>
          )}
        </div>

        <hr className="border-border" />

        {/* TipTap content */}
        <BlockEditor content={content} onChange={handleContentChange} />
      </div>
    </div>
  );
};
export default ArtifactEditor;
