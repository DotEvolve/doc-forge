import {
  PageMargins,
  PageOrientation,
  PageSetup,
  ReportStyles,
  ReportTemplateDescriptor,
} from './types';

/**
 * Computes root scoped CSS Custom Properties from a ReportTemplateDescriptor.
 * All generated variables are prefixed with `--doc-*` (and mirrored to `--report-*`
 * for backward compatibility with existing styles).
 */
export function computeReportStyleVariables(
  descriptor: ReportTemplateDescriptor
): Record<string, string> {
  const { page, styles } = descriptor;
  const margins = page.margins;
  const orientation = page.orientation;

  // Compute orientation-aware physical printable dimensions
  const isA5 = page.size === 'A5';
  const isLetter = page.size === 'Letter';
  const rawWidth = isA5 ? 148 : isLetter ? 216 : 210;
  const rawHeight = isA5 ? 210 : isLetter ? 279 : 297;
  const sheetWidthMm = orientation === 'landscape' ? rawHeight : rawWidth;
  const sheetHeightMm = orientation === 'landscape' ? rawWidth : rawHeight;
  const contentWidthMm = Math.max(50, sheetWidthMm - margins.left - margins.right);

  const contentHeightMm = Math.max(80, sheetHeightMm - margins.top - margins.bottom);
  // Single-slip layout includes 4mm vertical tolerance against subpixel rounding or browser print margins
  const singleSlipMinHeightMm = Math.max(80, contentHeightMm - 4);
  // Two-slip layout shares the content height less the cut divider (~11mm)
  const slipMinHeightMm = Math.max(60, Math.floor((contentHeightMm - 11) / 2));

  const portraitContentWidthMm = Math.max(50, rawWidth - margins.left - margins.right);
  const landscapeContentWidthMm = Math.max(50, rawHeight - margins.left - margins.right);

  const baseFontSizePt = styles.fontSizePt || (descriptor.slug === 'job-slip' ? 11 : 9);

  const vars: Record<string, string> = {
    // Canonical DocForge variables
    '--doc-sheet-width-mm': `${sheetWidthMm}mm`,
    '--doc-sheet-height-mm': `${sheetHeightMm}mm`,
    '--doc-page-margin-top': `${margins.top}mm`,
    '--doc-page-margin-right': `${margins.right}mm`,
    '--doc-page-margin-bottom': `${margins.bottom}mm`,
    '--doc-page-margin-left': `${margins.left}mm`,
    '--doc-content-width-mm': `${contentWidthMm}mm`,
    '--doc-content-width-portrait-mm': `${portraitContentWidthMm}mm`,
    '--doc-content-width-landscape-mm': `${landscapeContentWidthMm}mm`,
    '--doc-content-height-mm': `${contentHeightMm}mm`,
    '--doc-single-slip-min-height-mm': `${singleSlipMinHeightMm}mm`,
    '--doc-slip-min-height-mm': `${slipMinHeightMm}mm`,
    '--doc-primary-color': styles.primaryColor || '#000000',
    '--doc-accent-color': styles.accentColor || '#1e293b',
    '--doc-header-bg': styles.headerBgColor || '#e5e7eb',
    '--doc-zebra-bg': styles.zebraBgColor || '#f7f7f7',
    '--doc-font-family': styles.fontFamily || 'Arial, Helvetica, sans-serif',
    '--doc-font-size': `${baseFontSizePt}pt`,
    '--doc-line-height': `${styles.lineHeight || 1.3}`,

    // Mirrored backward-compatibility variables
    '--report-sheet-width-mm': `${sheetWidthMm}mm`,
    '--report-sheet-height-mm': `${sheetHeightMm}mm`,
    '--report-page-margin-top': `${margins.top}mm`,
    '--report-page-margin-right': `${margins.right}mm`,
    '--report-page-margin-bottom': `${margins.bottom}mm`,
    '--report-page-margin-left': `${margins.left}mm`,
    '--report-content-width-mm': `${contentWidthMm}mm`,
    '--report-content-width-portrait-mm': `${portraitContentWidthMm}mm`,
    '--report-content-width-landscape-mm': `${landscapeContentWidthMm}mm`,
    '--report-content-height-mm': `${contentHeightMm}mm`,
    '--report-single-slip-min-height-mm': `${singleSlipMinHeightMm}mm`,
    '--report-slip-min-height-mm': `${slipMinHeightMm}mm`,
    '--report-primary-color': styles.primaryColor || '#000000',
    '--report-accent-color': styles.accentColor || '#1e293b',
    '--report-header-bg': styles.headerBgColor || '#e5e7eb',
    '--report-zebra-bg': styles.zebraBgColor || '#f7f7f7',
    '--report-font-family': styles.fontFamily || 'Arial, Helvetica, sans-serif',
    '--report-font-size': `${baseFontSizePt}pt`,
    '--report-line-height': `${styles.lineHeight || 1.3}`,
  };

  // Only emit typography overrides when explicitly defined
  if (styles.headingFontWeight) {
    const hw = mapFontWeight(styles.headingFontWeight);
    vars['--doc-heading-font-weight'] = hw;
    vars['--report-heading-font-weight'] = hw;
  } else if (styles.fontWeight) {
    const hw = mapFontWeight(styles.fontWeight);
    vars['--doc-heading-font-weight'] = hw;
    vars['--report-heading-font-weight'] = hw;
  }

  if (styles.subheadingFontWeight) {
    const shw = mapFontWeight(styles.subheadingFontWeight);
    vars['--doc-subheading-font-weight'] = shw;
    vars['--report-subheading-font-weight'] = shw;
  } else if (styles.fontWeight) {
    const shw = mapFontWeight(styles.fontWeight);
    vars['--doc-subheading-font-weight'] = shw;
    vars['--report-subheading-font-weight'] = shw;
  }

  if (styles.bodyFontWeight) {
    const bw = mapFontWeight(styles.bodyFontWeight);
    vars['--doc-body-font-weight'] = bw;
    vars['--report-body-font-weight'] = bw;
  } else if (styles.fontWeight) {
    const bw = mapFontWeight(styles.fontWeight);
    vars['--doc-body-font-weight'] = bw;
    vars['--report-body-font-weight'] = bw;
  }

  if (styles.fontWeight) {
    const fw = mapFontWeight(styles.fontWeight);
    vars['--doc-font-weight'] = fw;
    vars['--report-font-weight'] = fw;
  }

  if (styles.cellPadding) {
    const paddingVal = mapCellPadding(styles.cellPadding, descriptor.slug);
    vars['--doc-cell-padding'] = paddingVal;
    vars['--report-cell-padding'] = paddingVal;
  }

  if (styles.headerFontSizePt) {
    vars['--doc-header-font-size'] = `${styles.headerFontSizePt}pt`;
    vars['--report-header-font-size'] = `${styles.headerFontSizePt}pt`;
  }
  if (styles.subheadingFontSizePt) {
    vars['--doc-subheading-font-size'] = `${styles.subheadingFontSizePt}pt`;
    vars['--report-subheading-font-size'] = `${styles.subheadingFontSizePt}pt`;
  }
  if (styles.tableFontSizePt) {
    vars['--doc-table-font-size'] = `${styles.tableFontSizePt}pt`;
    vars['--report-table-font-size'] = `${styles.tableFontSizePt}pt`;
  }
  if (styles.qtyFontSizePt) {
    vars['--doc-qty-font-size'] = `${styles.qtyFontSizePt}pt`;
    vars['--report-qty-font-size'] = `${styles.qtyFontSizePt}pt`;
  }
  if (styles.qtyFontWeight) {
    const qfw = mapFontWeight(styles.qtyFontWeight);
    vars['--doc-qty-font-weight'] = qfw;
    vars['--report-qty-font-weight'] = qfw;
  }
  if (styles.metaFontSizePt) {
    vars['--doc-meta-font-size'] = `${styles.metaFontSizePt}pt`;
    vars['--report-meta-font-size'] = `${styles.metaFontSizePt}pt`;
  }

  return vars;
}

