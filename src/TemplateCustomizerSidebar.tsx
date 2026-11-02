import React, { useState } from 'react';
import {
  Layers,
  FileText,
  Type,
  Palette,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  ReportTemplateDescriptor,
  DocumentSection,
  PageSize,
  PageOrientation,
  CellPaddingDensity,
  FontWeightOption,
} from './types';

export interface TemplateCustomizerSidebarProps {
  descriptor: ReportTemplateDescriptor;
  onChange: (updated: ReportTemplateDescriptor) => void;
  onReset?: () => void;
  onSaveTenantDefault?: () => void;
  isSaving?: boolean;
  canManageDefault?: boolean;
  className?: string;
}

type TabKey = 'sections' | 'page' | 'typography' | 'theme';

const FONT_FAMILIES = [
  { label: 'Arial, Helvetica, sans-serif', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Inter, -apple-system, sans-serif', value: 'Inter, -apple-system, sans-serif' },
  { label: 'Roboto, sans-serif', value: 'Roboto, sans-serif' },
  { label: 'Times New Roman, serif', value: 'Times New Roman, serif' },
  { label: 'Georgia, serif', value: 'Georgia, serif' },
  { label: 'Courier New, monospace', value: 'Courier New, monospace' },
];

const FONT_WEIGHTS: FontWeightOption[] = [
  'normal',
  'medium',
  'semibold',
  'bold',
  '400',
  '500',
  '600',
  '700',
];

interface NumericInputProps {
  value: number | undefined;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  allowEmpty?: boolean;
  className?: string;
  onChange: (val: number | undefined) => void;
}

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  defaultValue,
  min,
  max,
  step = 1,
  placeholder,
  allowEmpty = false,
  className,
  onChange,
}) => {
  const [text, setText] = useState<string>(value != null ? String(value) : '');

  React.useEffect(() => {
    setText(value != null ? String(value) : '');
  }, [value]);

  const commit = () => {
    if (text.trim() === '') {
      if (allowEmpty) {
        onChange(undefined);
        return;
      }
      if (defaultValue != null) {
        setText(String(defaultValue));
        onChange(defaultValue);
        return;
      }
    }
    let num = parseFloat(text);
    if (isNaN(num)) {
      num = defaultValue ?? min ?? 0;
    }
    if (min != null) num = Math.max(min, num);
    if (max != null) num = Math.min(max, num);
    setText(String(num));
    if (num !== value) {
      onChange(num);
      // In case parent rejects or clamps back to current `value`, reset display state to match active prop
      setTimeout(() => {
        setText(value != null ? String(value) : '');
      }, 0);
    } else {
      setText(value != null ? String(value) : '');
    }
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
    />
  );
};

interface CommaSeparatedInputProps {
  value: string[];
  onChange: (items: string[]) => void;
  className?: string;
  placeholder?: string;
}

const CommaSeparatedInput: React.FC<CommaSeparatedInputProps> = ({
  value,
  onChange,
  className,
  placeholder,
}) => {
  const [text, setText] = useState<string>(value.join(', '));

  React.useEffect(() => {
    setText(value.join(', '));
  }, [value]);

  const commit = () => {
    const tokens = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onChange(tokens);
    setText(tokens.join(', '));
  };

  return (
    <input
      type="text"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
    />
  );
};

