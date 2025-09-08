'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  children,
  defaultCollapsed = false,
  className,
  headerClassName,
  contentClassName,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn('rounded-lg border', className)}>
      <button
        onClick={handleToggle}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-muted/50',
          headerClassName,
        )}
        aria-expanded={!isCollapsed}
        aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${title} section`}
      >
        <span className="font-medium text-foreground">{title}</span>
        <div className="flex items-center">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100',
          contentClassName,
        )}
      >
        <div className="p-4 pt-0">{children}</div>
      </div>
    </div>
  );
};
