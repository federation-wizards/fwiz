import { Command } from 'commander';

import { registerAnalyzeSharedCommand } from './commands/analyze-shared.js';
import { registerInitCommand } from './commands/init.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('fwiz')
    .description('Federation Wizards CLI for Module Federation workflows')
    .version('0.0.1');

  registerInitCommand(program);
  registerAnalyzeSharedCommand(program);

  return program;
}
