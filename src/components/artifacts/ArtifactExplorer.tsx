import React, { useState } from 'react';
import type { Artifact } from '../../types';
import { ArtifactCard } from './ArtifactCard';
import { EmptyState } from '../shared/EmptyState';
import { Grid, List, Search, Plus } from 'lucide-react';

interface ArtifactExplorerProps {
  artifacts: Artifact[];
  onOpenArtifact: (id: string) => void;
  onNewArtifact: () => void;
}

type ViewMode = 'grid' | 'list';
type SortKey = 'updated' | 'created' | 'alpha' | 'favorites';

export const ArtifactExplorer: React.FC<ArtifactExplorerProps> = ({
  artifacts,
  onOpenArtifact,
  onNewArtifact
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const priorityFilter = 'all';

  // Filter list
  const filtered = artifacts.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(search.toLowerCase()) || 
                          (art.description && art.description.toLowerCase().includes(search.toLowerCase())) ||
                          art.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'all' || art.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || art.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || 
                            (priorityFilter === 'none' && !art.priority) || 
                            art.priority === priorityFilter;
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  // Sort list
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'favorites') {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return b.updatedAt - a.updatedAt;
    }
    if (sortKey === 'alpha') {
      return a.title.localeCompare(b.title);
    }
    if (sortKey === 'created') {
      return b.createdAt - a.createdAt;
    }
    return b.updatedAt - a.updatedAt; // default 'updated'
  });

  const types = ['knowledge', 'snippet', 'bug', 'idea', 'resource', 'media', 'task', 'goal', 'bookmark', 'document', 'voice_note'];

  return (
    <div className="space-y-6 text-left select-none">
      {/* Top Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-app-surface border border-border rounded-xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search artifacts in this space..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-app-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        {/* Filters and View toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-border bg-app-bg text-xs rounded-lg text-text-secondary focus:outline-none"
          >
            <option value="all">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-border bg-app-bg text-xs rounded-lg text-text-secondary focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="done">Done</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-2.5 py-1.5 border border-border bg-app-bg text-xs rounded-lg text-text-secondary focus:outline-none"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="alpha">Alphabetical</option>
            <option value="favorites">Pinned/Starred</option>
          </select>

          {/* View Toggles */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden bg-app-bg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-app-selected text-accent' : 'text-text-secondary hover:bg-app-hover'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-app-selected text-accent' : 'text-text-secondary hover:bg-app-hover'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onNewArtifact}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Capture</span>
          </button>
        </div>
      </div>

      {/* Explorer Results Grid/List */}
      {sorted.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map(art => (
              <ArtifactCard 
                key={art.id} 
                artifact={art} 
                onOpen={() => onOpenArtifact(art.id)} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-app-surface border border-border rounded-xl overflow-hidden divide-y divide-border">
            {sorted.map(art => (
              <div 
                key={art.id}
                onClick={() => onOpenArtifact(art.id)}
                className="flex items-center justify-between p-3.5 hover:bg-app-hover cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">📌</span>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{art.title}</h4>
                    <p className="text-xs text-text-secondary line-clamp-1">{art.description || 'No description.'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="px-2 py-0.5 bg-accent-light text-accent rounded-full text-[10px] uppercase font-bold">{art.type}</span>
                  <span className="text-text-tertiary">{new Date(art.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          iconName="FileText"
          heading="No artifacts match your query"
          subtext="Try adjusting the filters or adding a new artifact to this space."
          actionText="Create Artifact"
          onAction={onNewArtifact}
        />
      )}
    </div>
  );
};
export default ArtifactExplorer;
