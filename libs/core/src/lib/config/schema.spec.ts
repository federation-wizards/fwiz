import { describe, expect, it } from 'vitest';

import { createDefaultConfig } from './defaults.js';
import { validateFwizConfig } from './schema.js';

describe('validateFwizConfig registry section', () => {
  it('accepts an HTTP registry configuration', () => {
    const config = {
      ...createDefaultConfig({ type: 'plain', appProjects: [] }),
      registry: {
        type: 'http',
        baseUrl: 'https://cdn.example.com/mf',
        prefix: 'assets',
      },
    };

    const result = validateFwizConfig(config);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.registry?.type).toBe('http');
    }
  });

  it('requires bucket for S3 registry configuration', () => {
    const config = {
      ...createDefaultConfig({ type: 'plain', appProjects: [] }),
      registry: {
        type: 's3',
        baseUrl: 'https://cdn.example.com',
      },
    };

    const result = validateFwizConfig(config);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.warnings.join(' ')).toMatch(/bucket/i);
    }
  });
});
