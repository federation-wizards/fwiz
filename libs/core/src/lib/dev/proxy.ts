import { createServer, type Server } from 'node:http';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { DevProxyRoute } from './types.js';
export function createDevProxyServer(routes: DevProxyRoute[], port: number): Promise<Server> { const app = express(); for (const route of routes) app.use(route.path, createProxyMiddleware({ target: route.target, changeOrigin: true, ws: true })); return new Promise((resolve, reject) => { const server = createServer(app); server.once('error', reject); server.listen(port, '127.0.0.1', () => resolve(server)); }); }
