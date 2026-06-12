import type { RegistryConfig } from '../../config/types.js';
import { joinRegistryPath } from '../paths.js';
import type { RegistryBackend } from './types.js';

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function resolveUploadBaseUrl(registry: RegistryConfig): string {
  const base = registry.uploadBaseUrl ?? registry.baseUrl;
  return base.replace(/\/+$/, '');
}

function resolveObjectUrl(registry: RegistryConfig, key: string): string {
  const uploadBase = resolveUploadBaseUrl(registry);
  const normalizedKey = trimSlashes(key);
  return `${uploadBase}/${normalizedKey}`;
}

export function createHttpRegistryBackend(
  registry: RegistryConfig,
): RegistryBackend {
  const headers = registry.headers ?? {};

  return {
    async get(key: string): Promise<string | null> {
      const url = resolveObjectUrl(registry, key);
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(
          `HTTP registry GET failed for ${url}: ${response.status} ${response.statusText}`,
        );
      }

      return response.text();
    },

    async put(
      key: string,
      body: string,
      contentType = 'application/json',
    ): Promise<void> {
      const url = resolveObjectUrl(registry, key);
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'content-type': contentType,
          ...headers,
        },
        body,
      });

      if (!response.ok) {
        throw new Error(
          `HTTP registry PUT failed for ${url}: ${response.status} ${response.statusText}`,
        );
      }
    },
  };
}

export function createHttpRegistryBackendFromBaseUrl(
  baseUrl: string,
  options: {
    prefix?: string;
    headers?: Record<string, string>;
  } = {},
): RegistryBackend {
  return createHttpRegistryBackend({
    type: 'http',
    baseUrl,
    uploadBaseUrl: baseUrl,
    prefix: options.prefix,
    headers: options.headers,
  });
}

export function getHttpRegistryPublicUrl(
  registry: RegistryConfig,
  key: string,
): string {
  const publicBase = registry.baseUrl.replace(/\/+$/, '');
  return joinRegistryPath(publicBase, trimSlashes(key));
}
