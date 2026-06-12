import Joi from 'joi';

import type { FwizConfig } from './types.js';

const sharedDependencySchema = Joi.object({
  singleton: Joi.boolean().required(),
  requiredVersion: Joi.string().required(),
  eager: Joi.boolean().required(),
});

const devProjectSchema = Joi.object({
  command: Joi.string().optional(),
});

const hostSchema = Joi.object({
  name: Joi.string().required(),
  project: Joi.string().optional(),
  port: Joi.number().integer().min(1).max(65535).required(),
  dev: devProjectSchema.optional(),
});

const remoteSchema = Joi.object({
  name: Joi.string().required(),
  project: Joi.string().optional(),
  port: Joi.number().integer().min(1).max(65535).required(),
  dev: devProjectSchema.optional(),
});

export const fwizConfigSchema = Joi.object({
  version: Joi.string().required(),
  workspace: Joi.object({
    type: Joi.string().valid('nx', 'turbo', 'plain').required(),
  }).required(),
  hosts: Joi.array().items(hostSchema).min(1).required(),
  remotes: Joi.array().items(remoteSchema).required(),
  shared: Joi.object().pattern(Joi.string(), sharedDependencySchema).required(),
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
