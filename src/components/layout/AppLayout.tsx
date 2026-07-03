import React, { useState, useEffect } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { Workspace } from './Workspace';
import { Inspector } from './Inspector';
import { StatusBar } from './StatusBar';
import { GlobalSearch } from '../search/GlobalSearch';
import { QuickCapture } from '../capture/QuickCapture';
import { SpaceCreationModal } from '../spaces/SpaceCreationModal';
import { InspectorPanel } from '../inspector/InspectorPanel';
import { useSearchStore } from '../../stores/searchStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isSearchOpen, setSearchOpen } = useSearchStore();
  const [isQuickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [isNewSpaceOpen, setNewSpaceOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K -> Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
      // Ctrl + N -> Quick Capture
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        setQuickCaptureOpen(prev => !prev);
      }
      // Ctrl + Shift + N -> New Space
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setNewSpaceOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  return (
    <div className="flex flex-col h-screen w-screen bg-app-bg text-text-primary overflow-hidden font-sans">
      {/* Top Navigation */}
      <TopBar onQuickCaptureOpen={() => setQuickCaptureOpen(true)} />

      {/* Main Container */}
      <div className="flex flex-1 flex-row overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar onNewSpaceOpen={() => setNewSpaceOpen(true)} />

        {/* Core Workspace Page Content */}
        <Workspace>{children}</Workspace>

        {/* inspector slide-out panel */}
        <Inspector>
          <InspectorPanel />
        </Inspector>
      </div>

      {/* Low-contrast status bar */}
      <StatusBar />

      {/* Global Dialogs & Overlays */}
      {isSearchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      {isQuickCaptureOpen && (
        <QuickCapture onClose={() => setQuickCaptureOpen(false)} />
      )}
      {isNewSpaceOpen && (
        <SpaceCreationModal onClose={() => setNewSpaceOpen(false)} />
      )}
    </div>
  );
};
export default AppLayout;
