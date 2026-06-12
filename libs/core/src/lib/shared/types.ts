import type { SharedDependencyConfig } from '../config/types.js';
import type { DependencyKind } from '@federation-wizards/utils';

export interface DependencyOccurrence {
  packagePath: string;
  version: string;
  kind: DependencyKind;
}

export interface SharedDependencyAnalysis {
  name: string;
  occurrences: DependencyOccurrence[];
  projectCount: number;
  hasConflict: boolean;
  versions: string[];
  recommended: SharedDependencyConfig;
}

export interface VersionConflict {
  name: string;
  versions: Record<string, string[]>;
  recommendedVersion: string;
  resolution: string;
}

export interface AnalyzeSharedResult {
  scannedPackages: string[];
  sharedDependencies: SharedDependencyAnalysis[];
  conflicts: VersionConflict[];
  recommendedShared: Record<string, SharedDependencyConfig>;
}

export interface ApplySharedFixResult {
  configPath: string;
  changes: string[];
}
