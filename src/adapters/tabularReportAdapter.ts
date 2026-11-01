import { DataDoc, DataDocTable, DataDocTableColumn, DataDocUnit } from '../dataDoc';
import { formatPrintDate } from '../print';

export interface TabularReportAdapterOptions {
  tenantName?: string;
  documentNumber?: string;
  documentDate?: string;
  subtitle?: string;
  tableKey?: string;
  emptyMessage?: string;
  footerRow?: Record<string, string | number | boolean | null>;
  meta?: Array<{ label: string; value: any }> | Record<string, any>;
}

export interface TabularColumnInput {
  key: string;
  label?: string;
  header?: string;
  width?: string;
  widthPct?: number;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'currency' | 'number' | 'date' | 'badge';
  suppressDuplicates?: boolean;
}

/**
 * Universal adapter for tabular dashboard reports (Articles, Ledger, Tasks, WorkerJobs).
 * Pre-formats all dates, currencies, and numbers into ready-data strings.
 */
export function reportToDataDoc(
  title: string,
  columns: TabularColumnInput[],
  rows: Array<Record<string, any>>,
  options: TabularReportAdapterOptions = {}
): DataDoc {
  const {
    tenantName = '',
    documentNumber,
    documentDate = formatPrintDate(new Date()),
    subtitle,
    tableKey = 'main',
    emptyMessage = 'No records found.',
    footerRow,
    meta,
  } = options;

  // Flatten meta into summaries record
  const summaries: Record<string, string | number> = {};
  if (Array.isArray(meta)) {
    for (const m of meta) {
      if (m && m.label) {
        summaries[m.label] = String(m.value ?? '');
      }
    }
  } else if (meta && typeof meta === 'object') {
    for (const [k, v] of Object.entries(meta)) {
      summaries[k] = String(v ?? '');
    }
  }

  // Parse column widthPct if given as string e.g. "15%" or number
  const parsedColumns: DataDocTableColumn[] = columns.map((col) => {
    let widthPct = col.widthPct;
    if (
      widthPct === undefined &&
      col.width &&
      typeof col.width === 'string' &&
      col.width.endsWith('%')
    ) {
      const parsed = parseFloat(col.width);
      if (!Number.isNaN(parsed)) {
        widthPct = parsed;
      }
    }

    return {
      key: col.key,
      label: col.label || col.header || col.key,
      align: col.align || 'left',
      widthPct,
      suppressDuplicates: col.suppressDuplicates,
    };
  });

  // Pre-format cell values into string or number (Ready-Data Principle)
  const formattedRows = rows.map((row) => {
    const formatted: Record<string, string | number | boolean | null> = {};
    for (const col of columns) {
      const rawVal = row[col.key];
      if (rawVal === null || rawVal === undefined) {
        formatted[col.key] = '—';
      } else if (col.format === 'currency') {
        formatted[col.key] = `₹${(Number(rawVal) || 0).toLocaleString('en-IN')}`;
      } else if (
        col.format === 'date' &&
        (rawVal instanceof Date || typeof rawVal === 'string' || typeof rawVal === 'number')
      ) {
        formatted[col.key] = formatPrintDate(rawVal);
      } else if (typeof rawVal === 'number') {
        formatted[col.key] = rawVal;
      } else {
        formatted[col.key] = String(rawVal);
      }
    }
    return formatted;
  });

  const mainTable: DataDocTable = {
    columns: parsedColumns,
    rows: formattedRows,
    footerRow,
    emptyMessage,
  };

  const tablesMap: Record<string, DataDocTable> = {
    [tableKey]: mainTable,
    main: mainTable,
  };

  const unit: DataDocUnit = {
    unitId: 'report-unit-1',
    unitTitle: title,
    unitNumber: 1,
    summaries,
    tables: tablesMap,
  };

  return {
    metadata: {
      tenantName,
      documentTitle: title,
      documentNumber,
      documentDate,
      subtitle,
    },
    summaries,
    tables: tablesMap,
    units: [unit],
  };
}
