import type { RegistryConfig } from '../config/types.js';

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

export function joinRegistryPath(...segments: string[]): string {
  return segments
    .map((segment) => trimSlashes(segment))
    .filter((segment) => segment.length > 0)
    .join('/');
}

export function getRegistryPrefix(registry: RegistryConfig): string {
  return trimSlashes(registry.prefix ?? '');
}

export function getRemotesRegistryKey(registry: RegistryConfig): string {
  return registry.remotesRegistryKey ?? 'remotes-registry.json';
}

export function getManifestStorageKey(
  registry: RegistryConfig,
  remoteName: string,
  version: string,
): string {
  const prefix = getRegistryPrefix(registry);
  return joinRegistryPath(prefix, remoteName, version, 'mf-manifest.json');
}

export function getRemotesRegistryStorageKey(registry: RegistryConfig): string {
  const prefix = getRegistryPrefix(registry);
  return joinRegistryPath(prefix, getRemotesRegistryKey(registry));
}

export function getPublicUrl(registry: RegistryConfig, storageKey: string): string {
  const baseUrl = registry.baseUrl.replace(/\/+$/, '');
  const key = trimSlashes(storageKey);
  return `${baseUrl}/${key}`;
}
