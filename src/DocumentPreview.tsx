import React, { useState, useMemo } from 'react';
import { ReportTemplateDescriptor } from './types';
import { DataDoc } from './dataDoc';
import { normalizeTemplateDescriptor } from './schemas';
import { computeReportStyleVariables } from './reportStyleBridge';
import { DocumentRenderer } from './DocumentRenderer';

export interface DocumentPreviewProps {
  descriptor: ReportTemplateDescriptor;
  /** Optional custom preview data document */
  data?: DataDoc;
  /** Initial zoom level (e.g. 0.85 = 85%) */
  initialZoom?: number;
  /** Whether to show the top zoom and guide toolbar */
  showToolbar?: boolean;
}

/**
 * High-fidelity interactive document preview canvas.
 * Simulates physical sheet dimensions, zoom controls, and filing guide overlays.
 */
export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  descriptor,
  data,
  initialZoom = 0.85,
  showToolbar = true,
}) => {
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [showGuides, setShowGuides] = useState<boolean>(true);

  const normalizedDescriptor = useMemo(() => {
    try {
      return normalizeTemplateDescriptor(descriptor);
    } catch {
      return descriptor;
    }
  }, [descriptor]);

  const styleVariables = useMemo(() => {
    return computeReportStyleVariables(normalizedDescriptor);
  }, [normalizedDescriptor]);

  const isLandscape = normalizedDescriptor.page.orientation === 'landscape';
  const isA5 = normalizedDescriptor.page.size === 'A5';
  const isLetter = normalizedDescriptor.page.size === 'Letter';
  const rawW = isA5 ? 148 : isLetter ? 216 : 210;
  const rawH = isA5 ? 210 : isLetter ? 279 : 297;
  const sheetWidthMm = isLandscape ? rawH : rawW;
  const sheetHeightMm = isLandscape ? rawW : rawH;

  // Fallback sample DataDoc if caller provided no data
  const effectiveDataDoc: DataDoc = useMemo(() => {
    if (data) return data;

    return {
      metadata: {
        tenantName: 'Sample Organization',
        documentTitle: normalizedDescriptor.name || 'Sample Document',
        documentNumber: 'DOC-2026',
        documentDate: '20 Oct 2026',
        subtitle: 'Document Preview',
      },
      summaries: {
        documentNumber: 'DOC-2026',
        itemCode: 'ITEM-01',
        itemName: 'Sample Item',
        totalQuantity: 120,
        documentDate: '20 Oct 2026',
        status: 'Active',
      },
      tables: {
        sizes: {
          columns: [
            { key: 'item', label: 'Item', widthPct: 30 },
            { key: 'col_a', label: 'Metric A', widthPct: 20, align: 'right' },
            { key: 'col_b', label: 'Metric B', widthPct: 20, align: 'right' },
            { key: 'total', label: 'Total', widthPct: 30, align: 'right' },
          ],
          rows: [
            { item: 'Item Alpha', col_a: 20, col_b: 40, total: 60 },
            { item: 'Item Beta', col_a: 30, col_b: 30, total: 60 },
          ],
          footerRow: {
            item: 'Total',
            col_a: 50,
            col_b: 70,
            total: 120,
          },
          emptyMessage: 'No items.',
        },
        main: {
          columns: [
            { key: 'code', label: 'Item Code', widthPct: 25 },
            { key: 'description', label: 'Description', widthPct: 45 },
            { key: 'qty', label: 'Quantity', widthPct: 30, align: 'right' },
          ],
          rows: [
            { code: 'ITEM-01', description: 'Primary Component Item', qty: 250 },
            { code: 'ITEM-02', description: 'Secondary Component Item', qty: 500 },
          ],
          emptyMessage: 'No records found.',
        },
      },
      barcodes: {
        jobNumber: {
          value: 'DOC-2026',
          label: 'DOC-2026',
          format: 'CODE128',
        },
      },
      units: [
        {
          unitId: 'unit-1',
          unitTitle: 'Primary Copy',
          unitNumber: 1,
          summaries: {
            documentNumber: 'DOC-2026',
            itemName: 'Sample Item',
            totalQuantity: 120,
            assignee: 'Sample Assignee',
          },
        },
        ...(normalizedDescriptor.page.slipsPerSheet === 2
          ? [
              {
                unitId: 'unit-2',
                unitTitle: 'Secondary Copy',
                unitNumber: 2,
                summaries: {
                  documentNumber: 'DOC-2026',
                  itemName: 'Sample Item',
                  totalQuantity: 120,
                  assignee: 'Second Assignee',
                },
              },
            ]
          : []),
      ],
    };
  }, [data, normalizedDescriptor]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#0f172a',
        overflow: 'hidden',
      }}
    >
      {showToolbar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#1e293b',
            borderBottom: '1px solid #334155',
            color: '#e2e8f0',
            fontSize: '13px',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>{normalizedDescriptor.name}</span>
            <span
              style={{
                fontSize: '11px',
                background: '#334155',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              {normalizedDescriptor.page.size} {normalizedDescriptor.page.orientation}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Guide Overlay Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#94a3b8',
              }}
            >
              <input
                type="checkbox"
                checked={showGuides}
                onChange={(e) => setShowGuides(e.target.checked)}
                style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
              />
              Filing Guide (18mm)
            </label>

            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
                style={{
                  background: '#334155',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '4px',
                  width: '26px',
                  height: '26px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
                title="Zoom Out"
              >
                -
              </button>
              <span style={{ minWidth: '45px', textAlign: 'center', fontFamily: 'monospace' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(1))))}
                style={{
                  background: '#334155',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '4px',
                  width: '26px',
                  height: '26px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setZoom(0.85)}
                style={{
                  background: '#334155',
                  border: 'none',
                  color: '#cbd5e1',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Fit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '40px',
          background: '#090d16',
        }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Physical Sheet Simulator */}
          <div
            className="report-sheet"
            style={
              {
                width: `${sheetWidthMm}mm`,
                minHeight: `${sheetHeightMm}mm`,
                background: '#ffffff',
                color: '#000000',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 2px 8px rgba(0, 0, 0, 0.4)',
                position: 'relative',
                boxSizing: 'border-box',
                paddingTop: `${normalizedDescriptor.page.margins.top}mm`,
                paddingRight: `${normalizedDescriptor.page.margins.right}mm`,
                paddingBottom: `${normalizedDescriptor.page.margins.bottom}mm`,
                paddingLeft: `${normalizedDescriptor.page.margins.left}mm`,
                fontFamily: normalizedDescriptor.styles.fontFamily,
                fontSize: `${normalizedDescriptor.styles.fontSizePt}pt`,
                lineHeight: normalizedDescriptor.styles.lineHeight,
                ...styleVariables,
              } as React.CSSProperties
            }
          >
            {/* Printable Filing Guide Overlay */}
            {showGuides && (
              <div
                style={{
                  position: 'absolute',
                  top: `${normalizedDescriptor.page.margins.top}mm`,
                  right: `${normalizedDescriptor.page.margins.right}mm`,
                  bottom: `${normalizedDescriptor.page.margins.bottom}mm`,
                  left: `${normalizedDescriptor.page.margins.left}mm`,
                  pointerEvents: 'none',
                  border: '1px dashed rgba(59, 130, 246, 0.35)',
                  boxSizing: 'border-box',
                  zIndex: 20,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-16px',
                    left: '0',
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    color: '#3b82f6',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '1px 4px',
                    borderRadius: '2px',
                  }}
                >
                  Printable Content ({normalizedDescriptor.page.margins.left}mm filing margin)
                </div>
              </div>
            )}

            {/* Document Content */}
            <DocumentRenderer
              data={effectiveDataDoc}
              descriptor={normalizedDescriptor}
              isNormalized={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
