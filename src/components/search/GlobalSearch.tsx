import React, { useState, useEffect, useRef } from 'react';
import { useSearchStore } from '../../stores/searchStore';
import { useSpaceStore } from '../../stores/spaceStore';
import { Search, X, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchProps {
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { query, results, performSearch, clearSearch } = useSearchStore();
  const { spaces, selectSpace } = useSpaceStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    return () => clearSearch();
  }, [clearSearch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    performSearch(e.target.value);
    setSelectedIndex(0);
  };

  // Filter local spaces by query
  const matchingSpaces = query.trim() 
    ? spaces.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) && !s.archived)
    : [];

  const combinedResults = [
    ...matchingSpaces.map(s => ({ type: 'space' as const, id: s.id, title: s.name, spaceId: s.id, icon: s.icon })),
    ...results.map(r => ({ type: 'artifact' as const, id: r.id, title: r.title, spaceId: r.spaceId, typeLabel: r.type }))
  ];

  const handleSelect = (item: typeof combinedResults[0]) => {
    onClose();
    if (item.type === 'space') {
      selectSpace(item.id);
      navigate(`/spaces/${item.id}`);
    } else {
      selectSpace(item.spaceId);
      navigate(`/spaces/${item.spaceId}?artifact=${item.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % combinedResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + combinedResults.length) % combinedResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedResults[selectedIndex]) {
        handleSelect(combinedResults[selectedIndex]);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20">
      <div 
        className="bg-app-surface w-full max-w-2xl rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search input container */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-app-bg">
          <Search className="w-5 h-5 text-text-secondary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search spaces, artifacts, tags..."
            value={query}
            onChange={handleSearch}
            className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm placeholder:text-text-tertiary"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-app-hover border border-transparent hover:border-border transition-colors text-text-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto p-2">
          {combinedResults.length > 0 ? (
            <div className="space-y-1">
              {combinedResults.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-left ${
                    selectedIndex === idx ? 'bg-app-selected text-accent font-medium' : 'text-text-primary hover:bg-app-hover'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {item.type === 'space' ? (
                      <span className="text-sm">{item.icon}</span>
                    ) : (
                      <FileText className="w-4 h-4 text-text-secondary" />
                    )}
                    <div className="truncate">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary pr-2">
                        {item.type === 'space' ? 'Space' : item.typeLabel}
                      </span>
                      <span>{item.title}</span>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${selectedIndex === idx ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="text-center py-12 text-xs text-text-tertiary italic">
              Nothing found. Try different keywords.
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-text-tertiary select-none">
              Start typing to instantly query spaces and knowledge nodes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default GlobalSearch;
