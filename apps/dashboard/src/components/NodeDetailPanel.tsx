import type { Node } from '@xyflow/react';

import type { RuntimeSnapshot } from '@federation-wizards/mf-plugins';

import type { FederationNodeData } from '../lib/graph.js';

interface NodeDetailPanelProps {
  node: Node<FederationNodeData> | null;
  snapshots: RuntimeSnapshot[];
}

function findRuntimeForNode(
  node: Node<FederationNodeData>,
  snapshots: RuntimeSnapshot[],
): RuntimeSnapshot | undefined {
  const label = node.data.label;

  return snapshots.find(
    (snapshot) =>
      snapshot.hostName === label ||
      snapshot.remotes.some((remote) => remote.name === label),
  );
}

export function NodeDetailPanel({ node, snapshots }: NodeDetailPanelProps) {
  if (!node) {
    return (
      <section className="panel">
        <h2>Node details</h2>
        <p className="muted">Select a node to inspect federation metadata.</p>
      </section>
    );
  }

  const runtime = findRuntimeForNode(node, snapshots);
  const remoteRuntime = runtime?.remotes.find(
    (remote) => remote.name === node.data.label,
  );

  return (
    <section className="panel">
      <h2>{node.data.label}</h2>
      <dl className="detail-list">
        <div>
          <dt>Kind</dt>
          <dd>{node.data.kind}</dd>
        </div>
        {node.data.project ? (
          <div>
            <dt>Project</dt>
            <dd>{node.data.project}</dd>
          </div>
        ) : null}
        {node.data.port !== undefined ? (
          <div>
            <dt>Port</dt>
            <dd>{node.data.port}</dd>
          </div>
        ) : null}
        {node.data.requiredVersion ? (
          <div>
            <dt>Required version</dt>
            <dd>{node.data.requiredVersion}</dd>
          </div>
        ) : null}
        {node.data.singleton !== undefined ? (
          <div>
            <dt>Singleton</dt>
            <dd>{node.data.singleton ? 'yes' : 'no'}</dd>
          </div>
        ) : null}
        {remoteRuntime?.entry ? (
          <div>
            <dt>Remote entry</dt>
            <dd>{remoteRuntime.entry}</dd>
          </div>
        ) : null}
        {remoteRuntime?.loadedAt ? (
          <div>
            <dt>Loaded at</dt>
            <dd>{new Date(remoteRuntime.loadedAt).toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
