'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraphControls } from '@/components/graph-controls';
import { BlueDolphinGraph } from '@/components/blue-dolphin-graph';
import { ObjectDetailsPanel } from '@/components/object-details-panel';
import type { BlueDolphinConfig } from '@/types/blue-dolphin';
import type { BlueDolphinVisualLink, BlueDolphinVisualNode } from '@/types/blue-dolphin-visualization';
import { useBlueDolphinVisualization } from '@/hooks/use-blue-dolphin-visualization';

interface BlueDolphinVisualizationProps {
  config: BlueDolphinConfig;
}

export function BlueDolphinVisualization({ config }: BlueDolphinVisualizationProps) {
  const { nodes, links, loading, error, filters, setFilters, loadData, available } = useBlueDolphinVisualization(config);
  const [selectedNode, setSelectedNode] = useState<BlueDolphinVisualNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<BlueDolphinVisualLink | null>(null);

  return (
    <div className="space-y-4">
      <GraphControls filters={filters} setFilters={setFilters} available={available} onLoad={loadData} loading={loading} />

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">Error: {error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Blue Dolphin Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <BlueDolphinGraph
            nodes={nodes}
            links={links}
            viewMode={filters.viewMode}
            onNodeClick={(n) => { setSelectedLink(null); setSelectedNode(n as any); }}
            onLinkClick={(l) => { setSelectedNode(null); setSelectedLink(l as any); }}
          />
        </CardContent>
      </Card>

      {(selectedNode || selectedLink) && (
        <ObjectDetailsPanel node={selectedNode as any} link={selectedLink as any} />
      )}
    </div>
  );
}

export default BlueDolphinVisualization;


