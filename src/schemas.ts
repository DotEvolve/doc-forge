/**
 * DocForge: Declarative Document & Print Engine — Zod Schemas & Normalization Shim
 */

import { z } from 'zod';
import { ReportTemplateDescriptor } from './types';

export const PageSizeSchema = z.enum(['A4', 'A5', 'Letter']);
export const PageOrientationSchema = z.enum(['portrait', 'landscape']);

export const PageMarginsSchema = z.object({
  top: z
    .number()
    .min(5, 'Top margin must be at least 5mm')
    .max(50, 'Top margin cannot exceed 50mm')
    .default(10),
  right: z
    .number()
    .min(5, 'Right margin must be at least 5mm')
    .max(50, 'Right margin cannot exceed 50mm')
    .default(10),
  bottom: z
    .number()
    .min(5, 'Bottom margin must be at least 5mm')
    .max(50, 'Bottom margin cannot exceed 50mm')
    .default(10),
  left: z
    .number()
    .min(5, 'Left margin must be at least 5mm')
    .max(50, 'Left margin cannot exceed 50mm')
    .default(18), // 18mm filing margin
});

export const PageSetupSchema = z.object({
  size: PageSizeSchema.default('A4'),
  orientation: PageOrientationSchema.default('portrait'),
  margins: PageMarginsSchema,
  slipsPerSheet: z.union([z.literal(1), z.literal(2)]).optional(),
  showCutLine: z.boolean().default(true),
  cutLineText: z.string().optional(),
});

export const FontWeightSchema = z.enum([
  'normal',
  'medium',
  'semibold',
  'bold',
  '400',
  '500',
  '600',
  '700',
]);

export const CellPaddingDensitySchema = z.enum(['compact', 'normal', 'relaxed']);

export const ReportStylesSchema = z.object({
  primaryColor: z.string().default('#0f172a'),
  accentColor: z.string().default('#4f46e5'),
  headerBgColor: z.string().default('#f8fafc'),
  zebraBgColor: z.string().default('#f1f5f9'),
  fontFamily: z.string().min(1).default('Inter, -apple-system, sans-serif'),
  fontSizePt: z.number().min(6).max(18).default(9),
  lineHeight: z.number().min(1).max(2).default(1.3),
  compact: z.boolean().optional(),
  fontWeight: FontWeightSchema.optional(),
  headingFontWeight: FontWeightSchema.optional(),
  subheadingFontWeight: FontWeightSchema.optional(),
  bodyFontWeight: FontWeightSchema.optional(),
  cellPadding: CellPaddingDensitySchema.optional(),
  headerFontSizePt: z.number().min(6).max(28).optional(),
  subheadingFontSizePt: z.number().min(6).max(28).optional(),
  tableFontSizePt: z.number().min(6).max(18).optional(),
  qtyFontSizePt: z.number().min(6).max(20).optional(),
  qtyFontWeight: FontWeightSchema.optional(),
  metaFontSizePt: z.number().min(6).max(16).optional(),
});

// ---------------------------------------------------------------------------
// Section Schemas
// ---------------------------------------------------------------------------

export const SectionTypeSchema = z.enum([
  'header',
  'key-value-grid',
  'table',
  'barcode',
  'divider',
  'notes',
  'footer',
]);

export const BaseSectionSchema = z.object({
  id: z.string(),
  type: SectionTypeSchema,
  visible: z.boolean().default(true),
  pageBreakBefore: z.boolean().default(false),
  pageBreakAfter: z.boolean().default(false),
});

export const HeaderSectionSchema = BaseSectionSchema.extend({
  type: z.literal('header'),
  showTenantName: z.boolean().default(true),
  showTitle: z.boolean().default(true),
  showSubtitle: z.boolean().default(true),
  showDocumentNumber: z.boolean().default(true),
  documentNumberLabel: z.string().optional(),
  showDate: z.boolean().default(true),
  dateLabel: z.string().optional(),
  showBorder: z.boolean().default(true),
});

export const KeyValueGridSectionSchema = BaseSectionSchema.extend({
  type: z.literal('key-value-grid'),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(4),
  fields: z.array(
    z.object({
      sourceKey: z.string(),
      label: z.string(),
    })
  ),
});

export const TableSectionSchema = BaseSectionSchema.extend({
  type: z.literal('table'),
  tableKey: z.string(),
  showBorder: z.boolean().default(true),
  zebraStriping: z.boolean().default(true),
  repeatHeaderOnPageBreak: z.boolean().default(true),
  suppressDuplicates: z.union([z.boolean(), z.array(z.string())]).optional(),
  hiddenColumns: z.array(z.string()).optional(),
  groupKey: z.string().optional(),
});

