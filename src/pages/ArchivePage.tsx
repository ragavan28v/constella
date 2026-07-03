import React, { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import type { Space, Artifact } from '../types';
import { db } from '../db/database';
import { useSpaceStore } from '../stores/spaceStore';
import { useArtifactStore } from '../stores/artifactStore';
import { RotateCcw, Trash2, FileText } from 'lucide-react';
import { EmptyState } from '../components/shared/EmptyState';

export const ArchivePage: React.FC = () => {
  const [archivedSpaces, setArchivedSpaces] = useState<Space[]>([]);
  const [archivedArtifacts, setArchivedArtifacts] = useState<Artifact[]>([]);
  
  const { updateSpace, deleteSpace } = useSpaceStore();
  const { updateArtifact, deleteArtifact } = useArtifactStore();

  const fetchArchived = async () => {
    const spacesList = await db.spaces.where('archived').equals(1).toArray();
    setArchivedSpaces(spacesList);

    const artsList = await db.artifacts.where('status').equals('archived').toArray();
    setArchivedArtifacts(artsList);
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleRestoreSpace = async (spaceId: string) => {
    await updateSpace(spaceId, { archived: false });
    fetchArchived();
  };

  const handleRestoreArtifact = async (artId: string) => {
    await updateArtifact(artId, { status: 'active', archived: false });
    fetchArchived();
  };

  const handleDeleteSpace = async (spaceId: string) => {
    if (confirm("Are you sure you want to permanently delete this space? All of its files will be lost.")) {
      await deleteSpace(spaceId);
      fetchArchived();
    }
  };

  const handleDeleteArtifact = async (artId: string) => {
    if (confirm("Are you sure you want to permanently delete this artifact?")) {
      await deleteArtifact(artId);
      fetchArchived();
    }
  };

  const hasContent = archivedSpaces.length > 0 || archivedArtifacts.length > 0;

  return (
    <AppLayout>
      <div className="space-y-8 text-left select-none max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Archive</h1>
          <p className="text-xs text-text-secondary mt-0.5">Manage and restore archived spaces and artifacts.</p>
        </div>

        {hasContent ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Archived Spaces */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-1">
                Archived Spaces ({archivedSpaces.length})
              </h2>
              <div className="space-y-2">
                {archivedSpaces.map(sp => (
                  <div key={sp.id} className="flex items-center justify-between p-3 bg-app-surface border border-border rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-sm">{sp.icon}</span>
                      <span className="text-xs font-semibold text-text-primary truncate">{sp.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestoreSpace(sp.id)}
                        className="p-1 rounded hover:bg-app-hover text-accent transition-colors"
                        title="Restore Space"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSpace(sp.id)}
                        className="p-1 rounded hover:bg-app-hover text-error transition-colors"
                        title="Delete Space Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {archivedSpaces.length === 0 && (
                  <p className="text-xs text-text-tertiary italic">No archived spaces.</p>
                )}
              </div>
            </div>

            {/* Archived Artifacts */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-1">
                Archived Artifacts ({archivedArtifacts.length})
              </h2>
              <div className="space-y-2">
                {archivedArtifacts.map(art => (
                  <div key={art.id} className="flex items-center justify-between p-3 bg-app-surface border border-border rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-4 h-4 text-text-secondary flex-shrink-0" />
                      <span className="text-xs font-semibold text-text-primary truncate">{art.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestoreArtifact(art.id)}
                        className="p-1 rounded hover:bg-app-hover text-accent transition-colors"
                        title="Restore Artifact"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArtifact(art.id)}
                        className="p-1 rounded hover:bg-app-hover text-error transition-colors"
                        title="Delete Artifact Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {archivedArtifacts.length === 0 && (
                  <p className="text-xs text-text-tertiary italic">No archived artifacts.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            iconName="Archive"
            heading="Archive is empty"
            subtext="Items you archive will appear here where you can restore them anytime."
          />
        )}
      </div>
    </AppLayout>
  );
};
export default ArchivePage;
