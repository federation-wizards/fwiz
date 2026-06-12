export type ValidationLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: ValidationLevel;
  code: string;
  message: string;
  remote?: string;
}

export interface ValidateManifestOptions {
  cwd: string;
  version?: string;
  remote?: string;
}

export interface ValidateManifestResult {
  version: string;
  remotes: string[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}
