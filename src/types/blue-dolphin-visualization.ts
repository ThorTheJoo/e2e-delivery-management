import type { BlueDolphinObjectEnhanced } from '@/types/blue-dolphin';

export type VisualShape = 'circle' | 'rectangle' | 'diamond' | 'hexagon';
export type VisualLineStyle = 'solid' | 'dashed' | 'dotted';
export type VisualArrowStyle = 'none' | 'single' | 'double' | 'filled';

export interface BlueDolphinVisualNode {
  id: string;
  title: string;
  definition: string;
  workspace: string;
  size: number;
  color: string;
  shape: VisualShape;
  opacity: number;
  val?: number;
  metadata: Record<string, unknown> & Partial<BlueDolphinObjectEnhanced>;
}

export interface BlueDolphinVisualLink {
  id: string;
  source: string | BlueDolphinVisualNode;
  target: string | BlueDolphinVisualNode;
  relationshipName: string;
  type: string;
  color: string;
  width: number;
  style: VisualLineStyle;
  arrowStyle: VisualArrowStyle;
  opacity: number;
  metadata: Record<string, unknown>;
}

export type VisualizationViewMode = 'overview' | 'detailed' | 'deep-dive';

export interface VisualizationFilters {
  workspace: string;
  relationType: string;
  relationName: string;
  sourceDefinition: string;
  targetDefinition: string;
  resultsTop: number;
  viewMode: VisualizationViewMode;
  status: string;
  sourceStatus: string;
  targetStatus: string;
}
