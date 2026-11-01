import React from 'react';
import { KeyValueGridSectionType } from '../types';
import { DataDoc, DataDocUnit } from '../dataDoc';

export interface KeyValueGridSectionProps {
  section: KeyValueGridSectionType;
  data: DataDoc;
  unit?: DataDocUnit;
}

export const KeyValueGridSection: React.FC<KeyValueGridSectionProps> = ({
  section,
  data,
  unit,
}) => {
  if (section.visible === false) return null;

  const cols = section.columns || 4;
  const colClass = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <dl className={`print-doc__meta grid ${colClass} gap-2`}>
      {section.fields.map((f) => {
        const val = unit?.summaries?.[f.sourceKey] ?? data.summaries?.[f.sourceKey] ?? '—';

        return (
          <div key={f.sourceKey} className="print-doc__meta-item">
            <dt>{f.label}</dt>
            <dd>{String(val)}</dd>
          </div>
        );
      })}
    </dl>
  );
};
