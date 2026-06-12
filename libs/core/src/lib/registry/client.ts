import type { RemoteConfig, RegistryConfig } from '../config/types.js';
import type { RegistryBackend } from './backends/types.js';
import { getManifestStorageKey } from './paths.js';
import { loadRemotesRegistry } from './registry-io.js';
import type { MfManifest, RemotesRegistry } from './types.js';

export class RegistryClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryClientError';
  }
}

export interface FetchedRemoteManifest {
  remote: string;
  version: string;
  manifestUrl: string;
  manifest: MfManifest;
}

export interface RegistryClientResult {
  remotesRegistry: RemotesRegistry;
  manifests: FetchedRemoteManifest[];
}

function parseManifest(raw: string, context: string): MfManifest {
  try {
    return JSON.parse(raw) as MfManifest;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new RegistryClientError(
      `Failed to parse manifest for ${context}: ${message}`,
    );
  }
}

export async function fetchRegistryManifests(
  backend: RegistryBackend,
  registry: RegistryConfig,
  remotes: RemoteConfig[],
): Promise<RegistryClientResult> {
  const remotesRegistry = await loadRemotesRegistry(backend, registry);
  const manifests: FetchedRemoteManifest[] = [];

  for (const remote of remotes) {
    const entry = remotesRegistry.remotes[remote.name];

    if (!entry?.current) {
      throw new RegistryClientError(
        `Remote "${remote.name}" has no published version in the registry.`,
      );
    }

    const version = entry.current;
    const versionEntry = entry.versions[version];

    if (!versionEntry) {
      throw new RegistryClientError(
        `Remote "${remote.name}" registry entry is missing manifest metadata for version ${version}.`,
      );
    }

    const storageKey = getManifestStorageKey(registry, remote.name, version);
    const raw = await backend.get(storageKey);

    if (!raw) {
      throw new RegistryClientError(
        `Manifest not found for remote "${remote.name}" at version ${version} (${storageKey}).`,
      );
    }

    manifests.push({
      remote: remote.name,
      version,
      manifestUrl: versionEntry.manifestUrl,
      manifest: parseManifest(raw, remote.name),
    });
  }

  return { remotesRegistry, manifests };
}
