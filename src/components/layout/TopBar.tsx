import React from 'react';
import { Search, Plus, Sun, Moon, Database, Bell, Menu } from 'lucide-react';
import { useSearchStore } from '../../stores/searchStore';
import { useUIStore } from '../../stores/uiStore';
import { useSpaceStore } from '../../stores/spaceStore';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  onQuickCaptureOpen: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onQuickCaptureOpen }) => {
  const { setSearchOpen } = useSearchStore();
  const { theme, setTheme, toggleSidebar } = useUIStore();
  const { activeSpaceId, spaces } = useSpaceStore();
  const navigate = useNavigate();

  const activeSpace = spaces.find(s => s.id === activeSpaceId);

  return (
    <header className="h-14 border-b border-border bg-app-surface px-4 flex items-center justify-between select-none">
      {/* Sidebar Toggle & Logo & Context */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-app-hover text-text-secondary border border-transparent hover:border-border transition-all mr-1"
          title="Toggle Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-base shadow-sm">
            C
          </div>
          <span className="font-semibold text-text-primary text-base tracking-tight">Constella</span>
          {activeSpace && (
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
              <span className="text-sm">{activeSpace.icon}</span>
              <span className="text-xs font-medium text-text-secondary">{activeSpace.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Action */}
      <button 
        onClick={() => setSearchOpen(true)}
        className="flex-1 max-w-xl mx-8 h-9 bg-app-bg hover:bg-app-hover border border-border px-3 rounded-lg text-text-secondary text-sm flex items-center justify-between transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-text-tertiary" />
          <span>Search everything...</span>
        </div>
        <kbd className="bg-app-surface border border-border text-[10px] px-1.5 py-0.5 rounded text-text-tertiary font-mono">Ctrl+K</kbd>
      </button>

      {/* Quick Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Capture */}
        <button
          onClick={onQuickCaptureOpen}
          className="p-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors shadow-sm flex items-center gap-1 text-xs font-medium"
          title="Quick Capture (Ctrl+N)"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline pr-1">Capture</span>
        </button>

        {/* Local-Only Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-success-light border border-success/20 rounded-full text-success text-[11px] font-medium">
          <Database className="w-3.5 h-3.5" />
          <span>Local Mode</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-1.5 rounded-lg hover:bg-app-hover text-text-secondary border border-transparent hover:border-border transition-all"
          title="Toggle Theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>

        {/* Notifications */}
        <button className="p-1.5 rounded-lg hover:bg-app-hover text-text-secondary border border-transparent hover:border-border transition-all relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-accent rounded-full"></span>
        </button>

        {/* User profile */}
        <div 
          onClick={() => navigate('/settings')}
          className="w-8 h-8 rounded-full bg-app-selected hover:opacity-90 cursor-pointer border border-border flex items-center justify-center text-accent font-semibold text-xs transition-opacity"
        >
          U
        </div>
      </div>
    </header>
  );
};
