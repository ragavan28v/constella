import { db } from '../database';
import type { TimelineEvent } from '../../types';

export const timelineRepository = {
  async getBySpaceId(spaceId: string): Promise<TimelineEvent[]> {
    return db.timelineEvents
      .where('spaceId')
      .equals(spaceId)
      .reverse()
      .sortBy('timestamp');
  },

  async getRecentEvents(limit: number = 20): Promise<TimelineEvent[]> {
    return db.timelineEvents
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }
};
