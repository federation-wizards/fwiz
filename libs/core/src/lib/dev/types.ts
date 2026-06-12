import type { HostConfig, RemoteConfig } from '../config/types.js';
export type DevServerRole = 'host' | 'remote';
export interface DevProcessSpec { name: string; role: DevServerRole; port: number; command: string; url: string; }
export interface DevProxyRoute { name: string; path: string; target: string; }
export interface DevPlan { hostName: string; processes: DevProcessSpec[]; proxyPort: number; proxyUrl: string; proxyRoutes: DevProxyRoute[]; }
export interface RunDevOptions { cwd: string; host?: string; }
export type DevProjectEntry = HostConfig | RemoteConfig;
