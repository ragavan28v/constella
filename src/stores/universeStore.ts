import { create } from 'zustand';
import { db } from '../db/database';

interface UniverseState {
  totalSpaces: number;
  totalArtifacts: number;
  streak: number;
  loading: boolean;
  loadStats: () => Promise<void>;
}

export const useUniverseStore = create<UniverseState>((set) => ({
  totalSpaces: 0,
  totalArtifacts: 0,
  streak: 1, // Default user capture streak
  loading: false,
  loadStats: async () => {
    set({ loading: true });
    try {
      const totalSpaces = await db.spaces.count();
      const totalArtifacts = await db.artifacts.count();
      
      // Calculate streak based on timeline events
      const events = await db.timelineEvents.orderBy('timestamp').toArray();
      let streak = 0;
      if (events.length > 0) {
        // Simple day checking streak calculation:
        const uniqueDays = new Set(
          events.map(e => new Date(e.timestamp).toDateString())
        );
        // Sort unique days descending
        const sortedDays = Array.from(uniqueDays).map(d => new Date(d).getTime()).sort((a,b) => b-a);
        
        let current = Date.now();
        streak = 0;
        for (const dayTime of sortedDays) {
          const diffTime = Math.abs(current - dayTime);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= streak + 1) {
            streak++;
            current = dayTime;
          } else {
            break;
          }
        }
      }

      set({ totalSpaces, totalArtifacts, streak: Math.max(streak, 1), loading: false });
    } catch (error) {
      console.error("Error loading universe stats", error);
      set({ loading: false });
    }
  }
}));
