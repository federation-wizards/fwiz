import type { FwizConfig, WorkspaceInfo } from './types.js';

const DEFAULT_HOST_PORT = 4200;
const DEFAULT_REMOTE_PORT = 4201;

function createSharedDependencies(reactVersion?: string): FwizConfig['shared'] {
  const requiredVersion = reactVersion ?? '^19.0.0';

  return {
    react: {
      singleton: true,
      requiredVersion,
      eager: false,
    },
    'react-dom': {
      singleton: true,
      requiredVersion,
      eager: false,
    },
  };
}

function createHosts(appProjects: string[]): FwizConfig['hosts'] {
  if (appProjects.length === 0) {
    return [{ name: 'shell', port: DEFAULT_HOST_PORT }];
  }

  const [hostProject, ..._] = appProjects;

  return [
    {
      name: hostProject,
      project: hostProject,
      port: DEFAULT_HOST_PORT,
    },
  ];
}

function createRemotes(appProjects: string[]): FwizConfig['remotes'] {
  if (appProjects.length <= 1) {
    return [{ name: 'remote', port: DEFAULT_REMOTE_PORT }];
  }

  return appProjects.slice(1).map((project, index) => ({
    name: project,
    project,
    port: DEFAULT_REMOTE_PORT + index,
  }));
}

export function createDefaultConfig(workspace: WorkspaceInfo): FwizConfig {
  return {
    version: '1',
    workspace: {
      type: workspace.type,
    },
    hosts: createHosts(workspace.appProjects),
    remotes: createRemotes(workspace.appProjects),
    shared: createSharedDependencies(workspace.reactVersion),
  };
}
