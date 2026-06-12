import type { RegistryConfig } from '../../config/types.js';
import { createHttpRegistryBackend } from './http.js';
import { createS3RegistryBackend } from './s3.js';
import type { RegistryBackend } from './types.js';

export function createRegistryBackend(
  registry: RegistryConfig,
): RegistryBackend {
  switch (registry.type) {
    case 'http':
      return createHttpRegistryBackend(registry);
    case 's3':
      return createS3RegistryBackend(registry);
    default: {
      const exhaustive: never = registry.type;
      throw new Error(`Unsupported registry type: ${exhaustive}`);
    }
  }
}
