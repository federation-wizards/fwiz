import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send = send;
  }

  class GetObjectCommand {
    input: unknown;

    constructor(input: unknown) {
      this.input = input;
    }
  }

  class PutObjectCommand {
    input: unknown;

    constructor(input: unknown) {
      this.input = input;
    }
  }

  return {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
  };
});

import { createS3RegistryBackend } from './s3.js';

describe('createS3RegistryBackend', () => {
  beforeEach(() => {
    send.mockReset();
  });

  it('uploads objects with PutObjectCommand', async () => {
    send.mockResolvedValueOnce({});

    const backend = createS3RegistryBackend({
      type: 's3',
      baseUrl: 'https://cdn.example.com',
      bucket: 'mf-assets',
      region: 'us-east-1',
    });

    await backend.put('checkout/1.0.0/mf-manifest.json', '{"name":"checkout"}\n');

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      input: {
        Bucket: 'mf-assets',
        Key: 'checkout/1.0.0/mf-manifest.json',
        Body: '{"name":"checkout"}\n',
        ContentType: 'application/json',
      },
    });
  });

  it('reads objects with GetObjectCommand', async () => {
    send.mockResolvedValueOnce({
      Body: {
        transformToString: async () => '{"name":"checkout"}\n',
      },
    });

    const backend = createS3RegistryBackend({
      type: 's3',
      baseUrl: 'https://cdn.example.com',
      bucket: 'mf-assets',
    });

    const value = await backend.get('checkout/1.0.0/mf-manifest.json');

    expect(value).toBe('{"name":"checkout"}\n');
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      input: {
        Bucket: 'mf-assets',
        Key: 'checkout/1.0.0/mf-manifest.json',
      },
    });
  });

  it('returns null when the object does not exist', async () => {
    const error = new Error('not found');
    error.name = 'NoSuchKey';
    send.mockRejectedValueOnce(error);

    const backend = createS3RegistryBackend({
      type: 's3',
      baseUrl: 'https://cdn.example.com',
      bucket: 'mf-assets',
    });

    await expect(backend.get('missing.json')).resolves.toBeNull();
  });
});
