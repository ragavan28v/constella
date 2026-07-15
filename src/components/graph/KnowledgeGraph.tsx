import React, { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getAllArtifacts, getSpaceRelationships } from '../../services/cloudRepository';

interface KnowledgeGraphProps {
  spaceId: string;
  onOpenArtifact: (id: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ spaceId, onOpenArtifact }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  useEffect(() => {
    const buildGraphData = async () => {
      const artifacts = (await getAllArtifacts()).filter(a => a.spaceId === spaceId);
      const spaceRels = await getSpaceRelationships(spaceId);

      // Calculate node sizes based on connection counts
      const counts: Record<string, number> = {};
      spaceRels.forEach(r => {
        counts[r.sourceArtifactId] = (counts[r.sourceArtifactId] || 0) + 1;
        counts[r.targetArtifactId] = (counts[r.targetArtifactId] || 0) + 1;
      });

      // Build React Flow nodes
      const initialNodes = artifacts.map((art, idx) => {
        const connections = counts[art.id] || 0;
        const sizeFactor = 100 + connections * 10;
        
        // Arrange nodes in a circular or spiral pattern
        const angle = idx * 0.8;
        const radius = 150 + idx * 25;
        const x = Math.cos(angle) * radius + 250;
        const y = Math.sin(angle) * radius + 250;

        return {
          id: art.id,
          position: { x, y },
          data: { label: `📌 ${art.title} (${art.type})` },
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '2px solid var(--accent)',
            borderRadius: '12px',
            padding: '10px',
            fontSize: '11px',
            fontWeight: 'bold',
            width: sizeFactor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            cursor: 'pointer'
          }
        };
      });

      // Build React Flow edges
      const initialEdges = spaceRels.map(r => ({
        id: r.id,
        source: r.sourceArtifactId,
        target: r.targetArtifactId,
        label: r.relationshipType,
        style: { stroke: 'var(--accent)' },
        labelStyle: { fill: 'var(--text-secondary)', fontSize: '8px', fontWeight: 'bold' }
      }));

      setNodes(initialNodes);
      setEdges(initialEdges);
    };

    buildGraphData();
  }, [spaceId, setNodes, setEdges]);

  return (
    <div className="bg-app-surface border border-border rounded-xl shadow-sm h-[500px] w-full relative overflow-hidden select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onOpenArtifact(node.id)}
        fitView
      >
        <Background gap={12} size={1} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  );
};
export default KnowledgeGraph;
