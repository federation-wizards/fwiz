export interface ShareScopeEntry {
  name: string;
  version: string;
  from: string;
  loaded?: boolean;
  eager?: boolean;
  singleton?: boolean;
  requiredVersion?: string;
}

export interface RemoteRuntimeInfo {
  name: string;
  entry: string;
  loadedAt?: number;
  exposedModules?: string[];
  shareScope?: Record<string, ShareScopeEntry>;
}

export interface ContainerRuntimeInfo {
  name: string;
  hostName: string;
  remotes: RemoteRuntimeInfo[];
  shareScope: Record<string, ShareScopeEntry>;
  loadedAt?: number;
}

export interface RuntimeEvent {
  type: 'init' | 'resolveShare' | 'loadRemoteEntry' | 'beforeLoadShare';
  timestamp: number;
  detail: Record<string, unknown>;
}

export interface RuntimeSnapshot {
  hostName: string;
  updatedAt: number;
  containers: ContainerRuntimeInfo[];
  shareScope: Record<string, ShareScopeEntry>;
  remotes: RemoteRuntimeInfo[];
  events: RuntimeEvent[];
}

export interface FederationRuntimePlugin {
  name: string;
  afterInit?: (args: Record<string, unknown>) => void | Promise<void>;
  resolveShare?: (args: Record<string, unknown>) => Record<string, unknown>;
  loadRemoteEntry?: (
    args: Record<string, unknown>,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;
  beforeLoadShare?: (args: Record<string, unknown>) => Record<string, unknown>;
}

interface FederationInstanceRecord {
  options?: {
    name?: string;
    remotes?: Array<{ name?: string; entry?: string; alias?: string }>;
    shared?: Record<string, unknown>;
  };
  instance?: {
    options?: { name?: string };
    moduleCache?: Map<string, unknown>;
    shareScopeMap?: Map<string, Map<string, unknown>>;
  };
}

interface FederationGlobal {
  __INSTANCES__?: FederationInstanceRecord[];
}

interface FwizRuntimeGlobal {
  snapshots: Record<string, RuntimeSnapshot>;
}

declare global {
  // eslint-disable-next-line no-var
  var __FEDERATION__: FederationGlobal | undefined;
  // eslint-disable-next-line no-var
  var __FWIZ_RUNTIME__: FwizRuntimeGlobal | undefined;
}

function ensureFwizRuntime(): FwizRuntimeGlobal {
  if (!globalThis.__FWIZ_RUNTIME__) {
    globalThis.__FWIZ_RUNTIME__ = { snapshots: {} };
  }
  return globalThis.__FWIZ_RUNTIME__;
}

function parseShareScope(
  shareScopeMap?: Map<string, Map<string, unknown>>,
): Record<string, ShareScopeEntry> {
  const result: Record<string, ShareScopeEntry> = {};

  if (!shareScopeMap) {
    return result;
  }

  for (const [scopeName, scopeEntries] of shareScopeMap.entries()) {
    for (const [pkgName, entry] of scopeEntries.entries()) {
      const record = entry as Record<string, unknown>;
      const key = `${scopeName}:${pkgName}`;
      result[key] = {
        name: pkgName,
        version: String(record['version'] ?? record['loaded'] ?? 'unknown'),
        from: String(record['from'] ?? scopeName),
        loaded: Boolean(record['loaded']),
        eager: Boolean(record['eager']),
        singleton: Boolean(record['singleton']),
        requiredVersion: record['requiredVersion']
          ? String(record['requiredVersion'])
          : undefined,
      };
    }
  }

  return result;
}

export function inspectFederationGlobal(
  hostName = 'unknown',
): RuntimeSnapshot {
  const federation = globalThis.__FEDERATION__;
  const instances = federation?.__INSTANCES__ ?? [];
  const containers: ContainerRuntimeInfo[] = [];
  const remotes: RemoteRuntimeInfo[] = [];
  const shareScope: Record<string, ShareScopeEntry> = {};

  for (const record of instances) {
    const name =
      record.options?.name ?? record.instance?.options?.name ?? hostName;
    const instanceShareScope = parseShareScope(record.instance?.shareScopeMap);
    Object.assign(shareScope, instanceShareScope);

    const remoteList: RemoteRuntimeInfo[] = (record.options?.remotes ?? []).map(
      (remote) => ({
        name: remote.name ?? remote.alias ?? 'unknown',
        entry: remote.entry ?? '',
      }),
    );

    remotes.push(...remoteList);
    containers.push({
      name,
      hostName,
      remotes: remoteList,
      shareScope: instanceShareScope,
      loadedAt: Date.now(),
    });
  }

  return {
    hostName,
    updatedAt: Date.now(),
    containers,
    shareScope,
    remotes,
    events: [],
  };
}

export function updateRuntimeSnapshot(snapshot: RuntimeSnapshot): void {
  const runtime = ensureFwizRuntime();
  runtime.snapshots[snapshot.hostName] = snapshot;
}

export function getRuntimeSnapshot(
  hostName?: string,
): RuntimeSnapshot | Record<string, RuntimeSnapshot> {
  const runtime = ensureFwizRuntime();

  if (hostName) {
    return (
      runtime.snapshots[hostName] ?? {
        hostName,
        updatedAt: Date.now(),
        containers: [],
        shareScope: {},
        remotes: [],
        events: [],
      }
    );
  }

  return { ...runtime.snapshots };
}

export function mergeRuntimeSnapshots(
  snapshots: RuntimeSnapshot[],
): RuntimeSnapshot {
  const merged: RuntimeSnapshot = {
    hostName: 'merged',
    updatedAt: Date.now(),
    containers: [],
    shareScope: {},
    remotes: [],
    events: [],
  };

  for (const snapshot of snapshots) {
    merged.containers.push(...snapshot.containers);
    merged.remotes.push(...snapshot.remotes);
    merged.events.push(...snapshot.events);
    Object.assign(merged.shareScope, snapshot.shareScope);
  }

  merged.updatedAt = Date.now();
  return merged;
}

export async function reportSnapshotToDashboard(
  snapshot: RuntimeSnapshot,
  dashboardUrl = process.env['FWIZ_DASHBOARD_URL'] ?? 'http://localhost:5000',
): Promise<void> {
  const url = `${dashboardUrl.replace(/\/$/, '')}/api/runtime/${encodeURIComponent(snapshot.hostName)}`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  });
}

