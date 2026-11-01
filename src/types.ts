/**
 * DocForge: Declarative Document & Print Engine — Core Types
 *
 * Designed to be 100% portable to @dotevolve/doc-forge.
 * Contains zero imports from floorix-specific models or endpoints.
 */

export type ReportCellValue = string | number | boolean | null;

export type PageSize = 'A4' | 'A5' | 'Letter';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageMargins {
  /** Top margin in millimetres (5mm – 50mm) */
  top: number;
  /** Right margin in millimetres (5mm – 50mm) */
  right: number;
  /** Bottom margin in millimetres (5mm – 50mm) */
  bottom: number;
  /** Left filing margin in millimetres (5mm – 50mm; default 18mm) */
  left: number;
}

export interface PageSetup {
  size: PageSize;
  orientation: PageOrientation;
  margins: PageMargins;
  slipsPerSheet?: 1 | 2;
  showCutLine?: boolean;
  cutLineText?: string;
}

export type CellPaddingDensity = 'compact' | 'normal' | 'relaxed';
export type FontWeightOption =
  'normal' | 'medium' | 'semibold' | 'bold' | '400' | '500' | '600' | '700';

export interface ReportStyles {
  primaryColor: string;
  accentColor: string;
  headerBgColor: string;
  zebraBgColor: string;
  fontFamily: string;
  fontSizePt: number;
  lineHeight: number;
  compact?: boolean;
  fontWeight?: FontWeightOption;
  headingFontWeight?: FontWeightOption;
  subheadingFontWeight?: FontWeightOption;
  bodyFontWeight?: FontWeightOption;
  cellPadding?: CellPaddingDensity;
  headerFontSizePt?: number;
  subheadingFontSizePt?: number;
  tableFontSizePt?: number;
  qtyFontSizePt?: number;
  qtyFontWeight?: FontWeightOption;
  metaFontSizePt?: number;
}

// ---------------------------------------------------------------------------
// Generic Section Blueprints
// ---------------------------------------------------------------------------

export type SectionType =
  'header' | 'key-value-grid' | 'table' | 'barcode' | 'divider' | 'notes' | 'footer';

export interface BaseSection {
  id: string;
  type: SectionType;
  visible?: boolean;
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
}

export interface HeaderSectionSpec extends BaseSection {
  type: 'header';
  showTenantName?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showDocumentNumber?: boolean;
  documentNumberLabel?: string;
  showDate?: boolean;
  dateLabel?: string;
  showBorder?: boolean;
}

export interface KeyValueFieldSpec {
  sourceKey: string;
  label: string;
}

export interface KeyValueGridSectionSpec extends BaseSection {
  type: 'key-value-grid';
  columns?: 2 | 3 | 4;
  fields: KeyValueFieldSpec[];
}

export interface TableSectionSpec extends BaseSection {
  type: 'table';
  tableKey: string;
  showBorder?: boolean;
  zebraStriping?: boolean;
  repeatHeaderOnPageBreak?: boolean;
  suppressDuplicates?: boolean | string[];
  hiddenColumns?: string[];
  /** Optional grouping key (e.g. 'article', 'sku', 'category') for hierarchical duplicate suppression */
  groupKey?: string;
}

export interface BarcodeSectionSpec extends BaseSection {
  type: 'barcode';
  barcodeKey: string;
  heightPx?: number;
  align?: 'left' | 'center' | 'right';
}

export interface DividerSectionSpec extends BaseSection {
  type: 'divider';
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface NotesSectionSpec extends BaseSection {
  type: 'notes';
  title?: string;
  contentKey?: string;
}

export interface FooterSectionSpec extends BaseSection {
  type: 'footer';
  showPageNumbers?: boolean;
  showPrintedDate?: boolean; // Date-only format ("Printed on 20 Oct 2026"), no time-of-day
  customText?: string;
}

export type DocumentSection =
  | HeaderSectionSpec
  | KeyValueGridSectionSpec
  | TableSectionSpec
  | BarcodeSectionSpec
  | DividerSectionSpec
  | NotesSectionSpec
  | FooterSectionSpec;

export type HeaderSectionType = HeaderSectionSpec;
export type KeyValueGridSectionType = KeyValueGridSectionSpec;
export type TableSectionType = TableSectionSpec;
export type BarcodeSectionType = BarcodeSectionSpec;
export type DividerSectionType = DividerSectionSpec;
export type NotesSectionType = NotesSectionSpec;
export type FooterSectionType = FooterSectionSpec;

export interface ReportTemplateDescriptor {
  id?: string;
  slug: string;
  name: string;
  version: number;
  page: PageSetup;
  styles: ReportStyles;
  sections?: DocumentSection[];
  options?: Record<string, any>;
  custom?: Record<string, any>;
  jobSlip?: Record<string, any>;
  jobSlipOptions?: Record<string, any>;
}
