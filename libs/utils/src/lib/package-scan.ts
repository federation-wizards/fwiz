import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export type DependencyKind =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies';

export interface PackageManifest {
  path: string;
  name?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
}

export interface WorkspaceLayout {
  appsDir: string;
  libsDir: string;
}

function readNxWorkspaceLayout(cwd: string): WorkspaceLayout {
  const nxJsonPath = join(cwd, 'nx.json');
  const defaults: WorkspaceLayout = { appsDir: 'apps', libsDir: 'libs' };

  if (!existsSync(nxJsonPath)) {
    return defaults;
  }

  try {
    const nxJson = JSON.parse(readFileSync(nxJsonPath, 'utf8')) as {
      workspaceLayout?: { appsDir?: string; libsDir?: string };
    };

    return {
      appsDir: nxJson.workspaceLayout?.appsDir ?? defaults.appsDir,
      libsDir: nxJson.workspaceLayout?.libsDir ?? defaults.libsDir,
    };
  } catch {
    return defaults;
  }
}

function listPackageJsonInDir(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(dir, entry.name, 'package.json'))
    .filter((packageJsonPath) => existsSync(packageJsonPath));
}

export function discoverPackageJsonPaths(cwd: string): string[] {
  const paths: string[] = [];
  const rootPackageJson = join(cwd, 'package.json');

  if (existsSync(rootPackageJson)) {
    paths.push(relative(cwd, rootPackageJson));
  }

  const layout = readNxWorkspaceLayout(cwd);

  for (const packageJsonPath of [
    ...listPackageJsonInDir(join(cwd, layout.appsDir)),
    ...listPackageJsonInDir(join(cwd, layout.libsDir)),
  ]) {
    paths.push(relative(cwd, packageJsonPath));
  }

  return paths.sort();
}

function readDependencySection(
  packageJson: Record<string, unknown>,
  key: DependencyKind,
): Record<string, string> {
  const section = packageJson[key];

  if (!section || typeof section !== 'object') {
    return {};
  }

  const result: Record<string, string> = {};

  for (const [name, version] of Object.entries(section)) {
    if (typeof version === 'string') {
      result[name] = version;
    }
  }

  return result;
}

export function parsePackageJson(
  cwd: string,
  filePath: string,
): PackageManifest {
  const raw = readFileSync(filePath, 'utf8');
  const packageJson = JSON.parse(raw) as Record<string, unknown>;

  return {
    path: relative(cwd, filePath),
    name: typeof packageJson.name === 'string' ? packageJson.name : undefined,
    dependencies: readDependencySection(packageJson, 'dependencies'),
    devDependencies: readDependencySection(packageJson, 'devDependencies'),
    peerDependencies: readDependencySection(packageJson, 'peerDependencies'),
  };
}

export function scanWorkspacePackages(cwd: string): PackageManifest[] {
  return discoverPackageJsonPaths(cwd).map((relativePath) =>
    parsePackageJson(cwd, join(cwd, relativePath)),
  );
}
