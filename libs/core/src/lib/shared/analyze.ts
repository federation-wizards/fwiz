import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { scanWorkspacePackages } from '@federation-wizards/utils';
import type { PackageManifest } from '@federation-wizards/utils';
import { stringify as stringifyYaml } from 'yaml';

import { FWIZ_CONFIG_FILENAME } from '../config/init.js';
import { loadFwizConfig } from '../config/load.js';
import { validateFwizConfig } from '../config/schema.js';
import type { FwizConfig, SharedDependencyConfig } from '../config/types.js';
import {
  buildSharedRecommendation,
  shouldShareDependency,
} from './recommend.js';
import type {
  AnalyzeSharedResult,
  ApplySharedFixResult,
  DependencyOccurrence,
  SharedDependencyAnalysis,
  VersionConflict,
} from './types.js';

function collectDependencyOccurrences(
  manifests: PackageManifest[],
): Map<string, DependencyOccurrence[]> {
  const occurrences = new Map<string, DependencyOccurrence[]>();

  for (const manifest of manifests) {
    const sections = [
      ['dependencies', manifest.dependencies] as const,
      ['devDependencies', manifest.devDependencies] as const,
      ['peerDependencies', manifest.peerDependencies] as const,
    ];

    for (const [kind, dependencies] of sections) {
      for (const [name, version] of Object.entries(dependencies)) {
        if (!shouldShareDependency(name)) {
          continue;
        }

        const existing = occurrences.get(name) ?? [];
        existing.push({
          packagePath: manifest.path,
          version,
          kind,
        });
        occurrences.set(name, existing);
      }
    }
  }

  return occurrences;
}

function uniquePackagePaths(occurrences: DependencyOccurrence[]): string[] {
  return [...new Set(occurrences.map((occurrence) => occurrence.packagePath))];
}

function uniqueVersions(occurrences: DependencyOccurrence[]): string[] {
  return [...new Set(occurrences.map((occurrence) => occurrence.version))].sort();
}

function buildVersionConflict(
  name: string,
  occurrences: DependencyOccurrence[],
  manifests: PackageManifest[],
): VersionConflict {
  const versions: Record<string, string[]> = {};

  for (const occurrence of occurrences) {
    const paths = versions[occurrence.version] ?? [];
    paths.push(occurrence.packagePath);
    versions[occurrence.version] = paths;
  }

  const recommendedVersion = buildSharedRecommendation(
    name,
    uniqueVersions(occurrences),
    manifests,
  ).requiredVersion;

  return {
    name,
    versions,
    recommendedVersion,
    resolution: `Align all projects to ${recommendedVersion}`,
  };
}

function buildSharedDependencyAnalysis(
  name: string,
  occurrences: DependencyOccurrence[],
  manifests: PackageManifest[],
): SharedDependencyAnalysis {
  const versions = uniqueVersions(occurrences);

  return {
    name,
    occurrences,
    projectCount: uniquePackagePaths(occurrences).length,
    hasConflict: versions.length > 1,
    versions,
    recommended: buildSharedRecommendation(name, versions, manifests),
  };
}

export function analyzeSharedDependencies(cwd: string): AnalyzeSharedResult {
  const manifests = scanWorkspacePackages(cwd);
  const occurrencesByName = collectDependencyOccurrences(manifests);
  const sharedDependencies: SharedDependencyAnalysis[] = [];
  const conflicts: VersionConflict[] = [];
  const recommendedShared: Record<string, SharedDependencyConfig> = {};

  for (const [name, occurrences] of [...occurrencesByName.entries()].sort()) {
    const packagePaths = uniquePackagePaths(occurrences);

    if (packagePaths.length < 2) {
      continue;
    }

    const analysis = buildSharedDependencyAnalysis(name, occurrences, manifests);
    sharedDependencies.push(analysis);
    recommendedShared[name] = analysis.recommended;

    if (analysis.hasConflict) {
      conflicts.push(buildVersionConflict(name, occurrences, manifests));
    }
  }

  return {
    scannedPackages: manifests.map((manifest) => manifest.path),
    sharedDependencies,
    conflicts,
    recommendedShared,
  };
}

function serializeConfig(config: FwizConfig): string {
  return stringifyYaml(config, {
    indent: 2,
    lineWidth: 0,
  });
}

export function applySharedRecommendations(
  cwd: string,
  recommendations: Record<string, SharedDependencyConfig>,
): ApplySharedFixResult {
  const configPath = join(cwd, FWIZ_CONFIG_FILENAME);
  const config = loadFwizConfig(cwd);
  const changes: string[] = [];

  for (const [name, recommendation] of Object.entries(recommendations).sort()) {
    const existing = config.shared[name];

    if (!existing) {
      config.shared[name] = recommendation;
      changes.push(`Added shared dependency ${name}`);
      continue;
    }

    if (existing.singleton !== recommendation.singleton) {
      existing.singleton = recommendation.singleton;
      changes.push(`Updated ${name}.singleton to ${recommendation.singleton}`);
    }

    if (existing.eager !== recommendation.eager) {
      existing.eager = recommendation.eager;
      changes.push(`Updated ${name}.eager to ${recommendation.eager}`);
    }

    if (existing.requiredVersion !== recommendation.requiredVersion) {
      existing.requiredVersion = recommendation.requiredVersion;
      changes.push(
        `Updated ${name}.requiredVersion to ${recommendation.requiredVersion}`,
      );
    }
  }

  const validation = validateFwizConfig(config);

  if (!validation.valid) {
    throw new Error(
      `Updated config failed validation: ${validation.warnings.join('; ')}`,
    );
  }

  writeFileSync(configPath, `${serializeConfig(config)}\n`, 'utf8');

  return {
    configPath,
    changes,
  };
}

export function formatSharedAnalysisTable(result: AnalyzeSharedResult): string {
  if (result.sharedDependencies.length === 0) {
    return 'No common shared dependencies found across workspace packages.';
  }

  const headers = [
    'Package',
    'Projects',
    'Versions',
    'Singleton',
    'Eager',
    'Required Version',
  ];

  const rows = result.sharedDependencies.map((dependency) => [
    dependency.name,
    String(dependency.projectCount),
    dependency.hasConflict
      ? `${dependency.versions.join(', ')} (conflict)`
      : dependency.versions.join(', '),
    String(dependency.recommended.singleton),
    String(dependency.recommended.eager),
    dependency.recommended.requiredVersion,
  ]);

  const widths = headers.map((header, index) =>
    Math.max(
      header.length,
      ...rows.map((row) => row[index]?.length ?? 0),
    ),
  );

  const formatRow = (cells: string[]) =>
    cells.map((cell, index) => cell.padEnd(widths[index] ?? 0)).join('  ');

  const lines = [
    formatRow(headers),
    widths.map((width) => '-'.repeat(width)).join('  '),
    ...rows.map((row) => formatRow(row)),
  ];

  if (result.conflicts.length > 0) {
    lines.push('');
    lines.push('Version conflicts:');

    for (const conflict of result.conflicts) {
      lines.push(`  ${conflict.name}: ${conflict.resolution}`);
    }
  }

  return lines.join('\n');
}
