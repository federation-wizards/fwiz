import type { FwizConfig } from '../config/types.js';
import { patchNxJson } from './patch-nx.js';
import { patchTurboJson } from './patch-turbo.js';
import type { WorkspacePatchResult } from '../config/types.js';

export function patchWorkspaceConfig(
  cwd: string,
  config: FwizConfig,
): WorkspacePatchResult[] {
  const patches: WorkspacePatchResult[] = [];

  if (config.workspace.type === 'nx') {
    patches.push(patchNxJson(cwd, config));
  }

  if (config.workspace.type === 'turbo' || config.workspace.type === 'nx') {
    patches.push(patchTurboJson(cwd, config));
  }

  return patches;
}
