import type { Command } from 'commander';
import { DevError, runDev } from '@federation-wizards/core';
export function registerDevCommand(program: Command): void {
  program.command('dev [host]').description('Start a host and its remotes for local Module Federation development').summary('Run host + remotes in parallel with proxy routing').addHelpText('after', `\nExamples:\n  $ fwiz dev shell\n  $ fwiz dev\n\nCDN/prod manifest fallback and full cross-remote HMR are deferred until issue #6 lands.\n`).option('--cwd <path>', 'Workspace directory', process.cwd()).action(async (host: string | undefined, options: { cwd: string }) => { try { await runDev({ cwd: options.cwd, host }); } catch (error) { console.error(error instanceof DevError || error instanceof Error ? error.message : String(error)); process.exitCode = 1; } });
}
