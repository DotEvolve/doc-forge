import React from 'react';
import { DataDoc, DataDocUnit } from './dataDoc';
import { ReportTemplateDescriptor } from './types';

export interface UnitTileContainerProps {
  data: DataDoc;
  descriptor: ReportTemplateDescriptor;
  renderUnit: (unit: DataDocUnit, unitIndex: number) => React.ReactNode;
}

export const UnitTileContainer: React.FC<UnitTileContainerProps> = ({
  data,
  descriptor,
  renderUnit,
}) => {
  const slipsPerSheet = descriptor.page?.slipsPerSheet ?? 1;

  const units =
    data.units && data.units.length > 0
      ? data.units
      : [
          {
            unitId: 'default-unit',
            unitTitle: data.metadata.documentTitle,
            unitNumber: 1,
            summaries: data.summaries,
            tables: data.tables,
            barcodes: data.barcodes,
          },
        ];

  const cutLineText =
    descriptor.page?.cutLineText ||
    (descriptor.options as any)?.cutLineText ||
    '✂ Cut along this line';
  const showCutLineSetting =
    descriptor.page?.showCutLine ?? (descriptor.options as any)?.showCutLine ?? true;

  if (slipsPerSheet === 2) {
    return (
      <>
        {units.map((unit, idx) => {
          const isLast = idx === units.length - 1;
          const showCutLine = showCutLineSetting && idx % 2 === 0 && !isLast;

          return (
            <React.Fragment key={unit.unitId || `unit-${idx}`}>
              <section className="print-doc__slip">{renderUnit(unit, idx)}</section>
              {showCutLine && (
                <div className="print-doc__slip-cut" aria-hidden="true">
                  <span>{cutLineText}</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </>
    );
  }

  // 1-Up: Each unit occupies a standard page/sheet
  return (
    <>
      {units.map((unit, idx) => {
        const isLast = idx === units.length - 1;
        return (
          <div
            key={unit.unitId || `unit-${idx}`}
            className={isLast ? undefined : 'break-after-page'}
            style={isLast ? undefined : { pageBreakAfter: 'always', breakAfter: 'page' }}
          >
            {renderUnit(unit, idx)}
          </div>
        );
      })}
    </>
  );
};
