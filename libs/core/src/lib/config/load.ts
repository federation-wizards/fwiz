import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parse as parseYaml } from 'yaml';

import { FWIZ_CONFIG_FILENAME } from './init.js';
import { validateFwizConfig } from './schema.js';
import type { FwizConfig } from './types.js';

export class FwizConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FwizConfigError';
  }
}

export function loadFwizConfig(cwd: string): FwizConfig {
  const configPath = join(cwd, FWIZ_CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    throw new FwizConfigError(
      `Config not found at ${configPath}. Run fwiz init first.`,
    );
  }

  let parsed: unknown;

  try {
    parsed = parseYaml(readFileSync(configPath, 'utf8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new FwizConfigError(`Failed to parse ${configPath}: ${message}`);
  }

  const validation = validateFwizConfig(parsed);

  if (!validation.valid) {
    throw new FwizConfigError(
      `Invalid config at ${configPath}: ${validation.warnings.join('; ')}`,
    );
  }

  return validation.value;
}
