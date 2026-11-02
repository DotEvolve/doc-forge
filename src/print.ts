import type { PageMargins } from './types';

export type PrintOrientation = 'portrait' | 'landscape';

/**
 * Uniform outer page margin for every printed document, as
 * `top right bottom left`. The left margin is 18mm so printed
 * reports can be hole-punched or filed without eating into the table.
 */
export const PRINT_PAGE_MARGIN = '10mm 10mm 10mm 18mm';

/**
 * Printable height of an A4 portrait sheet once the top/bottom margins above
 * are removed: 297mm - 10mm - 10mm. Job slips use half of this so exactly two
 * slips share one sheet (see `.print-doc--slip` in the global stylesheet).
 */
export const PRINT_A4_PORTRAIT_CONTENT_HEIGHT_MM = 277;

/**
 * Content width of an A4 sheet with the margins above, per orientation.
 * `.print-doc` caps itself at these widths in the global stylesheet so a
 * document can never run off the right edge, even in a browser that ignores the
 * `@page` margins. Keep the two in step.
 */
export const PRINT_A4_CONTENT_WIDTH_MM = { portrait: 182, landscape: 269 } as const;

/**
 * Builds the `pageStyle` string passed to `useReactToPrint`.
 *
 * react-to-print injects `pageStyle` into the print iframe's <head> and only
 * afterwards copies the app's global stylesheets, so any `@page` rule living in
 * global CSS would win the cascade and silently override the orientation chosen
 * here. Orientation must therefore be set exclusively through this helper and
 * `@page` must never appear in `src/styles/global/index.css` or `src/styles/global/printDoc.css`.
 */
export const buildPrintPageStyle = (
  orientation: PrintOrientation = 'portrait',
  margins?: PageMargins,
  size: 'A4' | 'A5' | 'Letter' = 'A4'
): string => {
  const marginString = margins
    ? `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`
    : PRINT_PAGE_MARGIN;

  return `
  @page {
    size: ${size} ${orientation};
    margin: ${marginString};
  }
  @media print {
    body {
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;
};

const toDate = (value?: string | number | Date | null): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** `05 Mar 2026` — the date format used on every printed document. */
export const formatPrintDate = (value?: string | number | Date | null): string => {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** `05 Mar 2026` — the date format used on every printed document. */
export const formatPrintDateDDMMYY = (value?: string | number | Date | null): string => {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** `05 Mar 2026 – 12 Mar 2026` for report period metadata. */
export const formatPrintPeriod = (
  start?: string | number | Date | null,
  end?: string | number | Date | null
): string => `${formatPrintDate(start)} – ${formatPrintDate(end)}`;

/** Flexible amount formatter on printed financial documents. */
export const formatPrintAmount = (
  value?: number | null,
  currency: string = '₹',
  locale: string = 'en-IN'
): string => `${currency}${(Number(value) || 0).toLocaleString(locale)}`;
