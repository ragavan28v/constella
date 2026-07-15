import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Star, Archive, Settings, HardDrive, 
  BookOpen, Rocket, Cloud, Sparkles, User 
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSpaceStore } from '../../stores/spaceStore';

interface SidebarProps {
  onNewSpaceOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewSpaceOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { sidebarCollapsed } = useUIStore();
  const { spaces, selectSpace, activeSpaceId } = useSpaceStore();

  const pinnedSpaces = spaces.filter(s => s.favorite && !s.archived);
  const recentSpaces = spaces
    .filter(s => !s.archived)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8);

  const isActive = (path: string) => location.pathname === path;

  const handleNav = (path: string, spaceId: string | null = null) => {
    selectSpace(spaceId);
    navigate(path);
  };

  const templates = [
    { name: 'Learning', icon: BookOpen, type: 'learning' },
    { name: 'Projects', icon: Rocket, type: 'project' },
    { name: 'Dreams', icon: Sparkles, type: 'dream' },
    { name: 'Research', icon: Cloud, type: 'research' },
    { name: 'Personal', icon: User, type: 'personal' },
  ];

  return (
    <aside 
      className={`h-[calc(100vh-3.5rem-2rem)] border-r border-border bg-app-sidebar flex flex-col justify-between select-none transition-all duration-200 ${
        sidebarCollapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* Upper Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Home */}
        <button
          onClick={() => handleNav('/home')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive('/home') 
              ? 'bg-app-selected text-accent border-l-2 border-accent' 
              : 'text-text-secondary hover:bg-app-hover hover:text-text-primary'
          }`}
          title="Home"
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Home</span>}
        </button>

        {/* Pinned Spaces */}
        {!sidebarCollapsed && pinnedSpaces.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-3 mb-1">
              Pinned Spaces
            </div>
            <div className="space-y-0.5">
              {pinnedSpaces.map(space => (
                <button
                  key={space.id}
                  onClick={() => handleNav(`/spaces/${space.id}`, space.id)}
                  className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors text-left ${
                    activeSpaceId === space.id
                      ? 'bg-app-selected text-accent font-medium'
                      : 'text-text-secondary hover:bg-app-hover hover:text-text-primary'
                  }`}
                >
                  <span className="text-sm flex-shrink-0">{space.icon}</span>
                  <span className="truncate">{space.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Spaces / All Spaces */}
        <div>
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">
                Recent Spaces
              </span>
              <button 
                onClick={onNewSpaceOpen}
                className="text-[10px] text-accent hover:underline font-semibold"
              >
                + New
              </button>
            </div>
          )}
          <div className="space-y-0.5">
            {recentSpaces.map(space => (
              <button
                key={space.id}
                onClick={() => handleNav(`/spaces/${space.id}`, space.id)}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors text-left ${
                  activeSpaceId === space.id && location.pathname.startsWith('/spaces/')
                    ? 'bg-app-selected text-accent font-medium'
                    : 'text-text-secondary hover:bg-app-hover hover:text-text-primary'
                }`}
                title={space.name}
              >
                <span className="text-sm flex-shrink-0">{space.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{space.name}</span>}
              </button>
            ))}
            
            {spaces.length === 0 && !sidebarCollapsed && (
              <div className="px-3 py-2 text-xs text-text-tertiary italic">
                No spaces created.
              </div>
            )}
          </div>
        </div>

        {/* Views */}
        {!sidebarCollapsed && (
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-3 mb-1">
              Views
            </div>
            <div className="space-y-0.5">
              {templates.map(tpl => {
                const Icon = tpl.icon;
                return (
                  <button
                    key={tpl.name}
                    onClick={() => handleNav(`/home?filter=${tpl.type}`)}
                    className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-app-hover hover:text-text-primary transition-colors text-left"
                  >
                    <Icon className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                    <span>{tpl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <hr className="border-border mx-2" />

        {/* Favorites, Archive */}
        <div className="space-y-0.5">
          <button
            onClick={() => handleNav('/home?favorite=true')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-app-hover hover:text-text-primary transition-colors"
            title="Favorites"
          >
            <Star className="w-4 h-4 text-text-tertiary flex-shrink-0" />
            {!sidebarCollapsed && <span>Favorites</span>}
          </button>
          <button
            onClick={() => handleNav('/archive')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive('/archive')
                ? 'bg-app-selected text-accent font-medium'
                : 'text-text-secondary hover:bg-app-hover hover:text-text-primary'
            }`}
            title="Archive"
          >
            <Archive className="w-4 h-4 text-text-tertiary flex-shrink-0" />
            {!sidebarCollapsed && <span>Archive</span>}
          </button>
        </div>
      </div>

      {/* Lower Navigation (Settings) */}
      <div className="p-2 space-y-0.5">
        <button
          onClick={() => handleNav('/settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive('/settings')
              ? 'bg-app-selected text-accent font-medium'
              : 'text-text-secondary hover:bg-app-hover hover:text-text-primary'
          }`}
          title="Settings"
        >
          <Settings className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          {!sidebarCollapsed && <span>Settings</span>}
        </button>
        <div className="w-full flex items-center gap-3 px-3 py-2 text-xs text-text-tertiary">
          <HardDrive className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Cloud Workspace</span>}
        </div>
      </div>
    </aside>
  );
};
