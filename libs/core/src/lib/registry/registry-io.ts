import type { RegistryConfig } from '../config/types.js';
import type { RegistryBackend } from './backends/types.js';
import {
  getPublicUrl,
  getRemotesRegistryStorageKey,
} from './paths.js';
import type { RemotesRegistry } from './types.js';

const EMPTY_REGISTRY: RemotesRegistry = {
  version: '1',
  updatedAt: new Date(0).toISOString(),
  remotes: {},
};

export function parseRemotesRegistry(raw: string | null): RemotesRegistry {
  if (!raw) {
    return structuredClone(EMPTY_REGISTRY);
  }

  const parsed = JSON.parse(raw) as RemotesRegistry;

  return {
    version: parsed.version ?? '1',
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    remotes: parsed.remotes ?? {},
  };
}

export async function loadRemotesRegistry(
  backend: RegistryBackend,
  registry: RegistryConfig,
): Promise<RemotesRegistry> {
  const key = getRemotesRegistryStorageKey(registry);
  const raw = await backend.get(key);
  return parseRemotesRegistry(raw);
}

export async function saveRemotesRegistry(
  backend: RegistryBackend,
  registry: RegistryConfig,
  remotesRegistry: RemotesRegistry,
): Promise<string> {
  const key = getRemotesRegistryStorageKey(registry);
  const payload = JSON.stringify(
    {
      ...remotesRegistry,
      updatedAt: new Date().toISOString(),
    },
    null,
    2,
  );

  await backend.put(key, `${payload}\n`);
  return getPublicUrl(registry, key);
}
