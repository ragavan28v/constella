import React, { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { SpaceCard } from '../components/spaces/SpaceCard';
import { useSpaceStore } from '../stores/spaceStore';
import { useUniverseStore } from '../stores/universeStore';
import { db } from '../db/database';
import type { Artifact, TimelineEvent } from '../types';
import { BookOpen, Calendar, Clock, Star, Flame, LayoutGrid, Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { SpaceCreationModal } from '../components/spaces/SpaceCreationModal';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('filter');
  const favoriteOnly = searchParams.get('favorite') === 'true';

  const { spaces, loadSpaces, selectSpace } = useSpaceStore();
  const { totalSpaces, totalArtifacts, streak, loadStats } = useUniverseStore();
  const [recentArtifacts, setRecentArtifacts] = useState<Artifact[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [spaceNames, setSpaceNames] = useState<Record<string, string>>({});
  const [artifactNames, setArtifactNames] = useState<Record<string, string>>({});
  const [isNewSpaceOpen, setNewSpaceOpen] = useState(false);

  useEffect(() => {
    loadSpaces();
    loadStats();
  }, [loadSpaces, loadStats]);

  // Fetch recent artifacts and activity
  useEffect(() => {
    const fetchHomeData = async () => {
      const recents = await db.artifacts
        .where('archived')
        .equals(0)
        .reverse()
        .sortBy('updatedAt');
      setRecentArtifacts(recents.slice(0, 3));

      const events = await db.timelineEvents
        .orderBy('timestamp')
        .reverse()
        .limit(10)
        .toArray();
      setTimelineEvents(events);

      // Map IDs for labels
      const allSpaces = await db.spaces.toArray();
      const sMap: Record<string, string> = {};
      allSpaces.forEach(s => { sMap[s.id] = s.name; });
      setSpaceNames(sMap);

      const allArtifacts = await db.artifacts.toArray();
      const aMap: Record<string, string> = {};
      allArtifacts.forEach(a => { aMap[a.id] = a.title; });
      setArtifactNames(aMap);
    };
    fetchHomeData();
  }, [spaces]);

  // Filter logic
  let displayedSpaces = spaces.filter(s => !s.archived);
  if (filterType) {
    displayedSpaces = displayedSpaces.filter(s => s.template === filterType);
  }
  if (favoriteOnly) {
    displayedSpaces = displayedSpaces.filter(s => s.favorite);
  }

  const pinnedSpaces = displayedSpaces.filter(s => s.favorite);
  const otherSpaces = displayedSpaces.filter(s => !s.favorite);

  const handleArtifactClick = (art: Artifact) => {
    selectSpace(art.spaceId);
    navigate(`/spaces/${art.spaceId}?artifact=${art.id}`);
  };

  const getEventDescription = (ev: TimelineEvent) => {
    const spaceName = spaceNames[ev.spaceId] || 'Space';
    const entityName = ev.entityType === 'space' ? spaceNames[ev.entityId] : artifactNames[ev.entityId];
    
    switch (ev.event) {
      case 'space_created':
        return `Created Space "${entityName || spaceName}"`;
      case 'artifact_created':
        return `Created Artifact "${entityName || 'Untitled'}" in "${spaceName}"`;
      case 'artifact_updated':
        return `Updated "${entityName || 'Untitled'}" in "${spaceName}"`;
      case 'artifact_archived':
        return `Archived "${entityName || 'Untitled'}" in "${spaceName}"`;
      case 'relationship_added':
        return `Linked Artifacts in "${spaceName}"`;
      default:
        return `Activity in "${spaceName}"`;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 select-none">
        {/* Welcome Banner & Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-app-surface border border-border rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Welcome Back</h1>
            <p className="text-xs text-text-secondary mt-1">
              Your personal offline knowledge engine is active.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-2 bg-app-bg border border-border rounded-xl">
              <Flame className="w-5 h-5 text-amber-500 fill-current animate-pulse" />
              <div className="text-left">
                <div className="text-xs font-bold leading-none text-text-primary">{streak} Day</div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Streak</span>
              </div>
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-text-primary">{totalSpaces}</div>
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Spaces</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-text-primary">{totalArtifacts}</div>
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Artifacts</span>
            </div>
          </div>
        </div>

        {/* Continue Working / Recent Artifacts */}
        {recentArtifacts.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-text-tertiary" />
              Continue Working
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentArtifacts.map(art => (
                <div
                  key={art.id}
                  onClick={() => handleArtifactClick(art)}
                  className="bg-app-surface hover:bg-app-hover border border-border rounded-xl p-4 shadow-sm cursor-pointer transition-all duration-150 flex flex-col justify-between h-28"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-accent/10 text-accent">
                        {art.type}
                      </span>
                      <span className="text-[10px] text-text-tertiary">
                        {formatDistanceToNow(art.updatedAt)} ago
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-text-primary line-clamp-1">{art.title}</h3>
                  </div>
                  <span className="text-[11px] font-medium text-text-secondary mt-2 truncate">
                    📂 {spaceNames[art.spaceId] || 'Space'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid: Spaces & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Spaces Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pinned Spaces */}
            {pinnedSpaces.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  Pinned Spaces
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pinnedSpaces.map(space => (
                    <SpaceCard key={space.id} space={space} />
                  ))}
                </div>
              </div>
            )}

            {/* Other / Recent Spaces */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-text-tertiary" />
                  {filterType ? `${filterType.toUpperCase()} Spaces` : favoriteOnly ? 'Favorite Spaces' : 'Recent Spaces'}
                </h2>
                <button
                  onClick={() => setNewSpaceOpen(true)}
                  className="flex items-center gap-1 text-xs text-accent font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Space</span>
                </button>
              </div>
              
              {otherSpaces.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {otherSpaces.map(space => (
                    <SpaceCard key={space.id} space={space} />
                  ))}
                </div>
              ) : pinnedSpaces.length === 0 ? (
                <div className="text-center py-12 bg-app-surface border border-border border-dashed rounded-xl">
                  <BookOpen className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm font-semibold text-text-primary">No spaces found</p>
                  <p className="text-xs text-text-secondary mt-1">Get started by creating a new space.</p>
                  <button 
                    onClick={() => setNewSpaceOpen(true)}
                    className="mt-3 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg"
                  >
                    New Space
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Activity Timeline Column */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
              Recent Activity
            </h2>
            <div className="bg-app-surface border border-border rounded-xl p-4 shadow-sm max-h-[400px] overflow-y-auto space-y-4">
              {timelineEvents.map(ev => (
                <div key={ev.id} className="flex gap-3 text-left">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-medium text-text-primary leading-snug">
                      {getEventDescription(ev)}
                    </p>
                    <span className="text-[10px] text-text-tertiary">
                      {formatDistanceToNow(ev.timestamp)} ago
                    </span>
                  </div>
                </div>
              ))}
              {timelineEvents.length === 0 && (
                <div className="text-center py-12 text-xs text-text-tertiary italic">
                  No activity recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isNewSpaceOpen && (
        <SpaceCreationModal onClose={() => setNewSpaceOpen(false)} />
      )}
    </AppLayout>
  );
};

export default HomePage;
