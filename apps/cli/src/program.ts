import { Command } from 'commander';

import { registerInitCommand } from './commands/init.js';
import { registerPublishManifestCommand } from './commands/publish-manifest.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('fwiz')
    .description('Federation Wizards CLI for Module Federation workflows')
    .version('0.0.1');

  registerInitCommand(program);
  registerPublishManifestCommand(program);

  return program;
}
