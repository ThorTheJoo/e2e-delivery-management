'use client';

import { useMemo, useState, useEffect } from 'react';
import { Calculator, ChevronDown, ChevronRight } from 'lucide-react';
// Button is not used in this component
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  DEFAULT_COMPLEXITY_CONFIG,
  type ComplexitySelection,
  type NfrKey,
} from '@/types/complexity';

interface FieldOption {
  id: string;
  label: string;
}

// Move nfrKeys outside component as it's a constant
const nfrKeys: NfrKey[] = ['performance', 'scalability', 'security', 'availability'];

export function ComplexityMatrix() {
  const config = DEFAULT_COMPLEXITY_CONFIG;

  // Collapsible state is fully local to avoid impacting other sections
  const [expanded, setExpanded] = useState(false);

  // Build options from config (memoized)
  const customerOptions: FieldOption[] = useMemo(
    () => config.categories['customer-type'].map((o) => ({ id: o.id, label: o.label })),
    [config],
  );
  const productOptions: FieldOption[] = useMemo(
    () => config.categories['product-mix'].map((o) => ({ id: o.id, label: o.label })),
    [config],
  );
  const accessOptions: FieldOption[] = useMemo(
    () => config.categories['access-technology'].map((o) => ({ id: o.id, label: o.label })),
    [config],
  );
  const channelOptions: FieldOption[] = useMemo(
    () => config.categories.channel.map((o) => ({ id: o.id, label: o.label })),
    [config],
  );
  const deploymentOptions: FieldOption[] = useMemo(
    () => config.categories.deployment.map((o) => ({ id: o.id, label: o.label })),
    [config],
  );

  const nfrOptions: Record<NfrKey, FieldOption[]> = useMemo(() => {
    const res: Record<NfrKey, FieldOption[]> = {
      performance: [],
      scalability: [],
      security: [],
      availability: [],
    };
    nfrKeys.forEach((k) => {
      res[k] = (config.nfr[k] || []).map((o) => ({ id: o.id, label: o.label }));
    });
    return res;
  }, [config]);

  // Defaults use the first entry in each list and baseline NFRs
  const [selection, setSelection] = useState<ComplexitySelection>({
    customerTypeIds: customerOptions[0]?.id ? [customerOptions[0].id] : [],
    productMixIds: productOptions[0]?.id ? [productOptions[0].id] : [],
    accessTechnologyIds: accessOptions[0]?.id ? [accessOptions[0].id] : [],
    channelIds: channelOptions[0]?.id ? [channelOptions[0].id] : [],
    deploymentId: deploymentOptions[0]?.id || '',
    nfrSelections: {
      performance: nfrOptions.performance[0]?.id,
      scalability: nfrOptions.scalability[0]?.id,
      security: nfrOptions.security[0]?.id,
      availability: nfrOptions.availability[0]?.id,
    },
    deliveryServicesEnabled: undefined,
  });


  // Persistence: load from localStorage, then save on change
  useEffect(() => {
    try {
      const raw = localStorage.getItem('complexity-selection');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSelection((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('complexity-selection', JSON.stringify(selection));
    } catch {}
  }, [selection]);


  return (
    <div className="border-b pb-6">
      <div
        className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-label="Toggle Complexity Matrix"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setExpanded(!expanded);
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-amber-200 bg-amber-100">
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-amber-700" />
            ) : (
              <ChevronRight className="h-5 w-5 text-amber-700" />
            )}
          </div>
          <div>
            <h3 className="flex items-center space-x-2 text-base font-semibold">
              <Calculator className="h-4 w-4" />
              <span>E2E Use Case Parameters</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Criteria used to quantify the number of E2E Use Cases required
            </p>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="space-y-6">
          {/* Parameter selectors */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Customer Type (multi)</div>
              <MultiSelect
                value={selection.customerTypeIds}
                onChange={(vals) => setSelection({ ...selection, customerTypeIds: vals })}
                options={customerOptions.map((o) => ({ value: o.id, label: o.label }))}
                placeholder="Select customer types"
                ariaLabel="Customer Type"
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-muted-foreground">Product Mix (multi)</div>
              <MultiSelect
                value={selection.productMixIds}
                onChange={(vals) => setSelection({ ...selection, productMixIds: vals })}
                options={productOptions.map((o) => ({ value: o.id, label: o.label }))}
                placeholder="Select product types"
                ariaLabel="Product Mix"
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-muted-foreground">Access Technology (multi)</div>
              <MultiSelect
                value={selection.accessTechnologyIds}
                onChange={(vals) => setSelection({ ...selection, accessTechnologyIds: vals })}
                options={accessOptions.map((o) => ({ value: o.id, label: o.label }))}
                placeholder="Select access technologies"
                ariaLabel="Access Technology"
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-muted-foreground">Channel (multi)</div>
              <MultiSelect
                value={selection.channelIds}
                onChange={(vals) => setSelection({ ...selection, channelIds: vals })}
                options={channelOptions.map((o) => ({ value: o.id, label: o.label }))}
                placeholder="Select channels"
                ariaLabel="Channel"
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-muted-foreground">Deployment</div>
              <Select
                value={selection.deploymentId}
                onValueChange={(v) => setSelection({ ...selection, deploymentId: v })}
              >
                <SelectTrigger aria-label="Deployment">
                  <SelectValue placeholder="Select deployment model" />
                </SelectTrigger>
                <SelectContent>
                  {deploymentOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* NFR selections */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {nfrKeys.map((key) => (
              <div key={key}>
                <div className="mb-1 text-xs capitalize text-muted-foreground">{key}</div>
                <Select
                  value={selection.nfrSelections?.[key]}
                  onValueChange={(v) =>
                    setSelection({
                      ...selection,
                      nfrSelections: { ...selection.nfrSelections, [key]: v },
                    })
                  }
                >
                  <SelectTrigger aria-label={`${key} requirement`}>
                    <SelectValue placeholder={`Select ${key}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {nfrOptions[key].map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}