export const BarcodeSectionSchema = BaseSectionSchema.extend({
  type: z.literal('barcode'),
  barcodeKey: z.string(),
  heightPx: z.number().min(15).max(120).default(38),
  align: z.enum(['left', 'center', 'right']).default('center'),
});

export const FooterSectionSchema = BaseSectionSchema.extend({
  type: z.literal('footer'),
  showPageNumbers: z.boolean().default(true),
  showPrintedDate: z.boolean().default(true), // Date-only, no time-of-day
  customText: z.string().optional(),
});

export const DocumentSectionSchema = z.discriminatedUnion('type', [
  HeaderSectionSchema,
  KeyValueGridSectionSchema,
  TableSectionSchema,
  BarcodeSectionSchema,
  FooterSectionSchema,
  BaseSectionSchema.extend({
    type: z.literal('divider'),
    style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  }),
  BaseSectionSchema.extend({
    type: z.literal('notes'),
    title: z.string().optional(),
    contentKey: z.string().optional(),
  }),
]);

export const ReportTemplateDescriptorSchema = z
  .object({
    id: z.string().optional(),
    slug: z.string().min(1, 'Slug is required'),
    name: z.string().min(1, 'Name is required'),
    version: z.number().int().min(1).default(1),
    page: PageSetupSchema,
    styles: ReportStylesSchema,
    sections: z.array(DocumentSectionSchema).default([]),
    options: z.record(z.string(), z.any()).optional(),
    custom: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()
  .refine(
    (desc: any) => {
      const defaultSlips = desc.slug === 'job-slip' ? 2 : 1;
      const slipsPerSheet =
        desc.page?.slipsPerSheet ??
        (desc.jobSlipOptions ?? desc.jobSlip)?.slipsPerSheet ??
        defaultSlips;
      const isTwoSlip = slipsPerSheet === 2;
      if (isTwoSlip) {
        const top = desc.page?.margins?.top ?? 0;
        const bottom = desc.page?.margins?.bottom ?? 0;
        return top + bottom <= 31;
      }
      return true;
    },
    {
      message:
        'Combined top and bottom margins cannot exceed 31mm for 2-slip-per-sheet layout (A5-in-A4) to prevent page overflow',
      path: ['page', 'margins', 'top'],
    }
  );

// ---------------------------------------------------------------------------
// Normalization Shim: bridges legacy flat descriptors to section blueprints
// ---------------------------------------------------------------------------

export function normalizeTemplateDescriptor(rawDesc: any): ReportTemplateDescriptor {
  if (!rawDesc || typeof rawDesc !== 'object') {
    throw new Error('[DocForge] normalizeTemplateDescriptor received invalid descriptor object.');
  }

  // 1. If already contains non-empty sections, validate safely while syncing slipsPerSheet
  if (Array.isArray(rawDesc.sections) && rawDesc.sections.length > 0) {
    const defaultSlips = rawDesc.slug === 'job-slip' ? 2 : 1;
    const slipsPerSheet =
      (rawDesc.jobSlipOptions ?? rawDesc.jobSlip)?.slipsPerSheet ??
      rawDesc.page?.slipsPerSheet ??
      defaultSlips;

    const adjustedSections = rawDesc.sections.map((sec: any) => {
      if (
        sec &&
        sec.type === 'header' &&
        sec.documentNumberLabel === undefined &&
        rawDesc.slug === 'job-slip'
      ) {
        return {
          ...sec,
          documentNumberLabel: 'Job #',
        };
      }
      return sec;
    });

    const adjusted = {
      ...rawDesc,
      sections: adjustedSections,
      page: {
        ...(rawDesc.page || {}),
        slipsPerSheet,
      },
      ...(rawDesc.jobSlipOptions
        ? {
            jobSlipOptions: {
              ...rawDesc.jobSlipOptions,
              slipsPerSheet,
            },
          }
        : {}),
    };
    const parsed = ReportTemplateDescriptorSchema.safeParse(adjusted);
    if (parsed.success) {
      return parsed.data;
    }
    // Do not fall back to legacy section synthesis when sections are explicitly present!
    throw new Error(
      `[DocForge] TemplateDescriptor validation failed: ${parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
    );
  }

  // 2. Synthesize sections from legacy fields
  const sections: any[] = [];

  // 2.1 Header section
  sections.push({
    id: 'header-sec',
    type: 'header',
    visible: true,
    showTenantName: Boolean(rawDesc.header?.tenantName ?? true),
    showTitle: Boolean(rawDesc.header?.title ?? true),
    showSubtitle: Boolean(rawDesc.header?.subtitle ?? true),
    showDocumentNumber: true,
    documentNumberLabel: rawDesc.slug === 'job-slip' ? 'Job #' : '#',
    showDate: rawDesc.header?.showDate ?? true,
    showBorder: rawDesc.header?.showBorder ?? true,
  });

  // 2.2 Key-Value Summary Grid
  if (Array.isArray(rawDesc.metaFields) && rawDesc.metaFields.length > 0) {
    sections.push({
      id: 'meta-sec',
      type: 'key-value-grid',
      visible: true,
      columns: 4,
      fields: rawDesc.metaFields.map((f: any) => ({
        sourceKey: f.id,
        label: f.label,
      })),
    });
  }

  // 2.3 Tables
  if (rawDesc.slug === 'job-slip') {
    sections.push({
      id: 'steps-table',
      type: 'table',
      tableKey: 'steps',
      visible: (rawDesc.jobSlipOptions ?? rawDesc.jobSlip)?.showWorkerTable ?? true,
      showBorder: true,
      zebraStriping: true,
    });
    sections.push({
      id: 'global-attrs-table',
      type: 'table',
      tableKey: 'globalAttributes',
      visible: true,
      showBorder: true,
      zebraStriping: false,
    });
    sections.push({
      id: 'sizes-table',
      type: 'table',
      tableKey: 'sizes',
      visible: true,
      showBorder: true,
      zebraStriping: true,
    });
  } else if (Array.isArray(rawDesc.tables)) {
    rawDesc.tables.forEach((t: any) => {
      sections.push({
        id: t.id || 'table-sec',
        type: 'table',
        tableKey: t.id || 'main',
        visible: true,
        showBorder: true,
        zebraStriping: t.zebra ?? true,
      });
    });
  }

  // 2.5 Footer
  sections.push({
    id: 'footer-sec',
    type: 'footer',
    visible: true,
    showPageNumbers: rawDesc.footer?.showPageNumbers ?? true,
    showPrintedDate: rawDesc.footer?.showPrintedAt ?? true,
    customText: rawDesc.footer?.customNote,
  });

  // Default slipsPerSheet: 2 for job-slip, 1 for standard reports
  const defaultSlips = rawDesc.slug === 'job-slip' ? 2 : 1;
  const slipsPerSheet =
    (rawDesc.jobSlipOptions ?? rawDesc.jobSlip)?.slipsPerSheet ??
    rawDesc.page?.slipsPerSheet ??
    defaultSlips;

  const merged = {
    ...rawDesc,
    sections,
    ...(rawDesc.jobSlipOptions
      ? {
          jobSlipOptions: {
            ...rawDesc.jobSlipOptions,
            slipsPerSheet,
          },
        }
      : {}),
    page: {
      size: rawDesc.page?.size ?? 'A4',
      orientation: rawDesc.page?.orientation ?? 'portrait',
      margins: {
        top: rawDesc.page?.margins?.top ?? 10,
        right: rawDesc.page?.margins?.right ?? 10,
        bottom: rawDesc.page?.margins?.bottom ?? 10,
        left: rawDesc.page?.margins?.left ?? 18,
      },
      slipsPerSheet,
      showCutLine: rawDesc.page?.showCutLine ?? true,
      cutLineText: rawDesc.page?.cutLineText,
    },
    styles: {
      primaryColor: rawDesc.styles?.primaryColor ?? '#0f172a',
      accentColor: rawDesc.styles?.accentColor ?? '#4f46e5',
      headerBgColor: rawDesc.styles?.headerBgColor ?? '#f8fafc',
      zebraBgColor: rawDesc.styles?.zebraBgColor ?? '#f1f5f9',
      fontFamily: rawDesc.styles?.fontFamily ?? 'Inter, -apple-system, sans-serif',
      fontSizePt: rawDesc.styles?.fontSizePt ?? 9,
      lineHeight: rawDesc.styles?.lineHeight ?? 1.3,
      fontWeight: rawDesc.styles?.fontWeight,
      headingFontWeight: rawDesc.styles?.headingFontWeight,
      subheadingFontWeight: rawDesc.styles?.subheadingFontWeight,
      bodyFontWeight: rawDesc.styles?.bodyFontWeight,
      headerFontSizePt: rawDesc.styles?.headerFontSizePt,
      subheadingFontSizePt: rawDesc.styles?.subheadingFontSizePt,
      tableFontSizePt: rawDesc.styles?.tableFontSizePt,
      qtyFontSizePt: rawDesc.styles?.qtyFontSizePt,
      qtyFontWeight: rawDesc.styles?.qtyFontWeight,
      metaFontSizePt: rawDesc.styles?.metaFontSizePt,
      cellPadding: rawDesc.styles?.cellPadding,
      compact: rawDesc.styles?.compact,
    },
  };

  const parsed = ReportTemplateDescriptorSchema.safeParse(merged);
  if (!parsed.success) {
    console.warn('[DocForge] normalizeTemplateDescriptor warnings:', parsed.error.format());
    return merged as ReportTemplateDescriptor;
  }
  return parsed.data;
}
