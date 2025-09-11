'use client';

import { useState } from 'react';
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

export function Collapsible({
  title,
  children,
  defaultCollapsed = false,
  className,
  headerClassName,
  contentClassName,
}: CollapsibleProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn('w-full', className)}>
      <button
        onClick={toggleCollapsed}
        className={cn(
          'flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50',
          headerClassName
        )}
        aria-expanded={!isCollapsed}
        aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${title}`}
      >
        <span className="font-medium">{title}</span>
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100',
          contentClassName
        )}
        aria-hidden={isCollapsed}
      >
        <div className="p-4 pt-0">{children}</div>
      </div>
    </div>
  );
}