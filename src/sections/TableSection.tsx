import React from 'react';
import { TableSectionType, ReportTemplateDescriptor } from '../types';
import { DataDoc, DataDocTable, DataDocTableColumn, DataDocUnit } from '../dataDoc';

export interface TableSectionProps {
  section: TableSectionType;
  data: DataDoc;
  unit?: DataDocUnit;
  descriptor?: ReportTemplateDescriptor;
}

const alignClass = (align?: 'left' | 'center' | 'right'): string | undefined =>
  align && align !== 'left' ? `print-doc__cell--${align}` : undefined;

export const TableSection: React.FC<TableSectionProps> = ({ section, data, unit, descriptor }) => {
  if (section.visible === false) return null;

  // Retrieve table from unit-specific tables first, then document-wide tables.
  // Fallback to 'main' for single-table reports.
  const table = (unit?.tables?.[section.tableKey] ??
    data.tables?.[section.tableKey] ??
    unit?.tables?.['main'] ??
    data.tables?.['main']) as DataDocTable | undefined;

  if (!table) {
    return null;
  }

  const { columns: rawColumns, rows, footerRow, emptyMessage } = table;

  // Resolve hidden columns from section specification or descriptor options
  const sectionHidden = (section as any).hiddenColumns || [];
  const tableKey = section.tableKey;
  const descriptorHidden =
    descriptor?.options?.tableHiddenColumns?.[tableKey] ||
    descriptor?.options?.tableHiddenColumns?.[section.id] ||
    [];
  const globalHidden = descriptor?.options?.hiddenColumns || [];

  const hasSpecificHidden =
    sectionHidden.length > 0 ||
    Boolean(descriptor?.options?.tableHiddenColumns?.[tableKey]) ||
    Boolean(descriptor?.options?.tableHiddenColumns?.[section.id]);

  const effectiveHidden = hasSpecificHidden
    ? [...new Set([...sectionHidden, ...descriptorHidden])]
    : globalHidden;

  const columns = rawColumns.filter((c) => !effectiveHidden.includes(c.key));
  const hasWidths = columns.some((c) => c.widthPct !== undefined);
  const borderClass = section.showBorder !== false ? '' : 'print-doc__table--noborder';
  const zebraClass = section.zebraStriping !== false ? '' : 'print-doc__table--nozebra';

  return (
    <table className={`print-doc__table ${borderClass} ${zebraClass}`}>
      {hasWidths && (
        <colgroup>
          {columns.map((col) => (
            <col
              key={col.key}
              style={col.widthPct !== undefined ? { width: `${col.widthPct}%` } : undefined}
            />
          ))}
        </colgroup>
      )}
      <thead
        style={
          section.repeatHeaderOnPageBreak !== false ? { display: 'table-header-group' } : undefined
        }
      >
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={alignClass(col.align)}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="print-doc__empty text-center italic text-slate-400 py-3"
            >
              {emptyMessage || 'No records available.'}
            </td>
          </tr>
        ) : (
          rows.map((row, rIdx) => (
            <tr key={`row-${rIdx}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              {columns.map((col, colIdx) => {
                const isNumericCol = (column: DataDocTableColumn, val: any) =>
                  column.align === 'right' ||
                  typeof val === 'number' ||
                  /^(total|qty|quantity|count|amount|price|cost|pairs|size_|sum_)/i.test(
                    column.key
                  );

                const isColEligibleForBoolSuppression = !isNumericCol(col, row[col.key]);

                const isSectionSuppressed =
                  (section.suppressDuplicates === true && isColEligibleForBoolSuppression) ||
                  (Array.isArray(section.suppressDuplicates) &&
                    (section.suppressDuplicates.includes(col.key) ||
                      (section.suppressDuplicates.includes('__merged') &&
                        isColEligibleForBoolSuppression)));
                const isColSuppressed = Boolean(col.suppressDuplicates);
                const suppressionActive =
                  section.suppressDuplicates !== false &&
                  (isSectionSuppressed ||
                    (section.suppressDuplicates === undefined && isColSuppressed));

                // Duplicate suppression grouping check:
                // A column can only be blanked if its primary parent/grouping entity has not changed.
                // Priority order:
                // 1. Explicitly configured descriptor property: section.groupKey (e.g. 'article', 'sku', 'category')
                // 2. Heuristic fallback: 'article' if an article column exists
                // 3. Ultimate fallback: primary first column (columns[0]?.key)
                const effectiveGroupKey =
                  (section as any).groupKey ||
                  (columns.some((c) => c.key === 'article') ? 'article' : columns[0]?.key);

                let parentGroupMatch = true;
                if (
                  suppressionActive &&
                  rIdx > 0 &&
                  effectiveGroupKey &&
                  col.key !== effectiveGroupKey
                ) {
                  if (
                    row[effectiveGroupKey] !== undefined &&
                    rows[rIdx - 1]?.[effectiveGroupKey] !== undefined
                  ) {
                    parentGroupMatch =
                      String(row[effectiveGroupKey] ?? '') ===
                      String(rows[rIdx - 1]?.[effectiveGroupKey] ?? '');
                  }
                }

                const isDupSuppressed =
                  suppressionActive &&
                  rIdx > 0 &&
                  parentGroupMatch &&
                  row[col.key] !== undefined &&
                  row[col.key] !== null &&
                  String(row[col.key]) === String(rows[rIdx - 1][col.key]);

                const cellValue = isDupSuppressed
                  ? ''
                  : row[col.key] !== undefined && row[col.key] !== null
                    ? String(row[col.key])
                    : '—';

                const numericClass = isNumericCol(col, row[col.key])
                  ? 'print-doc__cell--numeric print-doc__qty'
                  : '';
                const cellClass =
                  [alignClass(col.align), numericClass].filter(Boolean).join(' ') || undefined;

                return (
                  <td key={col.key} className={cellClass}>
                    {cellValue}
                  </td>
                );
              })}
            </tr>
          ))
        )}
      </tbody>
      {footerRow && rows.length > 0 && (
        <tfoot>
          <tr style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            {columns.map((col) => {
              const isFootNumeric =
                col.align === 'right' ||
                typeof footerRow[col.key] === 'number' ||
                /^(total|qty|quantity|count|amount|price|cost|pairs|size_|sum_)/i.test(col.key);
              const footNumericClass = isFootNumeric
                ? 'print-doc__cell--numeric print-doc__qty'
                : '';
              const footCellClass =
                [alignClass(col.align), footNumericClass].filter(Boolean).join(' ') || undefined;

              return (
                <td key={`foot-${col.key}`} className={footCellClass}>
                  {footerRow[col.key] !== undefined && footerRow[col.key] !== null
                    ? String(footerRow[col.key])
                    : ''}
                </td>
              );
            })}
          </tr>
        </tfoot>
      )}
    </table>
  );
};
