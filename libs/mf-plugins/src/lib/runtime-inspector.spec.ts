import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createRuntimeInspectorPlugin,
  getRuntimeSnapshot,
  inspectFederationGlobal,
  mergeRuntimeSnapshots,
  reportSnapshotToDashboard,
  updateRuntimeSnapshot,
  type RuntimeSnapshot,
} from './runtime-inspector.js';

describe('runtime-inspector', () => {
  beforeEach(() => {
    globalThis.__FEDERATION__ = {
      __INSTANCES__: [
        {
          options: {
            name: 'shell',
            remotes: [{ name: 'checkout', entry: 'http://localhost:4201/remoteEntry.js' }],
          },
          instance: {
            options: { name: 'shell' },
            shareScopeMap: new Map([
              [
                'default',
                new Map([
                  [
                    'react',
                    {
                      version: '19.0.0',
                      from: 'shell',
                      loaded: true,
                      singleton: true,
                    },
                  ],
                ]),
              ],
            ]),
          },
        },
      ],
    };
    globalThis.__FWIZ_RUNTIME__ = { snapshots: {} };
  });

  afterEach(() => {
    delete globalThis.__FEDERATION__;
    delete globalThis.__FWIZ_RUNTIME__;
    vi.restoreAllMocks();
  });

  it('inspectFederationGlobal reads __FEDERATION__.__INSTANCES__', () => {
    const snapshot = inspectFederationGlobal('shell');

    expect(snapshot.hostName).toBe('shell');
    expect(snapshot.containers).toHaveLength(1);
    expect(snapshot.remotes[0]?.name).toBe('checkout');
    expect(snapshot.shareScope['default:react']?.version).toBe('19.0.0');
  });

  it('updateRuntimeSnapshot and getRuntimeSnapshot store in __FWIZ_RUNTIME__', () => {
    const snapshot = inspectFederationGlobal('shell');
    updateRuntimeSnapshot(snapshot);

    const stored = getRuntimeSnapshot('shell') as RuntimeSnapshot;
    expect(stored.hostName).toBe('shell');
    expect(stored.remotes).toHaveLength(1);
  });

  it('mergeRuntimeSnapshots combines multiple host snapshots', () => {
    const shell = inspectFederationGlobal('shell');
    const checkout = inspectFederationGlobal('checkout');
    checkout.remotes.push({
      name: 'payment',
      entry: 'http://localhost:4202/remoteEntry.js',
    });

    const merged = mergeRuntimeSnapshots([shell, checkout]);

    expect(merged.containers.length).toBeGreaterThan(1);
    expect(merged.remotes.some((remote) => remote.name === 'payment')).toBe(
      true,
    );
  });

  it('createRuntimeInspectorPlugin hooks update runtime snapshot', async () => {
    const plugin = createRuntimeInspectorPlugin({
      hostName: 'shell',
      report: false,
    });

    await plugin.afterInit?.({ name: 'shell' });

    const snapshot = getRuntimeSnapshot('shell') as RuntimeSnapshot;
    expect(snapshot.events.some((event) => event.type === 'init')).toBe(true);

    plugin.resolveShare?.({ pkgName: 'react', shareScope: 'default' });
    plugin.beforeLoadShare?.({ pkgName: 'react' });
    await plugin.loadRemoteEntry?.({ remoteName: 'checkout' });

    const updated = getRuntimeSnapshot('shell') as RuntimeSnapshot;
    expect(updated.events.length).toBeGreaterThanOrEqual(3);
  });

  it('reportSnapshotToDashboard POSTs to dashboard API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const snapshot = inspectFederationGlobal('shell');
    await reportSnapshotToDashboard(snapshot, 'http://localhost:5000');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/runtime/shell',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });
});