function appendEvent(
  snapshot: RuntimeSnapshot,
  type: RuntimeEvent['type'],
  detail: Record<string, unknown>,
): RuntimeSnapshot {
  return {
    ...snapshot,
    updatedAt: Date.now(),
    events: [
      ...snapshot.events,
      {
        type,
        timestamp: Date.now(),
        detail,
      },
    ],
  };
}

export function createRuntimeInspectorPlugin(options?: {
  hostName?: string;
  dashboardUrl?: string;
  report?: boolean;
}): FederationRuntimePlugin {
  const hostName = options?.hostName ?? 'host';
  const dashboardUrl = options?.dashboardUrl ?? process.env['FWIZ_DASHBOARD_URL'];
  const shouldReport = options?.report ?? true;

  const refresh = async (
    type: RuntimeEvent['type'],
    detail: Record<string, unknown>,
  ): Promise<void> => {
    const existing = getRuntimeSnapshot(hostName) as RuntimeSnapshot;
    const base =
      existing.hostName === hostName
        ? existing
        : inspectFederationGlobal(hostName);
    const inspected = inspectFederationGlobal(hostName);
    const snapshot = appendEvent(
      {
        ...base,
        containers: inspected.containers,
        shareScope: inspected.shareScope,
        remotes: inspected.remotes,
        hostName,
      },
      type,
      detail,
    );

    updateRuntimeSnapshot(snapshot);

    if (shouldReport && dashboardUrl) {
      try {
        await reportSnapshotToDashboard(snapshot, dashboardUrl);
      } catch {
        // Dashboard may not be running during local dev.
      }
    }
  };

  return {
    name: 'fwiz-runtime-inspector',
    afterInit: async (args) => {
      await refresh('init', args);
    },
    resolveShare: (args) => {
      void refresh('resolveShare', args);
      return args;
    },
    loadRemoteEntry: async (args) => {
      await refresh('loadRemoteEntry', args);
      return args;
    },
    beforeLoadShare: (args) => {
      void refresh('beforeLoadShare', args);
      return args;
    },
  };
}
