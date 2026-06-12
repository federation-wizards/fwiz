import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { FwizConfigError, loadFwizConfig } from '@federation-wizards/core';
import type { Command } from 'commander';

export function resolveDashboardRoot(): string {
  const cliDir = __dirname;

  for (const candidate of [
    join(cliDir, '../../../dashboard'),
    join(cliDir, '../../dashboard'),
    join(process.cwd(), 'apps/dashboard'),
  ]) {
    if (existsSync(join(candidate, 'vite.config.mts'))) {
      return candidate;
    }
  }

  throw new Error(
    'Dashboard app not found. Reinstall @federation-wizards/fwiz or run from the fwiz monorepo.',
  );
}

export function startDashboardServer(options: {
  cwd: string;
  port?: number;
  open?: boolean;
  dashboardRoot?: string;
}): ChildProcess {
  const port = options.port ?? 5000;
  const config = loadFwizConfig(options.cwd);
  const dashboardRoot = options.dashboardRoot ?? resolveDashboardRoot();
  const dashboardUrl = `http://localhost:${port}`;

  const child = spawn(
    'pnpm',
    [
      'exec',
      'vite',
      '--config',
      join(dashboardRoot, 'vite.config.mts'),
      '--port',
      String(port),
      '--host',
      'localhost',
      ...(options.open ? ['--open'] : []),
    ],
    {
      cwd: join(dashboardRoot, '../..'),
      env: {
        ...process.env,
        FWIZ_CONFIG_JSON: JSON.stringify(config),
        FWIZ_CWD: options.cwd,
        FWIZ_DASHBOARD_PORT: String(port),
        FWIZ_DASHBOARD_URL: dashboardUrl,
      },
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );

  child.on('error', (error) => {
    console.error(`Failed to start dashboard: ${error.message}`);
    process.exitCode = 1;
  });

  console.log(`Starting fwiz dashboard at ${dashboardUrl}`);
  console.log(
    `Loaded ${config.hosts.length} host(s), ${config.remotes.length} remote(s), and ${Object.keys(config.shared).length} shared dependency group(s).`,
  );
  console.log(
    'Add createRuntimeInspectorPlugin() from @federation-wizards/mf-plugins to your host federation runtime plugins for live data.',
  );

  return child;
}

export function registerDashboardCommand(program: Command): void {
  program
    .command('dashboard')
    .description(
      'Launch a local federation graph dashboard with live runtime insights',
    )
    .summary('Start the Vite + React dashboard on port 5000')
    .addHelpText(
      'after',
      `
Examples:
  $ fwiz dashboard
  $ fwiz dashboard --cwd ./my-monorepo
  $ fwiz dashboard --port 5000 --open

Reads fwiz.config.yaml from the workspace and serves a react-flow graph of
hosts, remotes, and shared dependencies. Live runtime data is collected when
your host app registers the fwiz runtime inspector plugin.
`,
    )
    .option(
      '--cwd <path>',
      'Workspace directory (defaults to current working directory)',
      process.cwd(),
    )
    .option('--port <number>', 'Dashboard port', '5000')
    .option('--open', 'Open the dashboard in the default browser', false)
    .action((options: { cwd: string; port: string; open?: boolean }) => {
      const port = Number.parseInt(options.port, 10);

      if (Number.isNaN(port)) {
        console.error('Invalid port value.');
        process.exitCode = 1;
        return;
      }

      try {
        const child = startDashboardServer({
          cwd: options.cwd,
          port,
          open: options.open,
        });

        child.on('exit', (code) => {
          process.exitCode = code ?? 0;
        });
      } catch (error) {
        const message =
          error instanceof FwizConfigError || error instanceof Error
            ? error.message
            : String(error);
        console.error(message);
        process.exitCode = 1;
      }
    });
}
