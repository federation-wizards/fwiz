import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';

import { afterEach, describe, expect, it } from 'vitest';

import { createHttpRegistryBackend } from './http.js';

const servers: Array<ReturnType<typeof createServer>> = [];

function startTestServer(
  handler: (request: IncomingMessage, response: ServerResponse) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer(handler);
    servers.push(server);

    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      resolve(`http://127.0.0.1:${address.port}`);
    });

    server.on('error', reject);
  });
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        }),
    ),
  );
});

describe('createHttpRegistryBackend', () => {
  it('uploads and reads objects via HTTP PUT/GET', async () => {
    const store = new Map<string, string>();
    const baseUrl = await startTestServer((request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const key = url.pathname.replace(/^\//, '');

      if (request.method === 'PUT') {
        const chunks: Buffer[] = [];

        request.on('data', (chunk) => {
          chunks.push(Buffer.from(chunk));
        });

        request.on('end', () => {
          store.set(key, Buffer.concat(chunks).toString('utf8'));
          response.writeHead(200);
          response.end('ok');
        });
        return;
      }

      if (request.method === 'GET') {
        const value = store.get(key);

        if (!value) {
          response.writeHead(404);
          response.end('not found');
          return;
        }

        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(value);
        return;
      }

      response.writeHead(405);
      response.end('method not allowed');
    });

    const backend = createHttpRegistryBackend({
      type: 'http',
      baseUrl,
      prefix: 'mf',
    });

    await backend.put('mf/checkout/1.0.0/mf-manifest.json', '{"name":"checkout"}\n');
    const value = await backend.get('mf/checkout/1.0.0/mf-manifest.json');

    expect(value).toBe('{"name":"checkout"}\n');
    expect(await backend.get('mf/missing.json')).toBeNull();
  });
});
