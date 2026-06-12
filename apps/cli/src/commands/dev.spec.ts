import { buildDevPlan, createDefaultConfig } from '@federation-wizards/core';
describe('fwiz dev command', () => { it('builds a dev plan with host and remotes', () => { const plan = buildDevPlan(createDefaultConfig({ type: 'nx', appProjects: ['shell', 'checkout'] }), 'shell'); expect(plan.processes.map((p) => p.name)).toEqual(['shell', 'checkout']); }); });
