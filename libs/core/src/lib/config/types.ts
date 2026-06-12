export type WorkspaceType = 'nx' | 'turbo' | 'plain';

export interface SharedDependencyConfig {
  singleton: boolean;
  requiredVersion: string;
  eager: boolean;
}

export interface HostConfig {
  name: string;
  project?: string;
  port: number;
}

export interface RemoteConfig {
  name: string;
  project?: string;
  port: number;
}

export type RegistryBackendType = 's3' | 'http';

export interface RegistryConfig {
  type: RegistryBackendType;
  baseUrl: string;
  prefix?: string;
  remotesRegistryKey?: string;
  uploadBaseUrl?: string;
  headers?: Record<string, string>;
  bucket?: string;
  region?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export interface FwizConfig {
  version: string;
  workspace: {
    type: WorkspaceType;
  };
  hosts: HostConfig[];
  remotes: RemoteConfig[];
  shared: Record<string, SharedDependencyConfig>;
  registry?: RegistryConfig;
}

export interface WorkspaceInfo {
  type: WorkspaceType;
  appProjects: string[];
  reactVersion?: string;
}

export interface WorkspacePatchResult {
  patched: boolean;
  filePath: string;
  changes: string[];
}

export interface InitResult {
  created: boolean;
  configPath: string;
  config: FwizConfig;
  validationWarnings: string[];
  workspacePatches: WorkspacePatchResult[];
}
