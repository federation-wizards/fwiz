import { createServer } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { findPortConflicts, isPortAvailable } from './ports.js';
const boundServers: ReturnType<typeof createServer>[] = [];
afterEach(async () => { await Promise.all(boundServers.splice(0).map((s) => new Promise<void>((r) => s.close(() => r())))); });
describe('isPortAvailable', () => { it('returns false when a port is already in use', async () => { await new Promise<void>((resolve, reject) => { const server = createServer(); server.once('error', reject); server.listen(4567, '127.0.0.1', () => { boundServers.push(server); resolve(); }); }); await expect(isPortAvailable(4567)).resolves.toBe(false); }); });
describe('findPortConflicts', () => { it('returns only occupied ports', async () => { await new Promise<void>((resolve, reject) => { const server = createServer(); server.once('error', reject); server.listen(4570, '127.0.0.1', () => { boundServers.push(server); resolve(); }); }); await expect(findPortConflicts([4570, 4571])).resolves.toEqual([4570]); }); });
