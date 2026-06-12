import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { FWIZ_CONFIG_FILENAME } from '../config/init.js';
import type { FwizConfig } from '../config/types.js';
import type { WorkspacePatchResult } from '../config/types.js';

function buildFwizSection(config: FwizConfig) {
  return {
    config: FWIZ_CONFIG_FILENAME,
    hosts: config.hosts.map((host) => ({
      name: host.name,
      ...(host.project ? { project: host.project } : {}),
      port: host.port,
    })),
    remotes: config.remotes.map((remote) => ({
      name: remote.name,
      ...(remote.project ? { project: remote.project } : {}),
      port: remote.port,
    })),
  };
}

export function patchNxJson(
  cwd: string,
  config: FwizConfig,
): WorkspacePatchResult {
  const filePath = join(cwd, 'nx.json');

  if (!existsSync(filePath)) {
    return { patched: false, filePath, changes: [] };
  }

  let nxJson: Record<string, unknown>;

  try {
    nxJson = JSON.parse(readFileSync(filePath, 'utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    return {
      patched: false,
      filePath,
      changes: [`Skipped ${filePath}: invalid JSON`],
    };
  }

  const fwizSection = buildFwizSection(config);
  const existing = nxJson.fwiz;

  if (JSON.stringify(existing) === JSON.stringify(fwizSection)) {
    return { patched: false, filePath, changes: [] };
  }

  nxJson.fwiz = fwizSection;
  writeFileSync(filePath, `${JSON.stringify(nxJson, null, 2)}\n`, 'utf8');

  return {
    patched: true,
    filePath,
    changes: ['Updated nx.json fwiz project references'],
  };
}
