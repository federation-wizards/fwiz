import { useEffect, useMemo, useRef, useState } from 'react';

import type { Node } from '@xyflow/react';

import { ExportControls } from '../components/ExportControls.js';
import { FederationGraph } from '../components/FederationGraph.js';
import { NodeDetailPanel } from '../components/NodeDetailPanel.js';
import { RuntimePanel } from '../components/RuntimePanel.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { useFwizConfig } from '../hooks/useFwizConfig.js';
import { useRuntimeData } from '../hooks/useRuntimeData.js';
import {
  buildGraphFromConfig,
  type FederationNodeData,
} from '../lib/graph.js';

import styles from './app.module.css';

export function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const { config, loading, error } = useFwizConfig();
  const {
    snapshots,
    loading: runtimeLoading,
    error: runtimeError,
  } = useRuntimeData();

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  const graph = useMemo(
    () => (config ? buildGraphFromConfig(config) : { nodes: [], edges: [] }),
    [config],
  );

  const selectedNode = useMemo(
    () =>
      graph.nodes.find((node) => node.id === selectedNodeId) ??
      null,
    [graph.nodes, selectedNodeId],
  ) as Node<FederationNodeData> | null;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h1>fwiz dashboard</h1>
          <p className={styles.subtitle}>
            Module Federation graph and live runtime inspector
          </p>
        </div>
        <ThemeToggle
          darkMode={darkMode}
          onToggle={() => setDarkMode((value) => !value)}
        />
      </header>

      {loading ? <p className={styles.status}>Loading fwiz config…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {config ? (
        <>
          <div className={styles.toolbar}>
            <ExportControls
              config={config}
              nodes={graph.nodes}
              edges={graph.edges}
              runtime={snapshots}
              graphRef={graphRef}
            />
          </div>
          <main className={styles.layout}>
            <FederationGraph
              config={config}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              graphRef={graphRef}
            />
            <aside className={styles.sidebar}>
              <NodeDetailPanel node={selectedNode} snapshots={snapshots} />
              <RuntimePanel
                snapshots={snapshots}
                loading={runtimeLoading}
                error={runtimeError}
              />
            </aside>
          </main>
        </>
      ) : null}
    </div>
  );
}

export default App;
