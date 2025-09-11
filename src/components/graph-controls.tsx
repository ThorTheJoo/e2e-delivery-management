import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type {
  VisualizationFilters,
  VisualizationViewMode,
} from '@/types/blue-dolphin-visualization';

interface GraphControlsProps {
  filters: VisualizationFilters;
  setFilters: (f: Partial<VisualizationFilters>) => void;
  available: {
    workspaces: string[];
    relationTypes: string[];
    relationNames: string[];
    sourceDefinitions: string[];
    targetDefinitions: string[];
  };
  onLoad: () => void;
  loading: boolean;
}

export function GraphControls({
  filters,
  setFilters,
  available,
  onLoad,
  loading,
}: GraphControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualization Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label>Workspace</Label>
          <Select
            value={filters.workspace || 'all'}
            onValueChange={(v) => setFilters({ workspace: v === 'all' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {available.workspaces.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Relation Type</Label>
          <Select
            value={filters.relationType || 'all'}
            onValueChange={(v) => setFilters({ relationType: v === 'all' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {available.relationTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Relation Name</Label>
          <Select
            value={filters.relationName || 'all'}
            onValueChange={(v) => setFilters({ relationName: v === 'all' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {available.relationNames.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Source Definition</Label>
          <Select
            value={filters.sourceDefinition || 'all'}
            onValueChange={(v) => setFilters({ sourceDefinition: v === 'all' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {available.sourceDefinitions.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Target Definition</Label>
          <Select
            value={filters.targetDefinition || 'all'}
            onValueChange={(v) => setFilters({ targetDefinition: v === 'all' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {available.targetDefinitions.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Results Limit</Label>
          <Select
            value={String(filters.resultsTop)}
            onValueChange={(v) => setFilters({ resultsTop: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="250">250</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="1000">1000</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>View Mode</Label>
          <Select
            value={filters.viewMode}
            onValueChange={(v) => setFilters({ viewMode: v as VisualizationViewMode })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
              <SelectItem value="deep-dive">Deep Dive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Object Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(v) => setFilters({ status: v === 'all' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Source Object Status</Label>
          <Select
            value={filters.sourceStatus || 'all'}
            onValueChange={(v) => setFilters({ sourceStatus: v === 'all' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Target Object Status</Label>
          <Select
            value={filters.targetStatus || 'all'}
            onValueChange={(v) => setFilters({ targetStatus: v === 'all' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={onLoad} disabled={loading}>
            {loading ? 'Loading...' : 'Load Visualization'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
