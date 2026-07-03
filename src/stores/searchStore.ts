import { create } from 'zustand';
import { searchIndexManager } from '../search/searchIndex';

interface SearchState {
  query: string;
  isSearchOpen: boolean;
  results: any[];
  setQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  performSearch: (query: string) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  isSearchOpen: false,
  results: [],
  setQuery: (query) => set({ query }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  performSearch: (query) => {
    const results = searchIndexManager.search(query);
    set({ query, results });
  },
  clearSearch: () => set({ query: '', results: [] })
}));
