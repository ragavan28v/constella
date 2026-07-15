import React, { useState, useEffect } from 'react';
import { useArtifactStore } from '../../stores/artifactStore';
import { getArtifactById, getArtifactsBySpaceId, getRelationshipsByArtifactId, createRelationship, deleteRelationship } from '../../services/cloudRepository';
import type { Artifact, Relationship } from '../../types';
import { Link2, Trash2 } from 'lucide-react';

export const InspectorPanel: React.FC = () => {
  const { activeArtifactId, updateArtifact } = useArtifactStore();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  
  // Link builder states
  const [spaceArtifacts, setSpaceArtifacts] = useState<Artifact[]>([]);
  const [targetId, setTargetId] = useState('');
  const [linkType, setLinkType] = useState<Relationship['relationshipType']>('related');
  
  // Active links list
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [allArtifactNames, setAllArtifactNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!activeArtifactId) {
      setArtifact(null);
      return;
    }

    const loadInspectorData = async () => {
      const artObj = await getArtifactById(activeArtifactId);
      if (artObj) {
        setArtifact(artObj);

        const list = (await getArtifactsBySpaceId(artObj.spaceId)).filter(
          a => a.id !== activeArtifactId && a.status !== 'archived'
        );
        setSpaceArtifacts(list);

        const links = await getRelationshipsByArtifactId(activeArtifactId);
        setRelationships(links);

        const allArts = await getArtifactsBySpaceId(artObj.spaceId);
        const aMap: Record<string, string> = {};
        allArts.forEach(a => { aMap[a.id] = a.title; });
        setAllArtifactNames(aMap);
      }
    };

    loadInspectorData();
  }, [activeArtifactId, relationships.length]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!artifact) return;
    const status = e.target.value as Artifact['status'];
    await updateArtifact(artifact.id, { status });
    setArtifact(prev => prev ? { ...prev, status } : null);
  };

  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!artifact) return;
    const priority = (e.target.value === 'null' ? null : e.target.value) as Artifact['priority'];
    await updateArtifact(artifact.id, { priority });
    setArtifact(prev => prev ? { ...prev, priority } : null);
  };

  const handleAddLink = async () => {
    if (!artifact || !targetId) return;

    const newLink: Relationship = {
      id: crypto.randomUUID(),
      sourceArtifactId: artifact.id,
      targetArtifactId: targetId,
      relationshipType: linkType,
      createdAt: Date.now()
    };

    await createRelationship(newLink);
    const links = await getRelationshipsByArtifactId(artifact.id);
    setRelationships(links);
    setTargetId('');
  };

  const handleDeleteLink = async (id: string) => {
    await deleteRelationship(id);
    if (artifact) {
      const links = await getRelationshipsByArtifactId(artifact.id);
      setRelationships(links);
    }
  };

  if (!artifact) {
    return (
      <div className="text-center py-12 text-xs text-text-tertiary italic">
        Select an artifact to inspect its metadata and relationships.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left select-none">
      {/* Properties Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-1">
          Properties
        </h3>
        
        {/* Status */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-text-secondary">Status</label>
          <select
            value={artifact.status}
            onChange={handleStatusChange}
            className="text-xs border border-border bg-app-bg px-2 py-1 rounded-lg text-text-primary focus:outline-none"
          >
            <option value="active">Active</option>
            <option value="done">Done</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Priority */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-text-secondary">Priority</label>
          <select
            value={artifact.priority || 'null'}
            onChange={handlePriorityChange}
            className="text-xs border border-border bg-app-bg px-2 py-1 rounded-lg text-text-primary focus:outline-none"
          >
            <option value="null">None</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Linked Nodes Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-1">
          Knowledge Links
        </h3>

        {/* Existing links */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {relationships.map(rel => {
            const isSource = rel.sourceArtifactId === artifact.id;
            const linkPartnerId = isSource ? rel.targetArtifactId : rel.sourceArtifactId;
            const partnerTitle = allArtifactNames[linkPartnerId] || 'Untitled Link';
            
            return (
              <div 
                key={rel.id} 
                className="flex items-center justify-between bg-app-bg border border-border p-2 rounded-lg text-xs"
              >
                <div className="truncate flex-1 pr-2">
                  <span className="text-accent font-semibold">[{rel.relationshipType}]</span>
                  <span className="ml-1 text-text-primary font-medium">{partnerTitle}</span>
                </div>
                <button 
                  onClick={() => handleDeleteLink(rel.id)}
                  className="text-text-tertiary hover:text-error transition-colors"
                  title="Remove link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          {relationships.length === 0 && (
            <span className="text-[11px] text-text-tertiary italic block">No connections established yet.</span>
          )}
        </div>

        {/* Link Builder Form */}
        {spaceArtifacts.length > 0 && (
          <div className="bg-app-bg border border-border rounded-xl p-3 space-y-2">
            <div className="text-[10px] font-bold text-text-secondary uppercase">Link new artifact</div>
            
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full text-xs border border-border bg-app-surface px-2 py-1.5 rounded-lg text-text-primary focus:outline-none"
            >
              <option value="">Select target...</option>
              {spaceArtifacts.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>

            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as Relationship['relationshipType'])}
              className="w-full text-xs border border-border bg-app-surface px-2 py-1.5 rounded-lg text-text-primary focus:outline-none"
            >
              <option value="related">Related to</option>
              <option value="depends_on">Depends on</option>
              <option value="inspired_by">Inspired by</option>
              <option value="uses">Uses</option>
              <option value="references">References</option>
              <option value="parent">Parent of</option>
              <option value="child">Child of</option>
            </select>

            <button
              onClick={handleAddLink}
              disabled={!targetId}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Establish Link</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default InspectorPanel;
