import React from 'react';
import { DividerSectionType } from '../types';

export interface DividerSectionProps {
  section: DividerSectionType;
}

export const DividerSection: React.FC<DividerSectionProps> = ({ section }) => {
  if (section.visible === false) return null;

  return (
    <hr
      className="print-doc__divider my-2.5 border-t border-slate-300"
      style={{ borderStyle: section.style || 'solid' }}
    />
  );
};
