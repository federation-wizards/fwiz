import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { generateMfManifest } from '../manifest/generate.js';
import { loadFwizConfig } from '../config/load.js';
import type { RemoteConfig } from '../config/types.js';
import { createRegistryBackend } from '../registry/backends/factory.js';
import type { RegistryBackend } from '../registry/backends/types.js';
import {
  fetchRegistryManifests,
  RegistryClientError,
} from '../registry/client.js';
import { detectBreakingChanges } from './breaking-changes.js';
import { compareManifests } from './manifest-compare.js';
import {
  validateCrossRemoteSharedDependencies,
  validateSharedDependenciesForManifest,
} from './shared-deps.js';
import type {
  ValidateManifestOptions,
  ValidateManifestResult,
  ValidationIssue,
} from './types.js';

export class ValidateManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidateManifestError';
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
    throw new ValidateManifestError(
      `Remote "${remoteName}" is not defined in fwiz.config.yaml.`,
    );
  }

  return selected;
}

function requireRegistryConfig(
  config: ReturnType<typeof loadFwizConfig>,
): NonNullable<ReturnType<typeof loadFwizConfig>['registry']> {
  if (!config.registry) {
    throw new ValidateManifestError(
      'fwiz.config.yaml is missing a registry section. Add registry settings before running validate.',
    );
  }

  return config.registry;
}

function collectIssues(...groups: ValidationIssue[][]): {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
} {
  const issues = groups.flat();

  return {
    errors: issues.filter((issue) => issue.level === 'error'),
    warnings: issues.filter((issue) => issue.level === 'warning'),
  };
}

export async function validateManifests(
  options: ValidateManifestOptions,
  backendOverride?: RegistryBackend,
): Promise<ValidateManifestResult> {
  const config = loadFwizConfig(options.cwd);
  const registry = requireRegistryConfig(config);
  const backend = backendOverride ?? createRegistryBackend(registry);
  const version = resolveVersion(options.cwd, options.version);
  const remotes = selectRemotes(config.remotes, options.remote);

  if (remotes.length === 0) {
    throw new ValidateManifestError(
      'No remotes configured in fwiz.config.yaml.',
    );
  }

  let registryManifests;

  try {
    registryManifests = await fetchRegistryManifests(backend, registry, remotes);
  } catch (error) {
    if (error instanceof RegistryClientError) {
      throw new ValidateManifestError(error.message);
    }

    throw error;
  }

  const localManifests = remotes.map((remote) => ({
    remote: remote.name,
    manifest: generateMfManifest({
      remote,
      version,
      shared: config.shared,
      registry,
    }),
  }));

  const perRemoteIssues = remotes.flatMap((remote) => {
    const registryManifest = registryManifests.manifests.find(
      (entry) => entry.remote === remote.name,
    );

    if (!registryManifest) {
      return [
        {
          level: 'error' as const,
          code: 'missing-registry-manifest',
          message: `Remote "${remote.name}" has no published manifest in the registry.`,
          remote: remote.name,
        },
      ];
    }

    const localManifest = localManifests.find(
      (entry) => entry.remote === remote.name,
    )!.manifest;

    return [
      ...compareManifests(
        localManifest,
        registryManifest.manifest,
        remote.name,
      ),
      ...detectBreakingChanges(
        localManifest,
        registryManifest.manifest,
        remote.name,
      ),
      ...validateSharedDependenciesForManifest(
        config,
        localManifest,
        remote.name,
      ),
    ];
  });

  const crossRemoteIssues = validateCrossRemoteSharedDependencies(
    localManifests,
    config,
  );
  const { errors, warnings } = collectIssues(perRemoteIssues, crossRemoteIssues);

  return {
    version,
    remotes: remotes.map((remote) => remote.name),
    errors,
    warnings,
  };
}

export * from './types.js';
export * from './manifest-compare.js';
export * from './shared-deps.js';
export * from './breaking-changes.js';
