import React from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface InspectorProps {
  children: React.ReactNode;
}

export const Inspector: React.FC<InspectorProps> = ({ children }) => {
  const { inspectorOpen, setInspectorOpen } = useUIStore();

  return (
    <aside 
      className={`h-[calc(100vh-3.5rem-2rem)] border-l border-border bg-app-surface flex flex-col transition-all duration-200 select-none ${
        inspectorOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none border-l-0'
      } overflow-hidden`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Inspector</span>
        <button 
          onClick={() => setInspectorOpen(false)}
          className="p-1 rounded hover:bg-app-hover text-text-secondary border border-transparent hover:border-border transition-colors"
          title="Close Inspector (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </aside>
  );
};
