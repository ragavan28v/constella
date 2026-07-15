import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  inspectorOpen: boolean;
  theme: 'light' | 'dark';
  activeTab: 'dashboard' | 'artifacts' | 'timeline' | 'graph' | 'goals';
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setActiveTab: (tab: 'dashboard' | 'artifacts' | 'timeline' | 'graph' | 'goals') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  inspectorOpen: false,
  theme: 'light',
  activeTab: 'dashboard',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  setActiveTab: (activeTab) => set({ activeTab }),
}));
