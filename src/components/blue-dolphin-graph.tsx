'use client';

import React, { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { BlueDolphinVisualLink, BlueDolphinVisualNode, VisualizationViewMode } from '@/types/blue-dolphin-visualization';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false }) as any;

interface BlueDolphinGraphProps {
  nodes: BlueDolphinVisualNode[];
  links: BlueDolphinVisualLink[];
  viewMode: VisualizationViewMode;
  onNodeClick?: (n: BlueDolphinVisualNode) => void;
  onLinkClick?: (l: BlueDolphinVisualLink) => void;
}

export function BlueDolphinGraph({ nodes, links, viewMode, onNodeClick, onLinkClick }: BlueDolphinGraphProps) {
  const fgRef = useRef<any>();

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  const nodeCanvasObject = useMemo(() => {
    return (node: any, ctx: CanvasRenderingContext2D, scale: number) => {
      const n = node as BlueDolphinVisualNode & { x: number; y: number };
      const size = Math.max(15, (n.val ?? 4) * 4);
      // shape
      ctx.save();
      ctx.beginPath();
      if (n.shape === 'circle') {
        ctx.arc(n.x, n.y, size, 0, 2 * Math.PI);
      } else if (n.shape === 'rectangle') {
        ctx.rect(n.x - size, n.y - size * 0.75, size * 2, size * 1.5);
      } else if (n.shape === 'diamond') {
        ctx.moveTo(n.x, n.y - size);
        ctx.lineTo(n.x + size, n.y);
        ctx.lineTo(n.x, n.y + size);
        ctx.lineTo(n.x - size, n.y);
        ctx.closePath();
      } else {
        const r = size;
        ctx.moveTo(n.x + r, n.y);
        for (let i = 1; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          ctx.lineTo(n.x + r * Math.cos(angle), n.y + r * Math.sin(angle));
        }
        ctx.closePath();
      }
      ctx.fillStyle = n.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();

      // label
      const label = n.title || n.id;
      ctx.font = `${Math.max(10, 12 / scale)}px Inter, system-ui`;
      const textWidth = ctx.measureText(label).width;
      const paddingX = 2 / scale;
      const paddingY = 2 / scale;
      const textHeight = 12 / scale;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(n.x - textWidth / 2 - paddingX, n.y - size - textHeight - 6 / scale, textWidth + paddingX * 2, textHeight + paddingY * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(label, n.x - textWidth / 2, n.y - size - 6 / scale);
    };
  }, []);

  const nodePointerAreaPaint = useMemo(() => {
    return (node: any, color: string, ctx: CanvasRenderingContext2D) => {
      const n = node as BlueDolphinVisualNode & { x: number; y: number };
      const size = Math.max(15, (n.val ?? 4) * 4);
      ctx.beginPath();
      if (n.shape === 'circle') {
        ctx.arc(n.x, n.y, size, 0, 2 * Math.PI);
      } else if (n.shape === 'rectangle') {
        ctx.rect(n.x - size, n.y - size * 0.75, size * 2, size * 1.5);
      } else if (n.shape === 'diamond') {
        ctx.moveTo(n.x, n.y - size);
        ctx.lineTo(n.x + size, n.y);
        ctx.lineTo(n.x, n.y + size);
        ctx.lineTo(n.x - size, n.y);
        ctx.closePath();
      } else {
        const r = size;
        ctx.moveTo(n.x + r, n.y);
        for (let i = 1; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          ctx.lineTo(n.x + r * Math.cos(angle), n.y + r * Math.sin(angle));
        }
        ctx.closePath();
      }
      ctx.fillStyle = color;
      ctx.fill();
    };
  }, []);

  const linkCanvasObject = useMemo(() => {
    return (link: any, ctx: CanvasRenderingContext2D, scale: number) => {
      const l = link as BlueDolphinVisualLink & { source: any; target: any };
      ctx.save();
      if (l.style === 'dashed') ctx.setLineDash([6 / scale, 6 / scale]);
      if (l.style === 'dotted') ctx.setLineDash([2 / scale, 4 / scale]);
      ctx.strokeStyle = l.color;
      ctx.lineWidth = l.width || 3;
      ctx.beginPath();
      ctx.moveTo(l.source.x, l.source.y);
      ctx.lineTo(l.target.x, l.target.y);
      ctx.stroke();
      ctx.restore();

      // label at midpoint
      const mx = (l.source.x + l.target.x) / 2;
      const my = (l.source.y + l.target.y) / 2;
      const label = l.relationshipName || l.type;
      ctx.font = `${Math.max(10, 12 / scale)}px Inter, system-ui`;
      const textWidth = ctx.measureText(label).width;
      const paddingX = 2 / scale;
      const paddingY = 2 / scale;
      const textHeight = 12 / scale;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(mx - textWidth / 2 - paddingX, my - textHeight / 2 - paddingY, textWidth + paddingX * 2, textHeight + paddingY * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(label, mx - textWidth / 2, my + 4 / scale);
    };
  }, []);

  return (
    <div className="w-full h-[70vh] rounded border">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeId="id"
        cooldownTicks={100}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkCanvasObject={linkCanvasObject}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={0.6}
        linkDirectionalArrowColor={(l: any) => l.color}
        onNodeClick={(n: any) => onNodeClick && onNodeClick(n)}
        onLinkClick={(l: any) => onLinkClick && onLinkClick(l)}
      />
    </div>
  );
}

export default BlueDolphinGraph;


