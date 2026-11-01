import React, { useMemo } from 'react';
import JsBarcode from 'jsbarcode';
import { BarcodeSectionType } from '../types';
import { DataDoc, DataDocBarcode, DataDocUnit } from '../dataDoc';

export interface BarcodeSectionProps {
  section: BarcodeSectionType;
  data: DataDoc;
  unit?: DataDocUnit;
}

export const BarcodeSection: React.FC<BarcodeSectionProps> = ({ section, data, unit }) => {
  const barcodeData = (unit?.barcodes?.[section.barcodeKey] ??
    data.barcodes?.[section.barcodeKey]) as DataDocBarcode | undefined;

  const barcodeVal = barcodeData?.value || '';

  const svgMarkup = useMemo(() => {
    if (!barcodeVal || typeof document === 'undefined') return '';
    try {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svgNode, barcodeVal, {
        format: barcodeData?.format === 'CODE39' ? 'CODE39' : 'CODE128',
        height: section.heightPx || 38,
        displayValue: false,
        margin: 0,
      });
      svgNode.setAttribute('class', 'print-doc__barcode-svg');
      return (
        svgNode.outerHTML ||
        (typeof XMLSerializer !== 'undefined' ? new XMLSerializer().serializeToString(svgNode) : '')
      );
    } catch (err) {
      console.warn('[DocForge] Barcode rendering error:', err);
      return '';
    }
  }, [barcodeVal, barcodeData?.format, section.heightPx]);

  if (section.visible === false || !barcodeVal) return null;

  const alignClass =
    section.align === 'left'
      ? 'justify-start'
      : section.align === 'right'
        ? 'justify-end'
        : 'justify-center';

  return (
    <div className={`print-doc__barcode flex ${alignClass} my-2`}>
      <div className="text-center">
        {svgMarkup ? (
          <div
            className="print-doc__barcode-container inline-block"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        ) : (
          <svg className="print-doc__barcode-svg" />
        )}
        {barcodeData?.label && (
          <p className="text-[10px] font-mono tracking-wider text-slate-700 mt-0.5">
            {barcodeData.label}
          </p>
        )}
      </div>
    </div>
  );
};
