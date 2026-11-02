import React, { useEffect, useRef } from 'react';
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
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !barcodeVal) return;
    try {
      JsBarcode(svgRef.current, barcodeVal, {
        format: barcodeData?.format === 'CODE39' ? 'CODE39' : 'CODE128',
        height: section.heightPx || 38,
        displayValue: false,
        margin: 0,
      });
    } catch (err) {
      console.warn('[DocForge] Barcode rendering error:', err);
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
        <svg ref={svgRef} className="print-doc__barcode-svg" />
        {barcodeData?.label && (
          <p className="text-[10px] font-mono tracking-wider text-slate-700 mt-0.5">
            {barcodeData.label}
          </p>
        )}
      </div>
    </div>
  );
};
