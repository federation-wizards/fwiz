import { describe, expect, it } from 'vitest';
import { createDefaultConfig } from '../config/defaults.js';
import { validateFwizConfig } from '../config/schema.js';
import { buildDevPlan, resolveDevCommand } from './plan.js';
import { allocateProxyPort } from './ports.js';
describe('validateFwizConfig dev.command', () => { it('accepts optional dev.command', () => { const config = { ...createDefaultConfig({ type: 'plain', appProjects: [] }), hosts: [{ name: 'shell', port: 4200, dev: { command: 'vite --port {port}' } }], remotes: [{ name: 'checkout', port: 4201, dev: { command: 'vite --port {port}' } }] }; expect(validateFwizConfig(config).valid).toBe(true); }); });
describe('buildDevPlan', () => { it('builds nx serve commands', () => { const plan = buildDevPlan(createDefaultConfig({ type: 'nx', appProjects: ['shell', 'checkout', 'account'] }), 'shell'); expect(plan.processes[0]?.command).toBe('npx nx run shell:serve --port=4200'); expect(plan.proxyPort).toBe(5200); }); it('uses dev.command when configured', () => { const config = createDefaultConfig({ type: 'plain', appProjects: [] }); config.hosts = [{ name: 'shell', port: 3000, dev: { command: 'vite --port {port}' } }]; config.remotes = [{ name: 'checkout', port: 3001, dev: { command: 'vite --port {port}' } }]; expect(buildDevPlan(config, 'shell').processes[0]?.command).toBe('vite --port 3000'); }); });
describe('resolveDevCommand', () => { it('throws when no project or dev.command is configured', () => { expect(() => resolveDevCommand({ name: 'shell', port: 4200 }, 'plain', 4200)).toThrow(/No dev command configured/); }); });
describe('allocateProxyPort', () => { it('skips ports already assigned to dev servers', () => { expect(allocateProxyPort(4200, [4200, 4201, 5200])).toBe(5201); }); });
