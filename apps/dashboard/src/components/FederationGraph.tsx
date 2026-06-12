import { useMemo, type RefObject } from 'react';

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { FwizConfig } from '@federation-wizards/core';

import {
  buildGraphFromConfig,
  type FederationNodeData,
} from '../lib/graph.js';

import { FederationNode } from './FederationNode.js';

const nodeTypes = {
  federation: FederationNode,
};

interface FederationGraphProps {
  config: FwizConfig;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  graphRef?: RefObject<HTMLDivElement | null>;
}

function FederationGraphInner({
  config,
  selectedNodeId,
  onSelectNode,
  graphRef,
}: FederationGraphProps) {
  const { nodes, edges } = useMemo(
    () => buildGraphFromConfig(config),
    [config],
  );

  const styledNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    [nodes, selectedNodeId],
  );

  return (
    <div ref={graphRef} className="graph-canvas">
      <ReactFlow
        nodes={styledNodes as Node<FederationNodeData>[]}
        edges={edges as Edge[]}
        nodeTypes={nodeTypes}
        fitView
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
      >
        <MiniMap />
        <Controls />
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
}

export function FederationGraph(props: FederationGraphProps) {
  return (
    <ReactFlowProvider>
      <FederationGraphInner {...props} />
    </ReactFlowProvider>
  );
}
