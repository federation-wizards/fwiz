import type { Command } from 'commander';

import { initFwizConfig } from '@federation-wizards/core';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description(
      'Generate a central fwiz.config.yaml for Module Federation 2.0',
    )
    .summary('Scaffold fwiz.config.yaml with workspace-aware defaults')
    .addHelpText(
      'after',
      `
Examples:
  $ fwiz init
  $ fwiz init --cwd ./my-monorepo

The command detects Nx, Turborepo, or plain repositories and creates
sensible host, remote, and shared dependency defaults. Running init
again is safe: an existing fwiz.config.yaml is validated but not overwritten.
`,
    )
    .option(
      '--cwd <path>',
      'Directory to initialize (defaults to current working directory)',
      process.cwd(),
    )
    .action((options: { cwd: string }) => {
      const result = initFwizConfig(options.cwd);

      if (result.created) {
        console.log(`Created ${result.configPath}`);
        console.log(
          `Detected ${result.config.workspace.type} workspace with ${result.config.hosts.length} host(s) and ${result.config.remotes.length} remote(s).`,
        );
      } else {
        console.log(`Config already exists at ${result.configPath}`);
      }

      const patchedFiles = result.workspacePatches.filter(
        (patch) => patch.patched,
      );

      for (const patch of patchedFiles) {
        for (const change of patch.changes) {
          console.log(change);
        }
      }

      if (result.created) {
        return;
      }

      if (result.validationWarnings.length > 0) {
        console.warn('Validation warnings:');
        for (const warning of result.validationWarnings) {
          console.warn(`  - ${warning}`);
        }
        process.exitCode = 1;
        return;
      }

      console.log('Existing config is valid.');
    });
}
