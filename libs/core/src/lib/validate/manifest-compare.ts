import type { MfManifest } from '../registry/types.js';
import type { ValidationIssue } from './types.js';

export function compareManifests(
  local: MfManifest,
  registry: MfManifest,
  remoteName: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const registryExposeNames = new Set(
    registry.exposes.map((expose) => expose.name),
  );

  for (const localShared of local.shared) {
    const registryShared = registry.shared.find(
      (shared) => shared.name === localShared.name,
    );

    if (!registryShared) {
      issues.push({
        level: 'warning',
        code: 'new-shared-dependency',
        message: `Remote "${remoteName}" adds shared dependency "${localShared.name}" not present in the registry manifest.`,
        remote: remoteName,
      });
      continue;
    }

    if (localShared.requiredVersion !== registryShared.requiredVersion) {
      issues.push({
        level: 'warning',
        code: 'shared-required-version-drift',
        message: `Remote "${remoteName}" shared dependency "${localShared.name}" requiredVersion changed from "${registryShared.requiredVersion}" to "${localShared.requiredVersion}".`,
        remote: remoteName,
      });
    }
  }

  for (const registryShared of registry.shared) {
    const localShared = local.shared.find(
      (shared) => shared.name === registryShared.name,
    );

    if (!localShared) {
      issues.push({
        level: 'error',
        code: 'removed-shared-dependency',
        message: `Remote "${remoteName}" removed shared dependency "${registryShared.name}" from the registry manifest.`,
        remote: remoteName,
      });
    }
  }

  for (const expose of local.exposes) {
    if (!registryExposeNames.has(expose.name)) {
      issues.push({
        level: 'warning',
        code: 'new-expose',
        message: `Remote "${remoteName}" adds new expose "${expose.name}".`,
        remote: remoteName,
      });
    }
  }

  return issues;
}
