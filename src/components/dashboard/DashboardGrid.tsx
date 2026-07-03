import React, { useEffect, useState } from 'react';
import type { Space, Artifact, TimelineEvent } from '../../types';
import { db } from '../../db/database';
import { Star, Target, Sparkles, AlertCircle, Clock, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardGridProps {
  space: Space;
  onNavigateToTab: (tab: 'dashboard' | 'artifacts' | 'timeline' | 'graph' | 'goals') => void;
  onOpenArtifact: (id: string) => void;
  onQuickCapture: () => void;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  space,
  onNavigateToTab,
  onOpenArtifact,
  onQuickCapture
}) => {
  const [pinned, setPinned] = useState<Artifact[]>([]);
  const [goals, setGoals] = useState<Artifact[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [artifactNames, setArtifactNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadDashboardData = async () => {
      // Load pinned
      const pins = await db.artifacts
        .where('spaceId')
        .equals(space.id)
        .filter(a => a.favorite && !a.archived)
        .toArray();
      setPinned(pins);

      // Load goals
      const spaceGoals = await db.artifacts
        .where('spaceId')
        .equals(space.id)
        .filter(a => a.type === 'goal' && !a.archived)
        .toArray();
      setGoals(spaceGoals);

      // Load events
      const spaceEvents = await db.timelineEvents
        .where('spaceId')
        .equals(space.id)
        .reverse()
        .sortBy('timestamp');
      setEvents(spaceEvents.slice(0, 5));

      // Resolve names
      const allArts = await db.artifacts.where('spaceId').equals(space.id).toArray();
      const aMap: Record<string, string> = {};
      allArts.forEach(a => { aMap[a.id] = a.title; });
      setArtifactNames(aMap);
    };
    loadDashboardData();
  }, [space.id]);

  const getEventText = (ev: TimelineEvent) => {
    const artName = artifactNames[ev.entityId] || 'Artifact';
    if (ev.event === 'space_created') return 'Space initialized';
    if (ev.event === 'artifact_created') return `Captured "${artName}"`;
    if (ev.event === 'artifact_updated') return `Edited "${artName}"`;
    if (ev.event === 'artifact_archived') return `Archived "${artName}"`;
    if (ev.event === 'relationship_added') return `Linked knowledge nodes`;
    return 'Modified space content';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left select-none">
      {/* Pinned Artifacts Widget */}
      <div className="bg-app-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-48">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 mb-3">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
            Pinned Artifacts
          </h3>
          <div className="space-y-2">
            {pinned.slice(0, 4).map(art => (
              <div 
                key={art.id} 
                onClick={() => onOpenArtifact(art.id)}
                className="text-xs font-medium text-text-primary hover:text-accent hover:underline cursor-pointer truncate"
              >
                📌 {art.title}
              </div>
            ))}
            {pinned.length === 0 && (
              <span className="text-xs text-text-tertiary italic">No pinned artifacts. Favorite any artifact to pin it here.</span>
            )}
          </div>
        </div>
        <button 
          onClick={() => onNavigateToTab('artifacts')}
          className="text-xs font-semibold text-accent hover:underline mt-4 self-start"
        >
          View all artifacts →
        </button>
      </div>

      {/* Goals Widget */}
      <div className="bg-app-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-48">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 mb-3">
            <Target className="w-3.5 h-3.5 text-accent" />
            Objectives & Goals
          </h3>
          <div className="space-y-2">
            {goals.slice(0, 4).map(goal => (
              <div 
                key={goal.id} 
                onClick={() => onOpenArtifact(goal.id)}
                className="flex items-center justify-between text-xs cursor-pointer hover:bg-app-bg p-1 rounded"
              >
                <span className="font-medium text-text-primary truncate flex-1 pr-2">🎯 {goal.title}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  goal.status === 'done' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
                }`}>
                  {goal.status}
                </span>
              </div>
            ))}
            {goals.length === 0 && (
              <span className="text-xs text-text-tertiary italic">No goals defined yet.</span>
            )}
          </div>
        </div>
        <button 
          onClick={onQuickCapture}
          className="text-xs font-semibold text-accent hover:underline mt-4 flex items-center gap-1 self-start"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* AI Suggestions Widget */}
      <div className="bg-app-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-48">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            AI suggestions
          </h3>
          <div className="bg-app-bg border border-border/60 rounded-xl p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-text-primary">Local intelligence ready</h4>
              <p className="text-[11px] text-text-secondary leading-normal">
                AI integrations will connect to your local models in Phase 2. Write your blocks to populate the context.
              </p>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider">AI Standby Mode</span>
      </div>

      {/* Timeline Widget */}
      <div className="bg-app-surface border border-border rounded-2xl p-4 shadow-sm md:col-span-3 min-h-40 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 mb-3">
            <Clock className="w-3.5 h-3.5 text-text-tertiary" />
            Recent Space Activity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {events.map(ev => (
              <div key={ev.id} className="text-left border-l-2 border-accent pl-3 py-0.5">
                <p className="text-xs font-semibold text-text-primary line-clamp-1">{getEventText(ev)}</p>
                <span className="text-[10px] text-text-tertiary">{formatDistanceToNow(ev.timestamp)} ago</span>
              </div>
            ))}
            {events.length === 0 && (
              <span className="text-xs text-text-tertiary italic">No activity recorded.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardGrid;
