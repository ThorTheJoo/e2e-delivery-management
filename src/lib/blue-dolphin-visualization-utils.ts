import type { BlueDolphinObjectEnhanced } from '@/types/blue-dolphin';
import type {
  BlueDolphinVisualNode,
  BlueDolphinVisualLink,
  VisualShape,
  VisualLineStyle,
  VisualArrowStyle,
} from '@/types/blue-dolphin-visualization';

export interface BlueDolphinRelation {
  Id?: string;
  RelationshipId: string;
  BlueDolphinObjectItemId: string;
  RelatedBlueDolphinObjectItemId: string;
  RelationshipDefinitionId?: string;
  RelationshipDefinitionName?: string;
  BlueDolphinObjectWorkspaceName?: string;
  BlueDolphinObjectDefinitionName?: string;
  RelatedBlueDolphinObjectWorkspaceName?: string;
  RelatedBlueDolphinObjectDefinitionName?: string;
  Type?: string;
  Name?: string;
  IsRelationshipDirectionAlternative?: boolean;
  [key: string]: unknown;
}

function hashToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash << 5) - hash + input.charCodeAt(i);
  return Math.abs(hash) % 360;
}

export function getColorForWorkspace(workspace: string | undefined): string {
  if (!workspace) return '#3b82f6';
  const presets: Record<string, string> = {
    'CSG International': '#2563eb',
    'Product Architecture': '#16a34a',
    'Customer Q': '#ea580c',
    'Simulated Case Study': '#7c3aed',
    RR: '#047857',
  };
  if (presets[workspace]) return presets[workspace];
  const hue = hashToHue(workspace);
  return `hsl(${hue} 70% 45%)`;
}

export function getShapeForDefinition(definition: string | undefined): VisualShape {
  if (!definition) return 'circle';
  const d = definition.toLowerCase();
  if (d.includes('application') || d.includes('technology') || d.includes('component'))
    return 'rectangle';
  if (d.includes('business') || d.includes('process') || d.includes('function')) return 'circle';
  if (d.includes('decision') || d.includes('event')) return 'diamond';
  if (d.includes('capability') || d.includes('outcome')) return 'hexagon';
  return 'circle';
}

export function getLinkStyleForType(type: string | undefined): {
  style: VisualLineStyle;
  width: number;
  arrowStyle: VisualArrowStyle;
  color: string;
} {
  const t = (type || '').toLowerCase();
  if (t === 'composition' || t === 'aggregation')
    return { style: 'solid', width: 4, arrowStyle: 'single', color: '#334155' };
  if (t === 'flow') return { style: 'dashed', width: 3, arrowStyle: 'single', color: '#0369a1' };
  if (t === 'association')
    return { style: 'dotted', width: 3, arrowStyle: 'none', color: '#64748b' };
  if (t === 'realization')
    return { style: 'solid', width: 3, arrowStyle: 'single', color: '#7c3aed' };
  if (t === 'serving' || t === 'usedby' || t === 'access')
    return { style: 'solid', width: 3, arrowStyle: 'single', color: '#16a34a' };
  return { style: 'solid', width: 3, arrowStyle: 'single', color: '#0f172a' };
}

export function transformObjectsToNodes(
  objects: BlueDolphinObjectEnhanced[],
): BlueDolphinVisualNode[] {
  return (objects || []).map((obj) => {
    const completenessWeight = typeof obj.Completeness === 'number' ? obj.Completeness / 100 : 0;
    const sizeBase = 4 + completenessWeight * 2;
    const sizePx = Math.max(15, sizeBase * 4);
    return {
      id: String(obj.ID),
      title: obj.Title || String(obj.ID),
      definition: obj.Definition || 'Object',
      workspace: obj.Workspace || 'Unknown',
      size: sizePx,
      color: getColorForWorkspace(obj.Workspace),
      shape: getShapeForDefinition(obj.Definition),
      opacity: 1,
      val: sizeBase,
      metadata: { ...obj },
    } as BlueDolphinVisualNode;
  });
}

export function transformRelationsToLinks(
  relations: BlueDolphinRelation[],
): BlueDolphinVisualLink[] {
  return (relations || []).map((rel) => {
    const style = getLinkStyleForType(rel.Type);
    const id =
      rel.RelationshipId ||
      `${rel.BlueDolphinObjectItemId}-${rel.Type}-${rel.RelatedBlueDolphinObjectItemId}-${rel.Name}`;
    return {
      id,
      source: String(rel.BlueDolphinObjectItemId),
      target: String(rel.RelatedBlueDolphinObjectItemId),
      relationshipName: rel.RelationshipDefinitionName || rel.Name || rel.Type || 'relation',
      type: rel.Type || 'relation',
      color: style.color,
      width: style.width,
      style: style.style,
      arrowStyle: style.arrowStyle,
      opacity: 0.9,
      metadata: { ...rel },
    } as BlueDolphinVisualLink;
  });
}

export function resolveLinkEndpoints(
  nodes: BlueDolphinVisualNode[],
  links: BlueDolphinVisualLink[],
): BlueDolphinVisualLink[] {
  const idToNode = new Map<string, BlueDolphinVisualNode>();
  nodes.forEach((n) => idToNode.set(String(n.id), n));
  return links
    .map((link) => {
      const s = idToNode.get(String(link.source));
      const t = idToNode.get(String(link.target));
      return s && t ? { ...link, source: s, target: t } : null;
    })
    .filter(Boolean) as BlueDolphinVisualLink[];
}

export function uniqueSorted(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}
