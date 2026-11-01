import React from 'react';
import { NotesSectionType } from '../types';
import { DataDoc, DataDocUnit } from '../dataDoc';

export interface NotesSectionProps {
  section: NotesSectionType;
  data: DataDoc;
  unit?: DataDocUnit;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ section, data, unit }) => {
  if (section.visible === false) return null;

  const content = section.contentKey
    ? (unit?.summaries?.[section.contentKey] ?? data.summaries?.[section.contentKey])
    : data.metadata.customNotes?.join('\n');

  if (!content) return null;

  return (
    <div className="print-doc__note my-2 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
      {section.title && <p className="font-semibold mb-1 text-slate-800">{section.title}</p>}
      <p className="whitespace-pre-line">{String(content)}</p>
    </div>
  );
};
