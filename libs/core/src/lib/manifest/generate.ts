import { createHash } from 'node:crypto';

import type {
  RegistryConfig,
  RemoteConfig,
  SharedDependencyConfig,
} from '../config/types.js';
import { getManifestStorageKey, getPublicUrl } from '../registry/paths.js';
import type { MfManifest } from '../registry/types.js';

const EMPTY_ASSETS = {
  js: { sync: [] as string[], async: [] as string[] },
  css: { sync: [] as string[], async: [] as string[] },
};

export interface GenerateManifestOptions {
  remote: RemoteConfig;
  version: string;
  shared: Record<string, SharedDependencyConfig>;
  registry: RegistryConfig;
  buildId?: string;
}

function createBuildId(remoteName: string, version: string): string {
  return createHash('sha256')
    .update(`${remoteName}:${version}`)
    .digest('hex')
    .slice(0, 16);
}

function toManifestShared(
  shared: Record<string, SharedDependencyConfig>,
): MfManifest['shared'] {
  return Object.entries(shared).map(([name, config]) => ({
    id: name,
    name,
    version: config.requiredVersion,
    singleton: config.singleton,
    requiredVersion: config.requiredVersion,
    assets: EMPTY_ASSETS,
  }));
}

export function generateMfManifest(options: GenerateManifestOptions): MfManifest {
  const { remote, version, shared, registry } = options;
  const buildId = options.buildId ?? createBuildId(remote.name, version);
  const storageKey = getManifestStorageKey(registry, remote.name, version);
  const publicPath = `${getPublicUrl(registry, storageKey).replace(/\/mf-manifest\.json$/, '')}/`;
  const remoteEntryName = 'remoteEntry.js';

  return {
    id: buildId,
    name: remote.name,
    metaData: {
      name: remote.name,
      globalName: remote.name,
      type: 'app',
      buildInfo: {
        buildVersion: version,
        buildName: remote.project ?? remote.name,
      },
      remoteEntry: {
        path: remoteEntryName,
        name: remoteEntryName,
        type: 'var',
      },
      publicPath,
    },
    shared: toManifestShared(shared),
    remotes: [],
    exposes: [
      {
        id: `${remote.name}:./Module`,
        name: './Module',
        path: './src/index',
        assets: EMPTY_ASSETS,
      },
    ],
  };
}
