import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  BlueDolphinVisualLink,
  BlueDolphinVisualNode,
} from '@/types/blue-dolphin-visualization';

interface ObjectDetailsPanelProps {
  node?: BlueDolphinVisualNode | null;
  link?: BlueDolphinVisualLink | null;
  onClose?: () => void;
}

export function ObjectDetailsPanel({ node, link }: ObjectDetailsPanelProps) {
  if (!node && !link) return null;
  if (node) {
    const n = node;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Object Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>Title:</strong> {n.title}
          </div>
          <div>
            <strong>Definition:</strong> {n.definition}
          </div>
          <div>
            <strong>Workspace:</strong> {n.workspace}
          </div>
          <div>
            <strong>Shape:</strong> {n.shape}
          </div>
          <div className="border-t pt-2">
            <div className="font-semibold">Sample Fields</div>
            <div className="break-words text-xs text-muted-foreground">ID: {n.id}</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (link) {
    const l = link;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relationship Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>Name:</strong> {l.relationshipName}
          </div>
          <div>
            <strong>Type:</strong> {l.type}
          </div>
          <div>
            <strong>Style:</strong> {l.style}
          </div>
          <div>
            <strong>Width:</strong> {l.width}
          </div>
          <div className="break-words border-t pt-2 text-xs text-muted-foreground">ID: {l.id}</div>
        </CardContent>
      </Card>
    );
  }
  return null;
}

export default ObjectDetailsPanel;
