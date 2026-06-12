export interface MfManifestResourceInfo {
  path: string;
  name: string;
  type: string;
}

export interface MfManifestMetaData {
  name: string;
  globalName: string;
  type: string;
  buildInfo: {
    buildVersion: string;
    buildName: string;
  };
  remoteEntry: MfManifestResourceInfo;
  publicPath: string;
}

export interface MfManifestShared {
  id: string;
  name: string;
  version: string;
  singleton: boolean;
  requiredVersion: string;
  assets: {
    js: { sync: string[]; async: string[] };
    css: { sync: string[]; async: string[] };
  };
}

export interface MfManifestExpose {
  id: string;
  name: string;
  path: string;
  assets: {
    js: { sync: string[]; async: string[] };
    css: { sync: string[]; async: string[] };
  };
}

export interface MfManifest {
  id: string;
  name: string;
  metaData: MfManifestMetaData;
  shared: MfManifestShared[];
  remotes: [];
  exposes: MfManifestExpose[];
}

export interface RemoteVersionEntry {
  manifestUrl: string;
  publishedAt: string;
}

export interface RemoteRegistryEntry {
  current: string;
  versions: Record<string, RemoteVersionEntry>;
}

export interface RemotesRegistry {
  version: string;
  updatedAt: string;
  remotes: Record<string, RemoteRegistryEntry>;
}

export interface PublishedRemoteResult {
  name: string;
  manifestUrl: string;
  storageKey: string;
  uploaded: boolean;
}

export interface PublishManifestResult {
  dryRun: boolean;
  version: string;
  remotes: PublishedRemoteResult[];
  registryUpdated: boolean;
  registryUrl: string;
}

export interface RollbackManifestResult {
  dryRun: boolean;
  remote: string;
  previousVersion: string;
  currentVersion: string;
  rolledBack: boolean;
  registryUrl: string;
}

export interface PublishManifestOptions {
  cwd: string;
  version?: string;
  remote?: string;
  dryRun?: boolean;
}

export interface RollbackManifestOptions {
  cwd: string;
  remote: string;
  version?: string;
  dryRun?: boolean;
}
