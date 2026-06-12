import type { FwizConfig } from '@federation-wizards/core';
import type { Edge, Node } from '@xyflow/react';

import type { RuntimeSnapshot } from '@federation-wizards/mf-plugins';

export type FederationNodeKind = 'host' | 'remote' | 'shared';

export interface FederationNodeData extends Record<string, unknown> {
  kind: FederationNodeKind;
  label: string;
  port?: number;
  project?: string;
  singleton?: boolean;
  requiredVersion?: string;
  eager?: boolean;
}

export interface GraphExportPayload {
  exportedAt: string;
  config: FwizConfig;
  graph: {
    nodes: Node<FederationNodeData>[];
    edges: Edge[];
  };
  runtime: RuntimeSnapshot[];
}

export function buildGraphFromConfig(config: FwizConfig): {
  nodes: Node<FederationNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<FederationNodeData>[] = [];
  const edges: Edge[] = [];

  config.hosts.forEach((host, index) => {
    nodes.push({
      id: `host:${host.name}`,
      type: 'federation',
      position: { x: 80 + index * 280, y: 80 },
      data: {
        kind: 'host',
        label: host.name,
        port: host.port,
        project: host.project,
      },
    });
  });

  config.remotes.forEach((remote, index) => {
    nodes.push({
      id: `remote:${remote.name}`,
      type: 'federation',
      position: { x: 80 + index * 220, y: 280 },
      data: {
        kind: 'remote',
        label: remote.name,
        port: remote.port,
        project: remote.project,
      },
    });

    for (const host of config.hosts) {
      edges.push({
        id: `edge:${host.name}->${remote.name}`,
        source: `host:${host.name}`,
        target: `remote:${remote.name}`,
        label: 'consumes',
      });
    }
  });

  Object.entries(config.shared).forEach(([name, shared], index) => {
    nodes.push({
      id: `shared:${name}`,
      type: 'federation',
      position: { x: 720, y: 80 + index * 90 },
      data: {
        kind: 'shared',
        label: name,
        singleton: shared.singleton,
        requiredVersion: shared.requiredVersion,
        eager: shared.eager,
      },
    });

    for (const host of config.hosts) {
      edges.push({
        id: `edge:${host.name}->shared:${name}`,
        source: `host:${host.name}`,
        target: `shared:${name}`,
        label: 'shared',
      });
    }
  });

  return { nodes, edges };
}

export function buildExportPayload(
  config: FwizConfig,
  nodes: Node<FederationNodeData>[],
  edges: Edge[],
  runtime: RuntimeSnapshot[],
): GraphExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    config,
    graph: { nodes, edges },
    runtime,
  };
}
