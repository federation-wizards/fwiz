import Joi from 'joi';

import type { FwizConfig } from './types.js';

const sharedDependencySchema = Joi.object({
  singleton: Joi.boolean().required(),
  requiredVersion: Joi.string().required(),
  strictVersion: Joi.boolean().optional(),
  eager: Joi.boolean().required(),
});

const hostSchema = Joi.object({
  name: Joi.string().required(),
  project: Joi.string().optional(),
  port: Joi.number().integer().min(1).max(65535).required(),
});

const remoteSchema = Joi.object({
  name: Joi.string().required(),
  project: Joi.string().optional(),
  port: Joi.number().integer().min(1).max(65535).required(),
});

const registrySchema = Joi.object({
  type: Joi.string().valid('s3', 'http').required(),
  baseUrl: Joi.string().uri().required(),
  prefix: Joi.string().optional(),
  remotesRegistryKey: Joi.string().optional(),
  uploadBaseUrl: Joi.string().uri().optional(),
  headers: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  bucket: Joi.string().when('type', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  region: Joi.string().when('type', {
    is: 's3',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  endpoint: Joi.string().uri().when('type', {
    is: 's3',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  forcePathStyle: Joi.boolean().when('type', {
    is: 's3',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
});

export const fwizConfigSchema = Joi.object({
  version: Joi.string().required(),
  workspace: Joi.object({
    type: Joi.string().valid('nx', 'turbo', 'plain').required(),
  }).required(),
  hosts: Joi.array().items(hostSchema).min(1).required(),
  remotes: Joi.array().items(remoteSchema).required(),
  shared: Joi.object().pattern(Joi.string(), sharedDependencySchema).required(),
  registry: registrySchema.optional(),
});

export function validateFwizConfig(
  config: unknown,
): { valid: true; value: FwizConfig } | { valid: false; warnings: string[] } {
  const result = fwizConfigSchema.validate(config, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (result.error) {
    return {
      valid: false,
      warnings: result.error.details.map(
        (detail) => `${detail.path.join('.')}: ${detail.message}`,
      ),
    };
  }

  return { valid: true, value: result.value as FwizConfig };
}