function mapFontWeight(weight?: string): string {
  if (!weight) return '400';
  switch (weight) {
    case 'medium':
    case '500':
      return '500';
    case 'semibold':
    case '600':
      return '600';
    case 'bold':
    case '700':
      return '700';
    case 'normal':
    case '400':
    default:
      return '400';
  }
}

function mapCellPadding(density?: string, slug?: string): string {
  switch (density) {
    case 'compact':
      return '1.5px 3px';
    case 'relaxed':
      return '4px 7px';
    case 'normal':
    default:
      return slug === 'job-slip' ? '2px 4px' : '3px 5px';
  }
}

/**
 * Generates dynamic @page print CSS rules from orientation and margins.
 * Perfectly integrates with react-to-print or browser print iframes.
 */
export function buildDynamicPrintPageStyle(
  orientation: PageOrientation = 'portrait',
  margins?: PageMargins,
  size: 'A4' | 'A5' | 'Letter' = 'A4'
): string {
  const top = margins?.top ?? 10;
  const right = margins?.right ?? 10;
  const bottom = margins?.bottom ?? 10;
  const left = margins?.left ?? 18; // Default 18mm left filing margin

  return `@page { size: ${size} ${orientation}; margin: ${top}mm ${right}mm ${bottom}mm ${left}mm; }`;
}

/**
 * Shorthand helper to generate scoped report CSS variables from styles and page setup.
 */
export function generateReportCssVariables(
  styles: ReportStyles,
  page: PageSetup,
  slug: string = 'job-slip'
): Record<string, string> {
  return computeReportStyleVariables({
    slug,
    name: 'Dynamic Report',
    version: 1,
    page,
    styles,
    sections: [],
  });
}
