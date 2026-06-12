import { Handle, Position, type NodeProps } from '@xyflow/react';

import type { FederationNodeData } from '../lib/graph.js';

import styles from './FederationNode.module.css';

export function FederationNode({ data, selected }: NodeProps) {
  const nodeData = data as FederationNodeData;

  return (
    <div
      className={`${styles.node} ${styles[nodeData.kind]} ${
        selected ? styles.selected : ''
      }`}
    >
      <Handle type="target" position={Position.Top} />
      <div className={styles.badge}>{nodeData.kind}</div>
      <strong>{nodeData.label}</strong>
      {nodeData.port !== undefined ? (
        <span className={styles.meta}>port {nodeData.port}</span>
      ) : null}
      {nodeData.requiredVersion ? (
        <span className={styles.meta}>{nodeData.requiredVersion}</span>
      ) : null}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
