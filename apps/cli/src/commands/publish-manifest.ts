import type { Command } from 'commander';

import {
  PublishManifestError,
  publishManifest,
  rollbackManifest,
} from '@federation-wizards/core';

export function registerPublishManifestCommand(program: Command): void {
  program
    .command('publish-manifest')
    .description(
      'Generate versioned mf-manifest.json files and publish them to a central registry',
    )
    .summary('Upload remote manifests and update remotes-registry.json')
    .addHelpText(
      'after',
      `
Examples:
  $ fwiz publish-manifest
  $ fwiz publish-manifest --version 1.2.0
  $ fwiz publish-manifest --remote checkout
  $ fwiz publish-manifest --dry-run
  $ fwiz publish-manifest --rollback --remote checkout
  $ fwiz publish-manifest --rollback --remote checkout --version 1.1.0

Requires a registry section in fwiz.config.yaml with either an HTTP PUT
endpoint or S3-compatible storage settings.
`,
    )
    .option(
      '--cwd <path>',
      'Workspace directory (defaults to current working directory)',
      process.cwd(),
    )
    .option('--dry-run', 'Generate manifests without uploading or updating registry')
    .option('--version <version>', 'Manifest version to publish or roll back to')
    .option('--remote <name>', 'Publish or roll back a single remote')
    .option('--rollback', 'Roll back the selected remote to a previous version')
    .action(
      async (options: {
        cwd: string;
        dryRun?: boolean;
        version?: string;
        remote?: string;
        rollback?: boolean;
      }) => {
        try {
          if (options.rollback) {
            if (!options.remote) {
              console.error('--remote is required when using --rollback.');
              process.exitCode = 1;
              return;
            }

            const result = await rollbackManifest({
              cwd: options.cwd,
              remote: options.remote,
              version: options.version,
              dryRun: options.dryRun,
            });

            if (result.dryRun) {
              console.log(
                `[dry-run] Would roll back ${result.remote} from ${result.currentVersion} to ${result.previousVersion}.`,
              );
              return;
            }

            console.log(
              `Rolled back ${result.remote} from ${result.currentVersion} to ${result.previousVersion}.`,
            );
            console.log(`Registry: ${result.registryUrl}`);
            return;
          }

          const result = await publishManifest({
            cwd: options.cwd,
            version: options.version,
            remote: options.remote,
            dryRun: options.dryRun,
          });

          if (result.dryRun) {
            console.log(
              `[dry-run] Would publish version ${result.version} for ${result.remotes.length} remote(s).`,
            );
          } else {
            console.log(
              `Published version ${result.version} for ${result.remotes.length} remote(s).`,
            );
          }

          for (const remote of result.remotes) {
            console.log(`  - ${remote.name}: ${remote.manifestUrl}`);
          }

          console.log(`Registry: ${result.registryUrl}`);
        } catch (error) {
          const message =
            error instanceof PublishManifestError ||
            error instanceof Error
              ? error.message
              : String(error);
          console.error(message);
          process.exitCode = 1;
        }
      },
    );
}
