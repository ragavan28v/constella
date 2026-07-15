import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpaceStore } from '../../stores/spaceStore';
import { createArtifact } from '../../services/cloudRepository';
import type { Space } from '../../types';
import { X, BookOpen, Rocket, Cloud, Sparkles, User, File } from 'lucide-react';

interface SpaceCreationModalProps {
  onClose: () => void;
}

const TEMPLATES = [
  { id: 'learning', name: 'Learning', desc: 'Acquire new skills & concepts', icon: BookOpen },
  { id: 'project', name: 'Project', desc: 'Deliver milestones & tasks', icon: Rocket },
  { id: 'research', name: 'Research', desc: 'Collect knowledge & sources', icon: Cloud },
  { id: 'dream', name: 'Dream', desc: 'Visualize ideas & concepts', icon: Sparkles },
  { id: 'personal', name: 'Personal', desc: 'Manage lifestyle & goals', icon: User },
  { id: 'blank', name: 'Blank', desc: 'Start completely fresh', icon: File },
] as const;

const COLORS = [
  '#5B4EE8', // Indigo
  '#16A34A', // Green
  '#DC2626', // Red
  '#D97706', // Amber
  '#2563EB', // Blue
  '#7B6EF6', // Violet
  '#EA580C', // Orange
  '#0D9488', // Teal
];

const ICONS = ['📘', '🚀', '🧠', '🏠', '📷', '🎨', '💼', '💪', '🌱', '🎵', '✍️', '🔬'];

export const SpaceCreationModal: React.FC<SpaceCreationModalProps> = ({ onClose }) => {
  const { createSpace } = useSpaceStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Space['template']>('learning');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

  const SUGGESTED_GOALS: Record<Space['template'], string[]> = {
    learning: ['Read foundational documentation', 'Build first hello world project'],
    project: ['Define project scope and requirements', 'Launch MVP release'],
    research: ['Gather literature and sources', 'Develop core thesis statement'],
    dream: ['Establish long-term vision', 'Create vision board & mindmap'],
    personal: ['Set fitness & productivity goals', 'Establish daily routines'],
    blank: []
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSpace: Space = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: desc.trim(),
      icon: selectedIcon,
      color: selectedColor,
      template: selectedTemplate,
      favorite: false,
      archived: false,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {}
    };

    const id = await createSpace(newSpace);
    
    const goalsList = SUGGESTED_GOALS[selectedTemplate] || [];
    const { searchIndexManager } = await import('../../search/searchIndex');
    for (const title of goalsList) {
      const goalArt = {
        id: crypto.randomUUID(),
        spaceId: id,
        type: 'goal' as const,
        title,
        description: 'Auto-suggested objective for this template.',
        status: 'active' as const,
        priority: 'medium' as const,
        favorite: false,
        archived: false,
        tags: ['suggested'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {}
      };
      await createArtifact(goalArt);
      searchIndexManager.indexArtifact(goalArt);
    }

    onClose();
    navigate(`/spaces/${id}`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-app-surface w-full max-w-2xl rounded-xl border border-border shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Create a New Space</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-app-hover text-text-secondary border border-transparent hover:border-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name & Desc */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Space Name *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Machine Learning, Dream House"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-app-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary text-left block">Icon</label>
              <div className="flex gap-2">
                <div className="w-10 h-10 border border-border bg-app-bg rounded-lg flex items-center justify-center text-xl select-none">
                  {selectedIcon}
                </div>
                <select
                  value={selectedIcon}
                  onChange={(e) => setSelectedIcon(e.target.value)}
                  className="flex-1 px-2 border border-border rounded-lg bg-app-bg text-text-primary text-sm focus:outline-none"
                >
                  {ICONS.map(ico => (
                    <option key={ico} value={ico}>{ico}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Description</label>
            <textarea
              placeholder="What is this space about?"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-app-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 h-20 resize-none"
            />
          </div>

          {/* Template Selectors */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">Select Template</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEMPLATES.map(tpl => {
                const Icon = tpl.icon;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id as Space['template'])}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col items-start gap-1.5 ${
                      selectedTemplate === tpl.id 
                        ? 'border-accent bg-accent-light/30 ring-1 ring-accent' 
                        : 'border-border bg-app-bg hover:bg-app-hover'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${selectedTemplate === tpl.id ? 'text-accent' : 'text-text-secondary'}`} />
                    <span className="text-sm font-semibold text-text-primary">{tpl.name}</span>
                    <span className="text-[10px] text-text-secondary leading-normal">{tpl.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">Space Color Theme</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor === color ? 'scale-110 ring-2 ring-offset-2 ring-accent' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border bg-app-bg flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border bg-app-surface text-text-secondary rounded-lg text-sm font-medium hover:bg-app-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Space
          </button>
        </div>
      </div>
    </div>
  );
};
