import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { generateMfManifest } from '../manifest/generate.js';
import { FwizConfigError, loadFwizConfig } from '../config/load.js';
import type { RemoteConfig } from '../config/types.js';
import { createRegistryBackend } from './backends/factory.js';
import type { RegistryBackend } from './backends/types.js';
import {
  getManifestStorageKey,
  getPublicUrl,
  getRemotesRegistryStorageKey,
} from './paths.js';
import { loadRemotesRegistry, saveRemotesRegistry } from './registry-io.js';
import type {
  PublishManifestOptions,
  PublishManifestResult,
  PublishedRemoteResult,
} from './types.js';

export class PublishManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishManifestError';
  }
}

function resolveVersion(cwd: string, explicitVersion?: string): string {
  if (explicitVersion) {
    return explicitVersion;
  }

  try {
    const packageJson = JSON.parse(
      readFileSync(join(cwd, 'package.json'), 'utf8'),
    ) as { version?: string };

    if (packageJson.version) {
      return packageJson.version;
    }
  } catch {
    // Fall back to timestamp-based version below.
  }

  return `0.0.0-${Date.now()}`;
}

function selectRemotes(
  remotes: RemoteConfig[],
  remoteName?: string,
): RemoteConfig[] {
  if (!remoteName) {
    return remotes;
  }

  const selected = remotes.filter((remote) => remote.name === remoteName);

  if (selected.length === 0) {
    throw new PublishManifestError(
      `Remote "${remoteName}" is not defined in fwiz.config.yaml.`,
    );
  }

  return selected;
}

function requireRegistryConfig(
  config: ReturnType<typeof loadFwizConfig>,
): NonNullable<ReturnType<typeof loadFwizConfig>['registry']> {
  if (!config.registry) {
    throw new PublishManifestError(
      'fwiz.config.yaml is missing a registry section. Add registry.type, registry.baseUrl, and backend-specific settings before publishing.',
    );
  }

  return config.registry;
}

async function publishRemoteManifest(
  backend: RegistryBackend,
  options: {
    remote: RemoteConfig;
    version: string;
    config: ReturnType<typeof loadFwizConfig>;
    dryRun: boolean;
  },
): Promise<PublishedRemoteResult> {
  const registry = options.config.registry!;
  const manifest = generateMfManifest({
    remote: options.remote,
    version: options.version,
    shared: options.config.shared,
    registry,
  });
  const storageKey = getManifestStorageKey(
    registry,
    options.remote.name,
    options.version,
  );
  const manifestUrl = getPublicUrl(registry, storageKey);
  const payload = `${JSON.stringify(manifest, null, 2)}\n`;

  if (!options.dryRun) {
    await backend.put(storageKey, payload);
  }

  return {
    name: options.remote.name,
    manifestUrl,
    storageKey,
    uploaded: !options.dryRun,
  };
}

function updateRegistryForPublish(
  remotesRegistry: Awaited<ReturnType<typeof loadRemotesRegistry>>,
  publishedRemotes: PublishedRemoteResult[],
  version: string,
): Awaited<ReturnType<typeof loadRemotesRegistry>> {
  const next = structuredClone(remotesRegistry);

  for (const published of publishedRemotes) {
    const existing = next.remotes[published.name] ?? {
      current: version,
      versions: {},
    };

    existing.current = version;
    existing.versions[version] = {
      manifestUrl: published.manifestUrl,
      publishedAt: new Date().toISOString(),
    };
    next.remotes[published.name] = existing;
  }

  return next;
}

export async function publishManifest(
  options: PublishManifestOptions,
  backendOverride?: RegistryBackend,
): Promise<PublishManifestResult> {
  const config = loadFwizConfig(options.cwd);
  const registry = requireRegistryConfig(config);
  const backend = backendOverride ?? createRegistryBackend(registry);
  const version = resolveVersion(options.cwd, options.version);
  const dryRun = options.dryRun ?? false;
  const remotes = selectRemotes(config.remotes, options.remote);

  if (remotes.length === 0) {
    throw new PublishManifestError(
      'No remotes configured in fwiz.config.yaml.',
    );
  }

  const publishedRemotes: PublishedRemoteResult[] = [];

  for (const remote of remotes) {
    publishedRemotes.push(
      await publishRemoteManifest(backend, {
        remote,
        version,
        config,
        dryRun,
      }),
    );
  }

  const currentRegistry = await loadRemotesRegistry(backend, registry);
  const nextRegistry = updateRegistryForPublish(
    currentRegistry,
    publishedRemotes,
    version,
  );

  const registryStorageKey = getRemotesRegistryStorageKey(registry);
  let registryUrl = getPublicUrl(registry, registryStorageKey);

  if (!dryRun) {
    registryUrl = await saveRemotesRegistry(backend, registry, nextRegistry);
  }

  return {
    dryRun,
    version,
    remotes: publishedRemotes,
    registryUpdated: !dryRun,
    registryUrl,
  };
}

export function assertRegistryConfigured(cwd: string): void {
  const config = loadFwizConfig(cwd);

  if (!config.registry) {
    throw new FwizConfigError(
      'fwiz.config.yaml is missing a registry section required for publish-manifest.',
    );
  }
}
