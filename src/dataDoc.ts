/**
 * DocForge: DataDoc Data Contract & Zod Validation Schemas
 *
 * Ground rules:
 * - Ready-Data Principle: Zero arithmetic or aggregation in the engine.
 * - All numbers, currencies, dates, and badges must be formatted beforehand.
 * - Supports single-unit documents and multi-slip unit collections (2-Up tiling).
 */

import { z } from 'zod';

export const DataDocTableColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  align: z.enum(['left', 'center', 'right']).optional(),
  /** Canonical column budget share in percent (sum <= 100) */
  widthPct: z.number().min(1).max(100).optional(),
  suppressDuplicates: z.boolean().optional(),
  /** Optional custom fallback placeholder rendered when cell is null/undefined (default: '—') */
  emptyPlaceholder: z.string().optional(),
});

export const DataDocTableSchema = z.object({
  columns: z.array(DataDocTableColumnSchema),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))),
  footerRow: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
  emptyMessage: z.string().default('No records available.'),
});

export const DataDocBarcodeSchema = z.object({
  value: z.string(),
  label: z.string().optional(),
  format: z.enum(['CODE128', 'CODE39', 'QR']).default('CODE128'),
});

/** Represents a single printable unit/slip (e.g. one step slip or one report page) */
export const DataDocUnitSchema = z.object({
  unitId: z.string(),
  unitTitle: z.string().optional(),
  unitNumber: z.number().optional(),
  summaries: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
  tables: z.record(z.string(), DataDocTableSchema).optional(),
  barcodes: z.record(z.string(), DataDocBarcodeSchema).optional(),
  attributes: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
});

export const DataDocMetadataSchema = z.object({
  tenantName: z.string().optional(),
  documentTitle: z.string().min(1),
  documentNumber: z.string().optional(),
  documentDate: z.string().optional(),
  subtitle: z.string().optional(),
  customNotes: z.array(z.string()).optional(),
});

export const DataDocSchema = z.object({
  metadata: DataDocMetadataSchema,
  /** Optional root-level summaries, tables, and barcodes shared across all units */
  summaries: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
  tables: z.record(z.string(), DataDocTableSchema).optional(),
  barcodes: z.record(z.string(), DataDocBarcodeSchema).optional(),
  /** Array of discrete printable units (supports 1-Up single docs or 2-Up multi-slip tiling) */
  units: z.array(DataDocUnitSchema),
});

export type DataDocTableColumn = z.infer<typeof DataDocTableColumnSchema>;
export type DataDocTable = z.infer<typeof DataDocTableSchema>;
export type DataDocBarcode = z.infer<typeof DataDocBarcodeSchema>;
export type DataDocUnit = z.infer<typeof DataDocUnitSchema>;
export type DataDocMetadata = z.infer<typeof DataDocMetadataSchema>;
export type DataDoc = z.infer<typeof DataDocSchema>;
