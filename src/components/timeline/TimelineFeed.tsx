import React, { useEffect, useState } from 'react';
import type { TimelineEvent } from '../../types';
import { getTimelineEventsBySpaceId, getAllArtifacts } from '../../services/cloudRepository';
import { format } from 'date-fns';
import { Calendar, RefreshCw } from 'lucide-react';

interface TimelineFeedProps {
  spaceId: string;
}

export const TimelineFeed: React.FC<TimelineFeedProps> = ({ spaceId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [artifactNames, setArtifactNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchTimeline = async () => {
    setLoading(true);
    const spaceEvents = await getTimelineEventsBySpaceId(spaceId);
    setEvents(spaceEvents);

    const allArts = await getAllArtifacts();
    const aMap: Record<string, string> = {};
    allArts.filter(a => a.spaceId === spaceId).forEach(a => { aMap[a.id] = a.title; });
    setArtifactNames(aMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchTimeline();
  }, [spaceId]);

  const getEventText = (ev: TimelineEvent) => {
    const artName = artifactNames[ev.entityId] || 'Artifact';
    if (ev.event === 'space_created') return 'Space initialized';
    if (ev.event === 'artifact_created') return `Captured new artifact "${artName}"`;
    if (ev.event === 'artifact_updated') return `Modified artifact content "${artName}"`;
    if (ev.event === 'artifact_archived') return `Archived artifact "${artName}"`;
    if (ev.event === 'relationship_added') return `Linked knowledge nodes`;
    return 'Modified space content';
  };

  return (
    <div className="bg-app-surface border border-border rounded-xl p-6 shadow-sm text-left select-none space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary">History & Activity</h2>
          <p className="text-xs text-text-secondary mt-0.5">Chronological record of updates within this Space.</p>
        </div>
        <button 
          onClick={fetchTimeline} 
          className="p-1.5 rounded hover:bg-app-hover border border-border transition-colors text-text-secondary"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6">
        {events.map(ev => (
          <div key={ev.id} className="relative">
            {/* Timeline bullet */}
            <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-accent border-2 border-app-surface flex items-center justify-center shadow-sm" />
            
            <div className="space-y-1">
              <span className="text-[10px] text-text-tertiary font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(ev.timestamp, 'PPP p')}
              </span>
              <p className="text-sm font-semibold text-text-primary">{getEventText(ev)}</p>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center py-8 text-xs text-text-tertiary italic">
            No history recorded. Start capturing artifacts to write timeline logs.
          </div>
        )}
      </div>
    </div>
  );
};
export default TimelineFeed;
