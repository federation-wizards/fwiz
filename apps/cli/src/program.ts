import { Command } from 'commander';

import { registerDashboardCommand } from './commands/dashboard.js';
import { registerInitCommand } from './commands/init.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('fwiz')
    .description('Federation Wizards CLI for Module Federation workflows')
    .version('0.0.1');

  registerInitCommand(program);
  registerDashboardCommand(program);

  return program;
}
