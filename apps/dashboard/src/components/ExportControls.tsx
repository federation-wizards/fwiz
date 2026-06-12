import { useCallback, type RefObject } from 'react';

import type { Edge, Node } from '@xyflow/react';
import { toPng } from 'html-to-image';

import type { FwizConfig } from '@federation-wizards/core';
import type { RuntimeSnapshot } from '@federation-wizards/mf-plugins';

import {
  buildExportPayload,
  type FederationNodeData,
} from '../lib/graph.js';

interface ExportControlsProps {
  config: FwizConfig;
  nodes: Node<FederationNodeData>[];
  edges: Edge[];
  runtime: RuntimeSnapshot[];
  graphRef: RefObject<HTMLDivElement | null>;
}

export function ExportControls({
  config,
  nodes,
  edges,
  runtime,
  graphRef,
}: ExportControlsProps) {
  const exportJson = useCallback(() => {
    const payload = buildExportPayload(config, nodes, edges, runtime);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'fwiz-federation-graph.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [config, nodes, edges, runtime]);

  const exportPng = useCallback(async () => {
    const element = graphRef.current;

    if (!element) {
      return;
    }

    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--app-bg')
        .trim(),
    });

    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = 'fwiz-federation-graph.png';
    anchor.click();
  }, [graphRef]);

  return (
    <div className="export-controls">
      <button type="button" onClick={exportJson}>
        Export JSON
      </button>
      <button type="button" onClick={() => void exportPng()}>
        Export PNG
      </button>
    </div>
  );
}
