import React from 'react';
import { FooterSectionType } from '../types';
import { DataDocMetadata } from '../dataDoc';

export interface FooterSectionProps {
  section: FooterSectionType;
  metadata: DataDocMetadata;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ section, metadata }) => {
  if (section.visible === false) return null;

  const showDate = section.showPrintedDate !== false && Boolean(metadata.documentDate);
  const showPageNums = section.showPageNumbers !== false;

  return (
    <footer className="print-doc__footer mt-auto pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between items-center">
      <div>
        {section.customText ? <p>{section.customText}</p> : null}
        {showDate && <p>Printed on {metadata.documentDate}</p>}
      </div>
      {showPageNums && (
        <div className="print-doc__page-num text-right">
          <span className="page-number" />
        </div>
      )}
    </footer>
  );
};
