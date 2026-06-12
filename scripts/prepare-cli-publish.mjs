import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const workspaceRoot = join(import.meta.dirname, '..');
const distDir = join(workspaceRoot, 'apps/cli/dist');
const sourcePkgPath = join(workspaceRoot, 'apps/cli/package.json');
const distPkgPath = join(distDir, 'package.json');

for (const path of ['apps', 'libs', 'workspace_modules']) {
  rmSync(join(distDir, path), { recursive: true, force: true });
}

for (const pattern of ['tsconfig.app.tsbuildinfo', 'pnpm-lock.yaml']) {
  rmSync(join(distDir, pattern), { force: true });
}

const source = JSON.parse(readFileSync(sourcePkgPath, 'utf8'));
const dist = JSON.parse(readFileSync(distPkgPath, 'utf8'));

const publishable = {
  name: source.name,
  version: source.version,
  description: source.description,
  license: source.license,
  repository: source.repository,
  bugs: source.bugs,
  homepage: source.homepage,
  keywords: source.keywords,
  engines: source.engines,
  main: './main.js',
  bin: { fwiz: './main.js' },
  files: ['**/*'],
  dependencies: dist.dependencies ?? {},
  publishConfig: { access: 'public' },
};

writeFileSync(distPkgPath, `${JSON.stringify(publishable, null, 2)}\n`);
