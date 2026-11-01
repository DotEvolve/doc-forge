import React from 'react';
import { DocumentSection, ReportTemplateDescriptor } from '../types';
import { DataDoc, DataDocUnit } from '../dataDoc';
import { HeaderSection } from './HeaderSection';
import { KeyValueGridSection } from './KeyValueGridSection';
import { TableSection } from './TableSection';
import { BarcodeSection } from './BarcodeSection';
import { DividerSection } from './DividerSection';
import { NotesSection } from './NotesSection';
import { FooterSection } from './FooterSection';

export interface SectionDispatcherProps {
  section: DocumentSection;
  data: DataDoc;
  unit?: DataDocUnit;
  descriptor?: ReportTemplateDescriptor;
}

export const SectionDispatcher: React.FC<SectionDispatcherProps> = ({
  section,
  data,
  unit,
  descriptor,
}) => {
  if (section.visible === false) return null;

  const pageBreakBefore = section.pageBreakBefore ? 'break-before-page' : '';
  const pageBreakAfter = section.pageBreakAfter ? 'break-after-page' : '';
  const wrapperClass = `${pageBreakBefore} ${pageBreakAfter}`.trim();

  const renderContent = () => {
    switch (section.type) {
      case 'header':
        return <HeaderSection section={section} metadata={data.metadata} unit={unit} />;
      case 'key-value-grid':
        return <KeyValueGridSection section={section} data={data} unit={unit} />;
      case 'table':
        return <TableSection section={section} data={data} unit={unit} descriptor={descriptor} />;
      case 'barcode':
        return <BarcodeSection section={section} data={data} unit={unit} />;
      case 'divider':
        return <DividerSection section={section} />;
      case 'notes':
        return <NotesSection section={section} data={data} unit={unit} />;
      case 'footer':
        return <FooterSection section={section} metadata={data.metadata} />;
      default:
        return null;
    }
  };

  if (!wrapperClass) {
    return renderContent();
  }

  return <div className={wrapperClass}>{renderContent()}</div>;
};