export const TemplateCustomizerSidebar: React.FC<TemplateCustomizerSidebarProps> = ({
  descriptor,
  onChange,
  onReset,
  onSaveTenantDefault,
  isSaving = false,
  canManageDefault = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('sections');
  const [expandedSectionIds, setExpandedSectionIds] = useState<Record<string, boolean>>({});

  const toggleSectionExpanded = (id: string) => {
    setExpandedSectionIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updatePage = (patch: Partial<ReportTemplateDescriptor['page']>) => {
    let nextMargins = descriptor.page.margins;
    const nextSlips = patch.slipsPerSheet ?? descriptor.page.slipsPerSheet ?? 1;
    if (nextSlips === 2) {
      const topBottomSum = (nextMargins.top || 12) + (nextMargins.bottom || 12);
      if (topBottomSum > 31) {
        nextMargins = {
          ...nextMargins,
          top: 12,
          bottom: 12,
        };
      }
    }
    const nextDesc: ReportTemplateDescriptor = {
      ...descriptor,
      page: {
        ...descriptor.page,
        ...patch,
        margins: nextMargins,
      },
    };
    if (descriptor.jobSlipOptions && patch.slipsPerSheet != null) {
      nextDesc.jobSlipOptions = {
        ...descriptor.jobSlipOptions,
        slipsPerSheet: patch.slipsPerSheet,
      };
    }
    onChange(nextDesc);
  };

  const updatePageMargins = (side: 'top' | 'right' | 'bottom' | 'left', val: number) => {
    let clamped = Math.max(5, Math.min(50, val));
    const isTwoSlip = (descriptor.page.slipsPerSheet ?? 1) === 2;
    if (isTwoSlip) {
      if (side === 'top') {
        const currentBottom = descriptor.page.margins.bottom || 12;
        const maxTop = Math.max(5, 31 - currentBottom);
        clamped = Math.min(clamped, maxTop);
      } else if (side === 'bottom') {
        const currentTop = descriptor.page.margins.top || 12;
        const maxBottom = Math.max(5, 31 - currentTop);
        clamped = Math.min(clamped, maxBottom);
      }
    }
    onChange({
      ...descriptor,
      page: {
        ...descriptor.page,
        margins: {
          ...descriptor.page.margins,
          [side]: clamped,
        },
      },
    });
  };

  const updateStyles = (patch: Partial<ReportTemplateDescriptor['styles']>) => {
    onChange({
      ...descriptor,
      styles: {
        ...descriptor.styles,
        ...patch,
      },
    });
  };

  const updateSection = (id: string, patch: Partial<DocumentSection>) => {
    const nextSections = (descriptor.sections || []).map((sec) =>
      sec.id === id ? ({ ...sec, ...patch } as DocumentSection) : sec
    );
    onChange({
      ...descriptor,
      sections: nextSections,
    });
  };

  const toggleSectionVisibility = (id: string) => {
    const sec = (descriptor.sections || []).find((s) => s.id === id);
    if (!sec) return;
    const currentVisible = sec.visible !== false;
    updateSection(id, { visible: !currentVisible });
  };

  const sections = descriptor.sections || [];

  return (
    <div
      className={`flex flex-col h-full bg-slate-900 text-slate-200 text-xs font-sans select-none ${className}`}
    >
      {/* Category Tabs */}
      <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950 text-[11px] font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`py-2.5 px-2 flex flex-col items-center gap-1 transition ${
            activeTab === 'sections'
              ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Sections</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('page')}
          className={`py-2.5 px-2 flex flex-col items-center gap-1 transition ${
            activeTab === 'page'
              ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Page</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('typography')}
          className={`py-2.5 px-2 flex flex-col items-center gap-1 transition ${
            activeTab === 'typography'
              ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Typography</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`py-2.5 px-2 flex flex-col items-center gap-1 transition ${
            activeTab === 'theme'
              ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Theme</span>
        </button>
      </div>

      {/* Main Form Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* 1. SECTIONS TAB */}
        {activeTab === 'sections' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Document Sections ({sections.length})
              </span>
              <span className="text-[10px] text-slate-500">Toggle eye to hide/unhide</span>
            </div>

            {sections.length === 0 ? (
              <p className="text-slate-500 italic py-2 text-center">No sections configured.</p>
            ) : (
              sections.map((sec, idx) => {
                const isExpanded = Boolean(expandedSectionIds[sec.id]);
                const isVisible = sec.visible !== false;

                return (
                  <div
                    key={sec.id || `sec-${idx}`}
                    className={`rounded-md border transition-all ${
                      isVisible
                        ? 'border-slate-800 bg-slate-950/60'
                        : 'border-slate-800/40 bg-slate-950/20 opacity-60'
                    }`}
                  >
                    {/* Section Row Header */}
                    <div className="flex items-center justify-between p-2.5 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSectionExpanded(sec.id)}
                        className="flex items-center gap-2 flex-1 text-left font-medium text-slate-200 hover:text-indigo-400 transition truncate"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span className="font-semibold">{sec.id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-wider">
                          {sec.type}
                        </span>
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility(sec.id)}
                        title={isVisible ? 'Hide Section' : 'Unhide Section'}
                        className={`p-1.5 rounded transition ${
                          isVisible
                            ? 'text-emerald-400 hover:bg-emerald-950/40'
                            : 'text-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Section Details (Expanded) */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 space-y-2.5 text-slate-300">
                        {/* HEADER SPEC */}
                        {sec.type === 'header' && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.showTenantName !== false}
                                onChange={(e) =>
                                  updateSection(sec.id, { showTenantName: e.target.checked })
                                }
                                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                              />
                              <span>Tenant Name</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.showTitle !== false}
                                onChange={(e) =>
                                  updateSection(sec.id, { showTitle: e.target.checked })
                                }
                                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                              />
                              <span>Document Title</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.showDocumentNumber !== false}
                                onChange={(e) =>
                                  updateSection(sec.id, { showDocumentNumber: e.target.checked })
                                }
                                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                              />
                              <span>Document #</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.showDate !== false}
                                onChange={(e) =>
                                  updateSection(sec.id, { showDate: e.target.checked })
                                }
                                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                              />
                              <span>Date</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
                              <input
                                type="checkbox"
                                checked={sec.showBorder !== false}
                                onChange={(e) =>
                                  updateSection(sec.id, { showBorder: e.target.checked })
                                }
                                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                              />
                              <span>Show Bottom Border</span>
                            </label>
                            <div className="col-span-2 mt-1">
                              <span className="text-[10px] text-slate-400 block mb-0.5">
                                Date Label:
                              </span>
                              <input
                                type="text"
                                value={sec.dateLabel || 'Date'}
                                onChange={(e) =>
                                  updateSection(sec.id, { dateLabel: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="col-span-2 mt-1">
                              <span className="text-[10px] text-slate-400 block mb-0.5">
                                Document # Label:
                              </span>
                              <input
                                type="text"
                                value={
                                  sec.documentNumberLabel !== undefined
                                    ? sec.documentNumberLabel
                                    : '#'
                                }
                                placeholder="#"
                                onChange={(e) =>
                                  updateSection(sec.id, { documentNumberLabel: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* TABLE SPEC */}
                        {sec.type === 'table' && (
                          <div className="space-y-2 pt-1">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">
                                Table Key:
                              </span>
                              <input
                                type="text"
                                value={sec.tableKey || ''}
                                onChange={(e) =>
                                  updateSection(sec.id, { tableKey: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={sec.showBorder !== false}
                                  onChange={(e) =>
                                    updateSection(sec.id, { showBorder: e.target.checked })
                                  }
                                  className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                                />
                                <span>Table Border</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={sec.zebraStriping !== false}
                                  onChange={(e) =>
                                    updateSection(sec.id, { zebraStriping: e.target.checked })
                                  }
                                  className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                                />
                                <span>Zebra Rows</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
                                <input
                                  type="checkbox"
                                  checked={sec.repeatHeaderOnPageBreak !== false}
                                  onChange={(e) =>
                                    updateSection(sec.id, {
                                      repeatHeaderOnPageBreak: e.target.checked,
                                    })
                                  }
                                  className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                                />
                                <span>Repeat Header on Break</span>
                              </label>
                            </div>

                            {/* Duplicate Suppression */}
                            <div className="pt-1.5 border-t border-slate-800/80">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(sec.suppressDuplicates)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      updateSection(sec.id, { suppressDuplicates: true });
                                    } else {
                                      updateSection(sec.id, { suppressDuplicates: undefined });
                                    }
                                  }}
                                  className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                                />
                                <span className="font-semibold text-slate-200">
                                  Hide Repeated Duplicate Cells
                                </span>
                              </label>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Blanks duplicate adjacent cells in consecutive rows (e.g. repeated
                                article name).
                              </p>
                              {Array.isArray(sec.suppressDuplicates) && (
                                <div className="mt-1">
                                  <span className="text-[10px] text-slate-400 block mb-0.5">
                                    Columns to deduplicate (comma-separated):
                                  </span>
                                  <CommaSeparatedInput
                                    value={sec.suppressDuplicates}
                                    onChange={(tokens) =>
                                      updateSection(sec.id, {
                                        suppressDuplicates: tokens,
                                      })
                                    }
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* KEY-VALUE GRID SPEC */}
                        {sec.type === 'key-value-grid' && (
                          <div className="space-y-2 pt-1">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">
                                Grid Columns:
                              </span>
                              <div className="flex gap-2">
                                {([2, 3, 4] as const).map((cols) => (
                                  <button
                                    key={cols}
                                    type="button"
                                    onClick={() => updateSection(sec.id, { columns: cols })}
                                    className={`flex-1 py-1 rounded border text-center transition ${
                                      sec.columns === cols
                                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                                    }`}
                                  >
                                    {cols} Cols
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-1">
                                Fields ({sec.fields?.length || 0}):
                              </span>
                              <div className="space-y-1">
                                {(sec.fields || []).map((f, fIdx) => (
                                  <div
                                    key={f.sourceKey || fIdx}
                                    className="flex items-center gap-1.5 text-[11px] bg-slate-900/60 p-1 rounded border border-slate-800/80"
                                  >
                                    <span className="font-semibold text-slate-300">{f.label}:</span>
                                    <span className="text-slate-500 font-mono text-[10px]">
                                      {f.sourceKey}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* BARCODE SPEC */}
                        {sec.type === 'barcode' && (
                          <div className="space-y-2 pt-1">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">
                                Barcode Key:
                              </span>
                              <input
                                type="text"
                                value={sec.barcodeKey || ''}
                                onChange={(e) =>
                                  updateSection(sec.id, { barcodeKey: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] text-slate-400 block mb-0.5">
                                  Height (px):
                                </span>
                                <NumericInput
                                  min={15}
                                  max={120}
                                  value={sec.heightPx || 38}
                                  defaultValue={38}
                                  onChange={(val) => updateSection(sec.id, { heightPx: val })}
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs text-center font-mono"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block mb-0.5">
                                  Align:
                                </span>
                                <select
                                  value={sec.align || 'center'}
                                  onChange={(e) =>
                                    updateSection(sec.id, { align: e.target.value as any })
                                  }
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* FOOTER SPEC */}
                        {sec.type === 'footer' && (
                          <div className="space-y-2 pt-1">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.showPageNumbers !== false}
                                onChange={(e) =>
                                  updateSection(sec.id, { showPageNumbers: e.target.checked })
                                }
                                className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                              />
                              <span>Show Page Numbers</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.showPrintedDate !== false}
                                onChange={(e) =>
                                  updateSection(sec.id, { showPrintedDate: e.target.checked })
                                }
                                className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                              />
                              <span>Show Printed Date (Date-only)</span>
                            </label>
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">
                                Custom Footer Note:
                              </span>
                              <input
                                type="text"
                                value={sec.customText || ''}
                                onChange={(e) =>
                                  updateSection(sec.id, { customText: e.target.value })
                                }
                                placeholder="Optional footer text..."
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                        )}

                        {/* NOTES SPEC */}
                        {sec.type === 'notes' && (
                          <div className="pt-1">
                            <span className="text-[10px] text-slate-400 block mb-0.5">
                              Notes Title:
                            </span>
                            <input
                              type="text"
                              value={sec.title || ''}
                              onChange={(e) => updateSection(sec.id, { title: e.target.value })}
                              placeholder="Notes & Instructions"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2. PAGE SETUP TAB */}
        {activeTab === 'page' && (
          <div className="space-y-4">
            {/* Paper Size */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Paper Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['A4', 'A5', 'Letter'] as PageSize[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => updatePage({ size: sz })}
                    className={`py-1.5 rounded border text-center font-medium transition ${
                      descriptor.page.size === sz
                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['portrait', 'landscape'] as PageOrientation[]).map((orient) => (
                  <button
                    key={orient}
                    type="button"
                    onClick={() => updatePage({ orientation: orient })}
                    className={`py-1.5 rounded border capitalize text-center font-medium transition ${
                      descriptor.page.orientation === orient
                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {orient}
                  </button>
                ))}
              </div>
            </div>

            {/* Slips Per Sheet */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Slips Per Sheet (Multi-Slip Tiling)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => updatePage({ slipsPerSheet: num as 1 | 2 })}
                    className={`py-1.5 rounded border text-center font-medium transition ${
                      (descriptor.page.slipsPerSheet ?? 1) === num
                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {num === 2 ? '2 Slips (A5-in-A4)' : '1 Slip (Full Page)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Cut Line */}
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-slate-200">Show Cut Line Between Slips</span>
                <input
                  type="checkbox"
                  checked={descriptor.page.showCutLine !== false}
                  onChange={(e) => updatePage({ showCutLine: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                />
              </label>
              {descriptor.page.showCutLine !== false && (
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Cut Line Label:</span>
                  <input
                    type="text"
                    value={descriptor.page.cutLineText || 'CUT HERE'}
                    onChange={(e) => updatePage({ cutLineText: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Margins */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Page Margins (5mm – 50mm)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Left Filing (mm):</span>
                  <NumericInput
                    min={5}
                    max={50}
                    value={descriptor.page.margins.left}
                    defaultValue={18}
                    onChange={(val) => updatePageMargins('left', val!)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-center text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Right (mm):</span>
                  <NumericInput
                    min={5}
                    max={50}
                    value={descriptor.page.margins.right}
                    defaultValue={10}
                    onChange={(val) => updatePageMargins('right', val!)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-center text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Top (mm):</span>
                  <NumericInput
                    min={5}
                    max={
                      (descriptor.page.slipsPerSheet ?? 1) === 2
                        ? Math.max(5, 31 - (descriptor.page.margins.bottom || 12))
                        : 50
                    }
                    value={descriptor.page.margins.top}
                    defaultValue={10}
                    onChange={(val) => updatePageMargins('top', val!)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-center text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Bottom (mm):</span>
                  <NumericInput
                    min={5}
                    max={
                      (descriptor.page.slipsPerSheet ?? 1) === 2
                        ? Math.max(5, 31 - (descriptor.page.margins.top || 12))
                        : 50
                    }
                    value={descriptor.page.margins.bottom}
                    defaultValue={10}
                    onChange={(val) => updatePageMargins('bottom', val!)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-center text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. TYPOGRAPHY TAB */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            {/* Font Family */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Font Family
              </label>
              <select
                value={descriptor.styles.fontFamily}
                onChange={(e) => updateStyles({ fontFamily: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Base Font Size & Line Height */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">
                  Base Font Size (pt):
                </span>
                <NumericInput
                  min={6}
                  max={18}
                  value={descriptor.styles.fontSizePt}
                  defaultValue={9}
                  onChange={(val) => updateStyles({ fontSizePt: val })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Line Height:</span>
                <NumericInput
                  step={0.05}
                  min={1}
                  max={2}
                  value={descriptor.styles.lineHeight}
                  defaultValue={1.25}
                  onChange={(val) => updateStyles({ lineHeight: val })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs"
                />
              </div>
            </div>

            {/* Granular Weights */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Granular Font Weights
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Heading:</span>
                  <select
                    value={descriptor.styles.headingFontWeight || 'bold'}
                    onChange={(e) => updateStyles({ headingFontWeight: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs"
                  >
                    {FONT_WEIGHTS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Subheading:</span>
                  <select
                    value={descriptor.styles.subheadingFontWeight || '600'}
                    onChange={(e) => updateStyles({ subheadingFontWeight: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs"
                  >
                    {FONT_WEIGHTS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Body:</span>
                  <select
                    value={descriptor.styles.bodyFontWeight || 'normal'}
                    onChange={(e) => updateStyles({ bodyFontWeight: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs"
                  >
                    {FONT_WEIGHTS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Qty / Numbers:</span>
                  <select
                    value={descriptor.styles.qtyFontWeight || 'bold'}
                    onChange={(e) => updateStyles({ qtyFontWeight: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs"
                  >
                    {FONT_WEIGHTS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Granular Field Sizes */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Element Font Sizes (pt)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Header (pt):</span>
                  <NumericInput
                    min={8}
                    max={28}
                    allowEmpty={true}
                    value={descriptor.styles.headerFontSizePt}
                    placeholder="Auto"
                    onChange={(val) => updateStyles({ headerFontSizePt: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Subheading (pt):</span>
                  <NumericInput
                    min={6}
                    max={20}
                    allowEmpty={true}
                    value={descriptor.styles.subheadingFontSizePt}
                    placeholder="Auto"
                    onChange={(val) => updateStyles({ subheadingFontSizePt: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Table (pt):</span>
                  <NumericInput
                    min={6}
                    max={18}
                    allowEmpty={true}
                    value={descriptor.styles.tableFontSizePt}
                    placeholder="Auto"
                    onChange={(val) => updateStyles({ tableFontSizePt: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">
                    Qty / Numbers (pt):
                  </span>
                  <NumericInput
                    min={6}
                    max={20}
                    allowEmpty={true}
                    value={descriptor.styles.qtyFontSizePt}
                    placeholder="Auto"
                    onChange={(val) => updateStyles({ qtyFontSizePt: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Metadata (pt):</span>
                  <NumericInput
                    min={6}
                    max={16}
                    allowEmpty={true}
                    value={descriptor.styles.metaFontSizePt}
                    placeholder="Auto"
                    onChange={(val) => updateStyles({ metaFontSizePt: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Density / Cell Padding */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Cell Padding Density
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'normal', 'relaxed'] as CellPaddingDensity[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateStyles({ cellPadding: d })}
                    className={`py-1.5 rounded border capitalize text-center font-medium transition ${
                      (descriptor.styles.cellPadding || 'normal') === d
                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. THEME & COLORS TAB */}
        {activeTab === 'theme' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Primary Text Color:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={descriptor.styles.primaryColor}
                    onChange={(e) => updateStyles({ primaryColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={descriptor.styles.primaryColor}
                    onChange={(e) => updateStyles({ primaryColor: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Accent Brand Color:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={descriptor.styles.accentColor}
                    onChange={(e) => updateStyles({ accentColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={descriptor.styles.accentColor}
                    onChange={(e) => updateStyles({ accentColor: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">
                  Table Header Background:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={descriptor.styles.headerBgColor}
                    onChange={(e) => updateStyles({ headerBgColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={descriptor.styles.headerBgColor}
                    onChange={(e) => updateStyles({ headerBgColor: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Zebra Row Background:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={descriptor.styles.zebraBgColor}
                    onChange={(e) => updateStyles({ zebraBgColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={descriptor.styles.zebraBgColor}
                    onChange={(e) => updateStyles({ zebraBgColor: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Template Metadata */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Template Name:</span>
                <input
                  type="text"
                  value={descriptor.name}
                  onChange={(e) => onChange({ ...descriptor, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>
                  Slug: <code className="text-slate-200">{descriptor.slug}</code>
                </span>
                <span>v{descriptor.version}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions (Reset & Save) */}
      {(onReset || onSaveTenantDefault) && (
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          {canManageDefault && onSaveTenantDefault && (
            <button
              type="button"
              onClick={onSaveTenantDefault}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 ml-auto"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Default'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
