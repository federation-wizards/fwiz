import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { stringify as stringifyYaml, parse as parseYaml } from 'yaml';

import { createDefaultConfig } from './defaults.js';
import { validateFwizConfig } from './schema.js';
import type { FwizConfig, InitResult } from './types.js';
import { detectWorkspace } from '../workspace/detect.js';
import { patchWorkspaceConfig } from '../workspace/patch.js';

export const FWIZ_CONFIG_FILENAME = 'fwiz.config.yaml';

function parseExistingConfig(configPath: string): unknown {
  const raw = readFileSync(configPath, 'utf8');
  return parseYaml(raw);
}

function serializeConfig(config: FwizConfig): string {
  return stringifyYaml(config, {
    indent: 2,
    lineWidth: 0,
  });
}

export function initFwizConfig(cwd: string): InitResult {
  const configPath = join(cwd, FWIZ_CONFIG_FILENAME);
  const workspace = detectWorkspace(cwd);

  if (existsSync(configPath)) {
    const existingConfig = parseExistingConfig(configPath);
    const validation = validateFwizConfig(existingConfig);
    const config = validation.valid
      ? validation.value
      : createDefaultConfig(workspace);

    return {
      created: false,
      configPath,
      config,
      validationWarnings: validation.valid ? [] : validation.warnings,
      workspacePatches: validation.valid
        ? patchWorkspaceConfig(cwd, config)
        : [],
    };
  }

  const config = createDefaultConfig(workspace);
  const validation = validateFwizConfig(config);

  if (!validation.valid) {
    throw new Error(
      `Generated config failed validation: ${validation.warnings.join('; ')}`,
    );
  }

  writeFileSync(configPath, `${serializeConfig(config)}\n`, 'utf8');

  return {
    created: true,
    configPath,
    config,
    validationWarnings: [],
    workspacePatches: patchWorkspaceConfig(cwd, config),
  };
}
