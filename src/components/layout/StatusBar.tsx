import React, { useEffect } from 'react';
import { useUniverseStore } from '../../stores/universeStore';
import { WifiOff, Cpu, CheckCircle } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { totalArtifacts, loadStats } = useUniverseStore();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <footer className="h-8 border-t border-border bg-app-sidebar px-4 flex items-center justify-between text-xs text-text-secondary select-none">
      {/* Left section: DB Write Status */}
      <div className="flex items-center gap-1.5 font-medium">
        <CheckCircle className="w-3.5 h-3.5 text-success" />
        <span>Changes saved locally</span>
      </div>

      {/* Center section: Stats */}
      <div className="flex items-center gap-4">
        <span>Artifacts: <strong className="text-text-primary">{totalArtifacts}</strong></span>
      </div>

      {/* Right section: AI / Network Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <WifiOff className="w-3.5 h-3.5 text-text-tertiary" />
          <span>Offline-first</span>
        </div>
        <div className="flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5 text-text-tertiary" />
          <span>AI Standby</span>
        </div>
      </div>
    </footer>
  );
};
