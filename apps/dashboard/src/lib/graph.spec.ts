import type { FwizConfig } from '@federation-wizards/core';
import { describe, expect, it } from 'vitest';

import { buildExportPayload, buildGraphFromConfig } from './graph.js';

const sampleConfig: FwizConfig = {
  version: '1',
  workspace: { type: 'nx' },
  hosts: [{ name: 'shell', port: 4200, project: 'shell' }],
  remotes: [{ name: 'checkout', port: 4201, project: 'checkout' }],
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^19.0.0',
      eager: false,
    },
  },
};

describe('graph', () => {
  it('buildGraphFromConfig creates host, remote, and shared nodes', () => {
    const { nodes, edges } = buildGraphFromConfig(sampleConfig);

    expect(nodes.some((node) => node.id === 'host:shell')).toBe(true);
    expect(nodes.some((node) => node.id === 'remote:checkout')).toBe(true);
    expect(nodes.some((node) => node.id === 'shared:react')).toBe(true);
    expect(edges.some((edge) => edge.source === 'host:shell')).toBe(true);
  });

  it('buildExportPayload includes config, graph, and runtime data', () => {
    const { nodes, edges } = buildGraphFromConfig(sampleConfig);
    const payload = buildExportPayload(sampleConfig, nodes, edges, []);

    expect(payload.config.hosts).toHaveLength(1);
    expect(payload.graph.nodes).toHaveLength(nodes.length);
    expect(payload.exportedAt).toBeTruthy();
  });
});
