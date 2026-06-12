import { loadFwizConfig } from '../config/load.js';
import { createRegistryBackend } from './backends/factory.js';
import type { RegistryBackend } from './backends/types.js';
import { getPublicUrl, getRemotesRegistryStorageKey } from './paths.js';
import { PublishManifestError } from './publish.js';
import { loadRemotesRegistry, saveRemotesRegistry } from './registry-io.js';
import type {
  RollbackManifestOptions,
  RollbackManifestResult,
} from './types.js';

function sortedPublishedVersions(
  versions: Record<string, { publishedAt: string }>,
): string[] {
  return Object.entries(versions)
    .sort((left, right) =>
      right[1].publishedAt.localeCompare(left[1].publishedAt),
    )
    .map(([version]) => version);
}

function resolveRollbackTarget(
  currentVersion: string,
  versions: Record<string, { publishedAt: string }>,
  explicitVersion?: string,
): string {
  if (explicitVersion) {
    if (!versions[explicitVersion]) {
      throw new PublishManifestError(
        `Version "${explicitVersion}" is not published for this remote.`,
      );
    }

    return explicitVersion;
  }

  const ordered = sortedPublishedVersions(versions).filter(
    (version) => version !== currentVersion,
  );

  if (ordered.length === 0) {
    throw new PublishManifestError(
      'No previous version is available to roll back to.',
    );
  }

  return ordered[0];
}

export async function rollbackManifest(
  options: RollbackManifestOptions,
  backendOverride?: RegistryBackend,
): Promise<RollbackManifestResult> {
  const config = loadFwizConfig(options.cwd);

  if (!config.registry) {
    throw new PublishManifestError(
      'fwiz.config.yaml is missing a registry section required for rollback.',
    );
  }

  const registry = config.registry;
  const backend = backendOverride ?? createRegistryBackend(registry);
  const dryRun = options.dryRun ?? false;
  const remotesRegistry = await loadRemotesRegistry(backend, registry);
  const remoteEntry = remotesRegistry.remotes[options.remote];

  if (!remoteEntry) {
    throw new PublishManifestError(
      `Remote "${options.remote}" has no published versions in the registry.`,
    );
  }

  const previousVersion = resolveRollbackTarget(
    remoteEntry.current,
    remoteEntry.versions,
    options.version,
  );
  const currentVersion = remoteEntry.current;

  if (!dryRun) {
    const nextRegistry = structuredClone(remotesRegistry);
    nextRegistry.remotes[options.remote] = {
      ...remoteEntry,
      current: previousVersion,
    };
    await saveRemotesRegistry(backend, registry, nextRegistry);
  }

  return {
    dryRun,
    remote: options.remote,
    previousVersion,
    currentVersion,
    rolledBack: !dryRun,
    registryUrl: getPublicUrl(registry, getRemotesRegistryStorageKey(registry)),
  };
}
