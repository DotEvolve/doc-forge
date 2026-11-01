import React from 'react';
import { HeaderSectionType } from '../types';
import { DataDocMetadata, DataDocUnit } from '../dataDoc';

export interface HeaderSectionProps {
  section: HeaderSectionType;
  metadata: DataDocMetadata;
  unit?: DataDocUnit;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ section, metadata, unit }) => {
  if (section.visible === false) return null;

  const showTenant = section.showTenantName !== false && Boolean(metadata.tenantName);
  const showTitle = section.showTitle !== false;
  const showSubtitle = section.showSubtitle !== false && Boolean(metadata.subtitle);
  const showDocNum = section.showDocumentNumber !== false && Boolean(metadata.documentNumber);
  const showDate = section.showDate !== false && Boolean(metadata.documentDate);
  const displayTitle = unit?.unitTitle || metadata.documentTitle;

  const hasStepsTable = Boolean(unit?.tables?.steps);
  const showJobNoInTitle = showDocNum && !hasStepsTable;

  const borderStyle = section.showBorder === false ? { borderBottom: 'none' } : undefined;

  const dateLabel = section.dateLabel || (unit ? 'Date' : 'Printed on');

  const docNumberPrefix =
    section.documentNumberLabel !== undefined ? section.documentNumberLabel : '#';
  // If prefix ends with '#' or whitespace (e.g. "Job #", "#", "Ref: "), omit the space
  // so it renders as "Job #10842" or "#10842". For word labels without delimiters (e.g. "Invoice"),
  // insert a space to render as "Invoice 10842".
  const docNumberText = docNumberPrefix
    ? `${docNumberPrefix}${docNumberPrefix.endsWith(' ') || docNumberPrefix.endsWith('#') ? '' : ' '}${metadata.documentNumber}`
    : metadata.documentNumber;

  return (
    <header className="print-doc__header" style={borderStyle}>
      <div className="print-doc__slip-head">
        {showTenant && <p className="print-doc__tenant">{metadata.tenantName}</p>}
        {showTitle && (
          <p className="print-doc__title print-doc__slip-title">
            {displayTitle}
            {showJobNoInTitle && (
              <span className="print-doc__slip-job-no font-mono text-sm text-slate-600 font-normal">
                {' '}
                &nbsp;|&nbsp; {docNumberText}
              </span>
            )}
          </p>
        )}
        {showSubtitle && <p className="print-doc__subtitle">{metadata.subtitle}</p>}
      </div>
      {showDate && (
        <div className="print-doc__printed print-doc__slip-meta">
          <p>{dateLabel}</p>
          <p>{metadata.documentDate}</p>
        </div>
      )}
    </header>
  );
};
