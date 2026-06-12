import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import type { RegistryConfig } from '../../config/types.js';
import type { RegistryBackend } from './types.js';

function readBody(body: unknown): Promise<string> {
  if (!body) {
    return Promise.resolve('');
  }

  if (typeof body === 'string') {
    return Promise.resolve(body);
  }

  if (body instanceof Uint8Array) {
    return Promise.resolve(new TextDecoder().decode(body));
  }

  if (typeof (body as { transformToString?: () => Promise<string> }).transformToString === 'function') {
    return (body as { transformToString: () => Promise<string> }).transformToString();
  }

  return Promise.resolve(String(body));
}

export function createS3RegistryBackend(registry: RegistryConfig): RegistryBackend {
  if (!registry.bucket) {
    throw new Error('S3 registry requires a bucket.');
  }

  const client = new S3Client({
    region: registry.region ?? process.env.AWS_REGION ?? 'us-east-1',
    endpoint: registry.endpoint,
    forcePathStyle: registry.forcePathStyle,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN,
          }
        : undefined,
  });

  return {
    async get(key: string): Promise<string | null> {
      try {
        const response = await client.send(
          new GetObjectCommand({
            Bucket: registry.bucket,
            Key: key,
          }),
        );

        return readBody(response.Body);
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'name' in error &&
          (error.name === 'NoSuchKey' || error.name === 'NotFound')
        ) {
          return null;
        }

        throw error;
      }
    },

    async put(
      key: string,
      body: string,
      contentType = 'application/json',
    ): Promise<void> {
      await client.send(
        new PutObjectCommand({
          Bucket: registry.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    },
  };
}
