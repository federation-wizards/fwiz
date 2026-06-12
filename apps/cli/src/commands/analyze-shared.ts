import type { Command } from 'commander';

import {
  analyzeSharedDependencies,
  applySharedRecommendations,
  formatSharedAnalysisTable,
} from '@federation-wizards/core';

export function registerAnalyzeSharedCommand(program: Command): void {
  program
    .command('analyze-shared')
    .description(
      'Analyze workspace dependencies and recommend Module Federation shared config',
    )
    .summary('Scan package.json files and suggest shared dependency settings')
    .addHelpText(
      'after',
      `
Examples:
  $ fwiz analyze-shared
  $ fwiz analyze-shared --json
  $ fwiz analyze-shared --fix
  $ fwiz analyze-shared --cwd ./my-monorepo

The command scans root, apps/*, and libs/* package.json files, detects
version conflicts, and recommends singleton/eager settings for shared deps.
Use --fix to apply recommendations to fwiz.config.yaml.
`,
    )
    .option(
      '--cwd <path>',
      'Workspace directory to analyze (defaults to current working directory)',
      process.cwd(),
    )
    .option('--json', 'Output analysis as JSON')
    .option('--fix', 'Apply recommended shared settings to fwiz.config.yaml')
    .action((options: { cwd: string; json?: boolean; fix?: boolean }) => {
      const result = analyzeSharedDependencies(options.cwd);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatSharedAnalysisTable(result));
        console.log('');
        console.log(
          `Scanned ${result.scannedPackages.length} package.json file(s).`,
        );
      }

      if (options.fix) {
        if (Object.keys(result.recommendedShared).length === 0) {
          console.warn('No shared dependency recommendations to apply.');
          return;
        }

        const fixResult = applySharedRecommendations(
          options.cwd,
          result.recommendedShared,
        );

        if (fixResult.changes.length === 0) {
          console.log(`No changes needed in ${fixResult.configPath}`);
          return;
        }

        console.log(`Updated ${fixResult.configPath}`);
        for (const change of fixResult.changes) {
          console.log(`  - ${change}`);
        }
      }
    });
}
