import type { TimelineEvent } from '../../types';
import {
  getTimelineEventsBySpaceId,
  getRecentTimelineEvents
} from '../../services/cloudRepository';

export const timelineRepository = {
  async getBySpaceId(spaceId: string): Promise<TimelineEvent[]> {
    return getTimelineEventsBySpaceId(spaceId);
  },

  async getRecentEvents(limit: number = 20): Promise<TimelineEvent[]> {
    return getRecentTimelineEvents(limit);
  }
};
