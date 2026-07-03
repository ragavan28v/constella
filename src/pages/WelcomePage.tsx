import React, { useState } from 'react';
import { SpaceCreationModal } from '../components/spaces/SpaceCreationModal';
import { ArrowRight, Sparkles } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-app-bg text-text-primary p-6 relative">
      <div className="max-w-md w-full text-center space-y-6 select-none">
        {/* Decorative Floating Sparkle Icon */}
        <div className="inline-flex p-4 bg-accent-light text-accent rounded-2xl shadow-sm mb-2">
          <Sparkles className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome to Constella</h1>
          <p className="text-text-secondary text-sm leading-relaxed max-w-sm mx-auto">
            A Local-First, Space-Based Personal Knowledge Operating System. Organize notes, code snippets, ideas, and goals under curated Spaces.
          </p>
        </div>

        <div>
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <span>Create your first Space</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] text-text-tertiary">
          All data is saved completely offline in your browser's IndexedDB.
        </div>
      </div>

      {isModalOpen && <SpaceCreationModal onClose={() => setModalOpen(false)} />}
    </div>
  );
};

export default WelcomePage;
