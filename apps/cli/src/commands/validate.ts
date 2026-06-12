import type { Command } from 'commander';

import {
  ValidateManifestError,
  validateManifests,
  type ValidateManifestResult,
} from '@federation-wizards/core';

export function resolveValidateExitCode(
  result: ValidateManifestResult,
  ci: boolean,
): number {
  if (result.errors.length > 0) {
    return 1;
  }

  if (ci && result.warnings.length > 0) {
    return 2;
  }

  return 0;
}

export function registerValidateCommand(program: Command): void {
  program
    .command('validate')
    .description(
      'Validate local manifests against the registry before deployment',
    )
    .summary('Compare manifests, shared deps, and breaking changes')
    .addHelpText(
      'after',
      `
Examples:
  $ fwiz validate
  $ fwiz validate --version 2.0.0
  $ fwiz validate --remote checkout
  $ fwiz validate --ci

Compares locally generated manifests with the current registry versions,
validates shared dependency rules from fwiz.config.yaml, and reports
breaking changes such as major version bumps or removed exposes.

Exit codes:
  0  validation passed
  1  validation errors
  2  validation warnings (with --ci only)
`,
    )
    .option(
      '--cwd <path>',
      'Workspace directory (defaults to current working directory)',
      process.cwd(),
    )
    .option('--version <version>', 'Manifest version to validate')
    .option('--remote <name>', 'Validate a single remote')
    .option(
      '--ci',
      'Use CI exit codes (warnings exit with code 2 instead of 0)',
    )
    .action(
      async (options: {
        cwd: string;
        version?: string;
        remote?: string;
        ci?: boolean;
      }) => {
        try {
          const result = await validateManifests({
            cwd: options.cwd,
            version: options.version,
            remote: options.remote,
          });

          if (result.errors.length === 0 && result.warnings.length === 0) {
            console.log(
              `Validation passed for version ${result.version} (${result.remotes.join(', ')}).`,
            );
          } else {
            if (result.errors.length > 0) {
              console.error('Validation errors:');
              for (const issue of result.errors) {
                console.error(`  - ${issue.message}`);
              }
            }

            if (result.warnings.length > 0) {
              console.warn('Validation warnings:');
              for (const issue of result.warnings) {
                console.warn(`  - ${issue.message}`);
              }
            }
          }

          process.exitCode = resolveValidateExitCode(result, options.ci ?? false);
        } catch (error) {
          const message =
            error instanceof ValidateManifestError || error instanceof Error
              ? error.message
              : String(error);
          console.error(message);
          process.exitCode = 1;
        }
      },
    );
}
