import React, { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { SpaceHeader } from '../components/spaces/SpaceHeader';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { ArtifactExplorer } from '../components/artifacts/ArtifactExplorer';
import { ArtifactEditor } from '../components/artifacts/ArtifactEditor';
import { TimelineFeed } from '../components/timeline/TimelineFeed';
import { KnowledgeGraph } from '../components/graph/KnowledgeGraph';
import { useSpaceStore } from '../stores/spaceStore';
import { useArtifactStore } from '../stores/artifactStore';
import { useUIStore } from '../stores/uiStore';
import type { Artifact } from '../types';
import { LayoutDashboard, FileText, Clock, GitMerge, Target } from 'lucide-react';

export const SpacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { spaces, loadSpaces, selectSpace } = useSpaceStore();
  const { artifacts, loadArtifactsBySpace, selectArtifact, createArtifact } = useArtifactStore();
  const { activeTab, setActiveTab, setInspectorOpen } = useUIStore();

  const activeArtifactId = searchParams.get('artifact');
  const space = spaces.find(s => s.id === id);

  useEffect(() => {
    loadSpaces();
    if (id) {
      selectSpace(id);
      loadArtifactsBySpace(id);
    }
  }, [id, loadSpaces, selectSpace, loadArtifactsBySpace]);

  // Synchronize active artifact with store and inspector slide-out
  useEffect(() => {
    if (activeArtifactId) {
      selectArtifact(activeArtifactId);
      setInspectorOpen(true);
    } else {
      selectArtifact(null);
      setInspectorOpen(false);
    }
    return () => {
      selectArtifact(null);
      setInspectorOpen(false);
    };
  }, [activeArtifactId, selectArtifact, setInspectorOpen]);

  if (!space) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-text-secondary">
          <p className="text-sm font-semibold">Space not found.</p>
          <button onClick={() => navigate('/home')} className="mt-4 px-4 py-2 bg-accent text-white text-xs font-semibold rounded-lg">
            Back to Home
          </button>
        </div>
      </AppLayout>
    );
  }

  const handleOpenArtifact = (artId: string) => {
    setSearchParams({ artifact: artId });
    setActiveTab('artifacts');
  };

  const handleCloseArtifact = () => {
    setSearchParams({});
  };

  const handleNewArtifact = async () => {
    const newArt: Artifact = {
      id: crypto.randomUUID(),
      spaceId: space.id,
      type: 'knowledge',
      title: 'Untitled Knowledge',
      description: '',
      status: 'active',
      priority: null,
      favorite: false,
      archived: false,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {}
    };
    const newId = await createArtifact(newArt);
    handleOpenArtifact(newId);
  };

  const handleNewGoal = async () => {
    const newArt: Artifact = {
      id: crypto.randomUUID(),
      spaceId: space.id,
      type: 'goal',
      title: 'New Objective',
      description: '',
      status: 'active',
      priority: 'medium',
      favorite: false,
      archived: false,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {}
    };
    const newId = await createArtifact(newArt);
    handleOpenArtifact(newId);
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'artifacts', name: 'Artifacts', icon: FileText },
    { id: 'timeline', name: 'Timeline', icon: Clock },
    { id: 'graph', name: 'Graph', icon: GitMerge },
    { id: 'goals', name: 'Goals', icon: Target },
  ] as const;

  return (
    <AppLayout>
      <div className="space-y-6 select-none flex flex-col h-full">
        {/* Space Header info */}
        <SpaceHeader space={space} />

        {/* Tab Selection */}
        <div className="flex border-b border-border text-left">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  handleCloseArtifact();
                }}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Page Contents */}
        <div className="flex-1 min-h-0">
          {activeTab === 'dashboard' && (
            <DashboardGrid 
              space={space} 
              onNavigateToTab={setActiveTab}
              onOpenArtifact={handleOpenArtifact}
              onQuickCapture={handleNewGoal}
            />
          )}

          {activeTab === 'artifacts' && (
            activeArtifactId ? (
              <ArtifactEditor 
                artifactId={activeArtifactId} 
                onClose={handleCloseArtifact} 
              />
            ) : (
              <ArtifactExplorer 
                artifacts={artifacts.filter(a => !a.archived)} 
                onOpenArtifact={handleOpenArtifact}
                onNewArtifact={handleNewArtifact}
              />
            )
          )}

          {activeTab === 'timeline' && (
            <TimelineFeed spaceId={space.id} />
          )}

          {activeTab === 'graph' && (
            <KnowledgeGraph spaceId={space.id} onOpenArtifact={handleOpenArtifact} />
          )}

          {activeTab === 'goals' && (
            activeArtifactId ? (
              <ArtifactEditor 
                artifactId={activeArtifactId} 
                onClose={handleCloseArtifact} 
              />
            ) : (
              <ArtifactExplorer 
                artifacts={artifacts.filter(a => a.type === 'goal' && !a.archived)} 
                onOpenArtifact={handleOpenArtifact}
                onNewArtifact={handleNewGoal}
              />
            )
          )}
        </div>
      </div>
    </AppLayout>
  );
};
export default SpacePage;
