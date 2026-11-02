import React, { useMemo } from 'react';
import { DataDoc } from './dataDoc';
import { ReportTemplateDescriptor } from './types';
import { normalizeTemplateDescriptor } from './schemas';
import {
  DEFAULT_FALLBACK_DESCRIPTOR,
  DEFAULT_JOB_SLIP_DESCRIPTOR,
  BUNDLED_DEFAULT_DESCRIPTORS,
} from './defaultDescriptors';
import { computeReportStyleVariables } from './reportStyleBridge';
import { UnitTileContainer } from './UnitTileContainer';
import { SectionDispatcher } from './sections/SectionDispatcher';

export interface DocumentRendererProps {
  data: DataDoc;
  descriptor?: ReportTemplateDescriptor;
  className?: string;
  style?: React.CSSProperties;
  inspectionMode?: boolean;
}

/**
 * Universal declarative document renderer.
 * Computes CSS Custom Properties, resolves template sections, and delegates
 * multi-slip or single-sheet page flow through UnitTileContainer.
 */
export const DocumentRenderer = React.forwardRef<HTMLDivElement, DocumentRendererProps>(
  function DocumentRenderer({ data, descriptor, className, style, inspectionMode }, ref) {
    const normalizedDescriptor = useMemo(() => {
      const getFallback = () => {
        if (descriptor?.slug && BUNDLED_DEFAULT_DESCRIPTORS[descriptor.slug]) {
          return BUNDLED_DEFAULT_DESCRIPTORS[descriptor.slug];
        }
        if (data.tables?.sizes || data.units?.[0]?.tables?.sizes) {
          return DEFAULT_JOB_SLIP_DESCRIPTOR;
        }
        return DEFAULT_FALLBACK_DESCRIPTOR;
      };

      if (!descriptor) return getFallback();
      // Fast path: If descriptor is already canonical with active sections, return directly
      if (
        (descriptor as any).version === 1 &&
        Array.isArray(descriptor.sections) &&
        descriptor.sections.length > 0 &&
        descriptor.page &&
        descriptor.styles
      ) {
        return descriptor;
      }
      try {
        return normalizeTemplateDescriptor(descriptor);
      } catch (e) {
        console.warn('[DocForge] Failed to normalize descriptor, falling back to default:', e);
        return getFallback();
      }
    }, [descriptor, data]);

    const cssVars = useMemo(
      () => computeReportStyleVariables(normalizedDescriptor) as React.CSSProperties,
      [normalizedDescriptor]
    );

    const orientation = normalizedDescriptor.page.orientation || 'portrait';
    const slipsPerSheet = normalizedDescriptor.page.slipsPerSheet ?? 1;
    const isSlip =
      Boolean(normalizedDescriptor.slug?.includes('slip')) ||
      Boolean((normalizedDescriptor.options as any)?.isSlip);
    const isSingleSlip = slipsPerSheet === 1;

    const slipClass =
      slipsPerSheet === 2
        ? 'print-doc--slip'
        : isSlip && isSingleSlip
          ? 'print-doc--slip print-doc--slip-single'
          : '';

    const classes = ['print-doc', `print-doc--${orientation}`, slipClass, className]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} style={{ ...cssVars, ...style }}>
        <UnitTileContainer
          data={data}
          descriptor={normalizedDescriptor}
          renderUnit={(unit) => (
            <>
              {(normalizedDescriptor.sections || []).map((section) => (
                <SectionDispatcher
                  key={section.id}
                  section={section}
                  data={data}
                  unit={unit}
                  descriptor={normalizedDescriptor}
                />
              ))}
            </>
          )}
        />
      </div>
    );
  }
);
