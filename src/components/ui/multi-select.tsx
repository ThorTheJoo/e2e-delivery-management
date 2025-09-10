'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  ariaLabel?: string;
}

export function MultiSelect({ value, onChange, options, placeholder, ariaLabel }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  function toggle(val: string) {
    const exists = value.includes(val);
    onChange(exists ? value.filter((v) => v !== val) : [...value, val]);
  }

  const display = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          )}
        >
          <span className={cn(display ? '' : 'text-muted-foreground')}>{display || (placeholder || 'Select')}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="z-50 w-[260px] rounded-md border bg-popover p-2 text-popover-foreground shadow-md"
        >
          <div className="max-h-64 overflow-auto">
            {options.map((o) => (
              <label
                key={o.value}
                className="flex cursor-pointer select-none items-center space-x-2 rounded px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => e.preventDefault()}
              >
                <Checkbox
                  checked={value.includes(o.value)}
                  onCheckedChange={() => toggle(o.value)}
                  aria-label={o.label}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}


