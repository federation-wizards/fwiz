import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { WorkspaceInfo, WorkspaceType } from '../config/types.js';

function detectWorkspaceType(cwd: string): WorkspaceType {
  if (existsSync(join(cwd, 'nx.json'))) {
    return 'nx';
  }

  if (existsSync(join(cwd, 'turbo.json'))) {
    return 'turbo';
  }

  return 'plain';
}

function readNxAppsDir(cwd: string): string {
  const nxJsonPath = join(cwd, 'nx.json');

  if (!existsSync(nxJsonPath)) {
    return 'apps';
  }

  try {
    const nxJson = JSON.parse(readFileSync(nxJsonPath, 'utf8')) as {
      workspaceLayout?: { appsDir?: string };
    };

    return nxJson.workspaceLayout?.appsDir ?? 'apps';
  } catch {
    return 'apps';
  }
}

function isNxAppProject(appDir: string): boolean {
  const projectJsonPath = join(appDir, 'project.json');

  if (existsSync(projectJsonPath)) {
    return true;
  }

  const packageJsonPath = join(appDir, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      nx?: unknown;
    };

    return packageJson.nx !== undefined;
  } catch {
    return false;
  }
}

function listAppProjects(cwd: string, workspaceType: WorkspaceType): string[] {
  const appsDirName =
    workspaceType === 'nx' ? readNxAppsDir(cwd) : 'apps';
  const appsDir = join(cwd, appsDirName);

  if (!existsSync(appsDir)) {
    return [];
  }

  const entries = readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (workspaceType === 'nx') {
    return entries
      .filter((name) => isNxAppProject(join(appsDir, name)))
      .sort();
  }

  return entries.sort();
}

function readReactVersion(cwd: string): string | undefined {
  const packageJsonPath = join(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return undefined;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    return (
      packageJson.dependencies?.['react'] ??
      packageJson.devDependencies?.['react']
    );
  } catch {
    return undefined;
  }
}

export function detectWorkspace(cwd: string): WorkspaceInfo {
  const type = detectWorkspaceType(cwd);
  const appProjects = listAppProjects(cwd, type);
  const reactVersion = readReactVersion(cwd);

  return {
    type,
    appProjects,
    reactVersion,
  };
}
