'use client';

import { Badge } from '@/components/ui/badge';

interface RequirementBadgeProps {
  count: number;
  className?: string;
}

export function RequirementBadge({ count, className }: RequirementBadgeProps) {
  if (count === 0) return null;

  return (
    <Badge 
      variant="secondary" 
      className={`ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200 ${className || ''}`}
    >
      {count} req{count !== 1 ? 's' : ''}
    </Badge>
  );
}

