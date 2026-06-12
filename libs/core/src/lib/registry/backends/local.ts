import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { RegistryBackend } from './types.js';

export function createLocalRegistryBackend(rootDir: string): RegistryBackend {
  return {
    async get(key: string): Promise<string | null> {
      const filePath = join(rootDir, key);

      if (!existsSync(filePath)) {
        return null;
      }

      return readFileSync(filePath, 'utf8');
    },

    async put(key: string, body: string): Promise<void> {
      const filePath = join(rootDir, key);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, body, 'utf8');
    },
  };
}
