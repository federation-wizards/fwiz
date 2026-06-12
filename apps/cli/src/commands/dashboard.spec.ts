import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { stringify as stringifyYaml } from 'yaml';

import {
  registerDashboardCommand,
  resolveDashboardRoot,
  startDashboardServer,
} from './dashboard.js';

jest.mock('node:child_process', () => ({
  spawn: jest.fn(() => ({
    on: jest.fn(),
  })),
}));

describe('fwiz dashboard command', () => {
  it('resolveDashboardRoot finds the dashboard app in the monorepo', () => {
    expect(resolveDashboardRoot()).toContain('apps/dashboard');
  });

  it('startDashboardServer spawns vite with config env', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fwiz-dashboard-cli-'));
    writeFileSync(
      join(dir, 'fwiz.config.yaml'),
      `${stringifyYaml({
        version: '1',
        workspace: { type: 'plain' },
        hosts: [{ name: 'shell', port: 4200 }],
        remotes: [{ name: 'checkout', port: 4201 }],
        shared: {
          react: {
            singleton: true,
            requiredVersion: '^19.0.0',
            eager: false,
          },
        },
      })}\n`,
    );

    startDashboardServer({
      cwd: dir,
      port: 5000,
      dashboardRoot: resolveDashboardRoot(),
    });

    expect(spawn).toHaveBeenCalledWith(
      'pnpm',
      expect.arrayContaining(['exec', 'vite', '--port', '5000']),
      expect.objectContaining({
        env: expect.objectContaining({
          FWIZ_CONFIG_JSON: expect.stringContaining('"shell"'),
          FWIZ_DASHBOARD_URL: 'http://localhost:5000',
        }),
      }),
    );
  });

  it('registerDashboardCommand adds dashboard subcommand', () => {
    const commands: Array<{ name: () => string }> = [];
    const program = {
      command: jest.fn(() => {
        const command = {
          description: jest.fn().mockReturnThis(),
          summary: jest.fn().mockReturnThis(),
          addHelpText: jest.fn().mockReturnThis(),
          option: jest.fn().mockReturnThis(),
          action: jest.fn().mockReturnThis(),
          name: () => 'dashboard',
        };
        commands.push(command);
        return command;
      }),
    };

    registerDashboardCommand(program as never);

    expect(program.command).toHaveBeenCalledWith('dashboard');
    expect(commands[0]?.name()).toBe('dashboard');
  });
});
