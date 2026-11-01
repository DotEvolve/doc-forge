import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Printer,
  Save,
  RotateCcw,
  Sliders,
  FileText,
  Modal,
  Columns,
  ChevronDown,
  ChevronRight,
} from '@dotevolve/ui-kit';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';
import './styles/printDoc.css';
import { buildPrintPageStyle } from './print';
import { ReportTemplateDescriptor } from './types';
import { ReportTemplateDescriptorSchema } from './schemas';
import { safeNormalizeTemplateDescriptor } from './defaultDescriptors';
import { DataDoc } from './dataDoc';
import { DocumentRenderer } from './DocumentRenderer';
import { PrintModalContext } from './PrintModalContext';

export interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  tenantName?: string;
  descriptor?: ReportTemplateDescriptor;
  onDescriptorChange?: (descriptor: ReportTemplateDescriptor) => void;
  canCustomize?: boolean;
  canManageDefault?: boolean;
  isCustom?: boolean;
  isSaving?: boolean;
  templateLoading?: boolean;
  onSaveTenantDefault?: (draft: ReportTemplateDescriptor) => Promise<void> | void;
  onRestoreFactoryDefaults?: () => Promise<void> | void;
  onResetDefaults?: () => void;
  columns?: Array<{ key: string; label: string }>;
  customControls?:
    | React.ReactNode
    | ((context: {
        draft: ReportTemplateDescriptor;
        setDraft: React.Dispatch<React.SetStateAction<ReportTemplateDescriptor>>;
        updateDraft: (
          mutator: (prev: ReportTemplateDescriptor) => ReportTemplateDescriptor
        ) => void;
        canCustomize: boolean;
        isSaving: boolean;
      }) => React.ReactNode);
  dataDoc?: DataDoc;
  children?:
    | React.ReactNode
    | ((props: {
        componentRef: React.RefObject<HTMLDivElement | null>;
        descriptor: ReportTemplateDescriptor;
        hiddenColumns?: string[];
        isColumnVisible?: (key: string) => boolean;
      }) => React.ReactNode);
  initialOrientation?: 'portrait' | 'landscape';
  printButtonLabel?: string;
  inspectionMode?: boolean;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  open,
  onClose,
  title,
  tenantName: propTenantName,
  descriptor,
  onDescriptorChange,
  canCustomize = true,
  canManageDefault = false,
  isCustom = false,
  isSaving: propIsSaving = false,
  templateLoading = false,
  onSaveTenantDefault,
  onRestoreFactoryDefaults,
  onResetDefaults,
  columns,
  customControls,
  dataDoc,
  children,
  initialOrientation,
  printButtonLabel,
  inspectionMode = false,
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const isSaving = propIsSaving;

  const [draft, setDraft] = useState<ReportTemplateDescriptor>(() => {
    const base = safeNormalizeTemplateDescriptor(descriptor);
    if (initialOrientation && !isCustom) {
      base.page.orientation = initialOrientation;
    }
    return base;
  });
  const isUserEditedRef = useRef(false);
  const cleanDescriptorRef = useRef<ReportTemplateDescriptor>(
    safeNormalizeTemplateDescriptor(descriptor)
  );

  // Zoom, Guide & Page Break states
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [showFilingGuide, setShowFilingGuide] = useState<boolean>(false);
  const [showPageBreaks, setShowPageBreaks] = useState<boolean>(true);
  const sheetContainerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState<number>(1);

  // Dynamic column discovery from props or DataDoc
  const availableColumns = useMemo(() => {
    if (columns && columns.length > 0) return columns;
    if (!dataDoc?.units?.[0]?.tables) return [];
    const result: { key: string; label: string }[] = [];
    Object.values(dataDoc.units[0].tables).forEach((tbl: any) => {
      if (Array.isArray(tbl?.columns)) {
        tbl.columns.forEach((c: any) => {
          if (c?.key && !result.some((r) => r.key === c.key)) {
            result.push({ key: c.key, label: c.label || c.key });
          }
        });
      }
    });
    return result;
  }, [columns, dataDoc]);

  const [collapsedTables, setCollapsedTables] = useState<Record<string, boolean>>({});

  const toggleTableCollapse = (tableKey: string) => {
    setCollapsedTables((prev) => ({
      ...prev,
      [tableKey]: !prev[tableKey],
    }));
  };

  // Hidden columns list stored in draft options
  const hiddenColumns: string[] = useMemo(() => {
    return (
      draft.options?.hiddenColumns ?? (draft.jobSlipOptions ?? draft.jobSlip)?.hiddenColumns ?? []
    );
  }, [draft]);

  // Grouped table columns discovery for multi-table or single-table documents
  const tableGroups = useMemo(() => {
    const rawTables = dataDoc?.units?.[0]?.tables || dataDoc?.tables;
    if (rawTables && Object.keys(rawTables).length > 0) {
      const tableEntries = Object.entries(rawTables);
      const isSingleTable = tableEntries.length <= 1;

      return tableEntries.map(([tableKey, tbl]: [string, any]) => {
        const tblCols = (tbl?.columns || []).map((c: any) => ({
          key: c.key,
          label: c.label || c.key,
        }));
        const tblHidden =
          draft.options?.tableHiddenColumns?.[tableKey] || draft.options?.hiddenColumns || [];
        return {
          key: tableKey,
          title: tableKey.replace(/[-_]/g, ' '),
          columns: tblCols,
          hiddenColumns: tblHidden,
        };
      });
    }

    if (availableColumns && availableColumns.length > 0) {
      return [
        {
          key: 'default',
          title: 'Table',
          columns: availableColumns,
          hiddenColumns,
        },
      ];
    }

    return [];
  }, [dataDoc, availableColumns, draft.options, hiddenColumns]);

  const toggleTableColumn = (tableKey: string, colKey: string, visible: boolean) => {
    isUserEditedRef.current = true;
    updateDraft((prev) => {
      const rawTables = dataDoc?.units?.[0]?.tables || dataDoc?.tables;
      const isSingleTable =
        !rawTables || Object.keys(rawTables).length <= 1 || tableKey === 'default';

      const prevTableHidden =
        prev.options?.tableHiddenColumns?.[tableKey] || prev.options?.hiddenColumns || [];
      const nextTableHidden = visible
        ? prevTableHidden.filter((k: string) => k !== colKey)
        : [...new Set([...prevTableHidden, colKey])];

      const prevGlobalHidden = prev.options?.hiddenColumns || [];
      const nextGlobalHidden = visible
        ? prevGlobalHidden.filter((k: string) => k !== colKey)
        : [...new Set([...prevGlobalHidden, colKey])];

      const nextSections = (prev.sections || []).map((sec) => {
        if (sec.type === 'table') {
          const secKey = (sec as any).tableKey || sec.id;
          if (sec.id === tableKey || secKey === tableKey) {
            return {
              ...sec,
              hiddenColumns: nextTableHidden,
            };
          }
        }
        return sec;
      });

      return {
        ...prev,
        sections: nextSections,
        options: {
          ...prev.options,
          ...(isSingleTable ? { hiddenColumns: nextGlobalHidden } : {}),
          tableHiddenColumns: {
            ...(prev.options?.tableHiddenColumns || {}),
            [tableKey]: nextTableHidden,
          },
        },
        ...(isSingleTable && (prev.jobSlipOptions || prev.jobSlip)
          ? {
              jobSlip: { ...(prev.jobSlip || {}), hiddenColumns: nextGlobalHidden },
              jobSlipOptions: { ...(prev.jobSlipOptions || {}), hiddenColumns: nextGlobalHidden },
            }
          : {}),
      };
    });
  };

  const toggleColumn = (colKey: string, visible: boolean) => {
    toggleTableColumn('default', colKey, visible);
  };

  const updateSection = (sectionId: string, patch: Record<string, any>) => {
    isUserEditedRef.current = true;
    updateDraft((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s: any) =>
        s.id === sectionId ? { ...s, ...patch } : s
      ),
    }));
  };

  // Measure rendered canvas height and calculate total pages for page break simulation
  useEffect(() => {
    const el = sheetContainerRef.current;
    if (!el) return;
    const updatePages = () => {
      const isLandscape = draft.page.orientation === 'landscape';
      const isA5 = draft.page.size === 'A5';
      const isLetter = draft.page.size === 'Letter';
      const rawWidth = isA5 ? 148 : isLetter ? 216 : 210;
      const rawHeight = isA5 ? 210 : isLetter ? 279 : 297;
      const canvasHeightMm = isLandscape ? rawWidth : rawHeight;
      const marginTopMm = draft.page.margins?.top ?? 10;
      const marginBottomMm = draft.page.margins?.bottom ?? 10;
      const usablePageHeightMm = Math.max(10, canvasHeightMm - marginTopMm - marginBottomMm);
      // 1mm = 96 / 25.4px = 3.7795px
      const usablePageHeightPx = usablePageHeightMm * (96 / 25.4);
      const totalMarginsPx = (marginTopMm + marginBottomMm) * (96 / 25.4);
      const contentScrollH = Math.max(0, el.scrollHeight - totalMarginsPx);
      const count = Math.max(1, Math.ceil((contentScrollH - 2) / usablePageHeightPx));
      setPageCount(count);
    };
    updatePages();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => updatePages());
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [draft.page.orientation, draft.page.size, draft.page.margins, draft.styles]);

  // Synchronize draft on modal open or when server-side descriptor resolves
  useEffect(() => {
    if (!open) {
      isUserEditedRef.current = false;
      return;
    }
    if (descriptor && !isUserEditedRef.current) {
      const normalized = safeNormalizeTemplateDescriptor(descriptor);
      if (initialOrientation && !isCustom) {
        normalized.page.orientation = initialOrientation;
      }
      setDraft(JSON.parse(JSON.stringify(normalized)));
      cleanDescriptorRef.current = normalized;
    }
  }, [open, descriptor, initialOrientation, isCustom]);

  // When custom template is deleted / restored to factory default, sync draft immediately
  const prevIsCustomRef = useRef(isCustom);
  useEffect(() => {
    if (prevIsCustomRef.current && !isCustom && descriptor) {
      const normalized = safeNormalizeTemplateDescriptor(descriptor);
      if (initialOrientation) {
        normalized.page.orientation = initialOrientation;
      }
      setDraft(JSON.parse(JSON.stringify(normalized)));
      cleanDescriptorRef.current = normalized;
      isUserEditedRef.current = false;
    }
    prevIsCustomRef.current = isCustom;
  }, [isCustom, descriptor, initialOrientation]);

  const updateDraft = (mutator: (prev: ReportTemplateDescriptor) => ReportTemplateDescriptor) => {
    isUserEditedRef.current = true;
    setDraft((prev) => {
      const next = mutator(prev);
      onDescriptorChange?.(next);
      return next;
    });
  };

  const setTrackedDraft: React.Dispatch<React.SetStateAction<ReportTemplateDescriptor>> = (
    value
  ) => {
    isUserEditedRef.current = true;
    setDraft((prev) => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;
      onDescriptorChange?.(next);
      return next;
    });
  };

  const updatePageSetting = <K extends keyof ReportTemplateDescriptor['page']>(
    key: K,
    value: ReportTemplateDescriptor['page'][K]
  ) => {
    updateDraft((prev) => ({
      ...prev,
      page: {
        ...prev.page,
        [key]: value,
      },
    }));
  };

  const handlePageMarginChange = (side: 'top' | 'bottom' | 'left' | 'right', raw: string) => {
    const val = raw === '' ? 0 : Number(raw);
    if (isNaN(val)) return;
    if (val !== draft.page.margins[side]) {
      updateDraft((prev) => ({
        ...prev,
        page: {
          ...prev.page,
          margins: {
            ...prev.page.margins,
            [side]: val,
          },
        },
      }));
    }
  };

  const handlePageMarginBlur = (side: 'top' | 'bottom' | 'left' | 'right') => {
    const current = draft.page.margins[side];
    const clamped = Math.max(5, Math.min(50, current || 5));
    if (clamped !== current) {
      updateDraft((prev) => ({
        ...prev,
        page: {
          ...prev.page,
          margins: {
            ...prev.page.margins,
            [side]: clamped,
          },
        },
      }));
    }
  };

  const updateFontSize = (pt: number) => {
    const clamped = Math.max(7, Math.min(16, pt || 9));
    updateDraft((prev) => ({
      ...prev,
      styles: {
        ...prev.styles,
        fontSizePt: clamped,
      },
    }));
  };

  const handleFieldFontSizeChange = (
    key: 'headerFontSizePt' | 'tableFontSizePt' | 'qtyFontSizePt',
    valStr: string
  ) => {
    if (valStr.trim() === '') {
      updateDraft((prev) => ({
        ...prev,
        styles: {
          ...prev.styles,
          [key]: undefined,
        },
      }));
      return;
    }
    const val = parseInt(valStr, 10);
    if (!isNaN(val)) {
      updateDraft((prev) => ({
        ...prev,
        styles: {
          ...prev.styles,
          [key]: val,
        },
      }));
    }
  };

  const handleFieldFontSizeBlur = (
    key: 'headerFontSizePt' | 'tableFontSizePt' | 'qtyFontSizePt',
    min: number,
    max: number
  ) => {
    const current = draft.styles[key];
    if (current == null) return;
    const clamped = Math.max(min, Math.min(max, current));
    if (clamped !== current) {
      updateDraft((prev) => ({
        ...prev,
        styles: {
          ...prev.styles,
          [key]: clamped,
        },
      }));
    }
  };

  // Actions
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: title || draft.name || 'Report',
    pageStyle: buildPrintPageStyle(
      draft.page.orientation || 'portrait',
      draft.page.margins,
      draft.page.size || 'A4'
    ),
  });

  const handleTriggerPrint = () => {
    const validation = ReportTemplateDescriptorSchema.safeParse(draft);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || 'Invalid layout settings.');
      return;
    }
    handlePrint();
  };

  const handleSaveTenantDefault = async () => {
    if (!canManageDefault) {
      toast.warning('Only administrators can save tenant-wide print defaults.');
      return;
    }
    const validation = ReportTemplateDescriptorSchema.safeParse(draft);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || 'Invalid layout settings.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to save this layout as the default for all users in your tenant? This will overwrite the tenant default template.'
    );
    if (!confirmed) return;

    if (onSaveTenantDefault) {
      await onSaveTenantDefault(draft);
    }
  };

  const handleResetDefaults = () => {
    if (descriptor) {
      const normalized = safeNormalizeTemplateDescriptor(descriptor);
      if (initialOrientation && !isCustom) {
        normalized.page.orientation = initialOrientation;
      }
      setDraft(JSON.parse(JSON.stringify(normalized)));
      cleanDescriptorRef.current = normalized;
      isUserEditedRef.current = false;
      toast.info('Reset print options to active template.');
    }
  };

  const handleRestoreFactoryDefaults = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to restore factory default layout for all users in your tenant? This will delete custom tenant settings.'
    );
    if (!confirmed) return;

    if (onRestoreFactoryDefaults) {
      await onRestoreFactoryDefaults();
    }
  };

  const effectiveTenantName = propTenantName || 'Floorix';
  const effectiveTitle = title || draft.name || 'Document Print Studio';

  return (
    <Modal isOpen={open} onClose={onClose} title={effectiveTitle} size="full">
      <div className="flex flex-col h-[calc(90vh-80px)] w-full overflow-hidden">
        {/* Top Action & Status Bar */}
        <header className="flex flex-row items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-slate-800">{effectiveTenantName}</span>
            <span className="text-sm text-slate-500">|</span>
            <span className="text-sm font-semibold text-slate-700">{effectiveTitle}</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                templateLoading
                  ? 'bg-slate-100 text-slate-500 animate-pulse'
                  : isCustom
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              {templateLoading
                ? 'Loading layout...'
                : isCustom
                  ? 'Custom Tenant Layout'
                  : 'Factory Default'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {canCustomize &&
              JSON.stringify(draft) !== JSON.stringify(cleanDescriptorRef.current) && (
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  disabled={isSaving || templateLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition disabled:opacity-50"
                  title="Reset layout options"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}

            {canManageDefault && isCustom && (
              <button
                type="button"
                onClick={handleRestoreFactoryDefaults}
                disabled={isSaving || templateLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md transition disabled:opacity-50"
                title="Restore factory default layout for all users"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Factory Defaults
              </button>
            )}

            {canManageDefault && (
              <button
                type="button"
                onClick={handleSaveTenantDefault}
                disabled={isSaving || templateLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-md transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Tenant Default'}
              </button>
            )}

            <button
              type="button"
              onClick={handleTriggerPrint}
              disabled={isSaving || templateLoading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-md shadow transition"
            >
              <Printer className="w-4 h-4" />
              {printButtonLabel || 'Print Document'}
            </button>
          </div>
        </header>

        {/* Studio Workspace: Left Controls (380px) & Right Real-Time WYSIWYG Preview */}
        <div className="flex flex-row flex-1 overflow-hidden">
          {/* LEFT PANEL: Customization Controls */}
          <aside
            className={`w-[380px] shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 text-sm text-slate-800 transition-opacity ${
              isSaving || templateLoading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <fieldset
              disabled={isSaving || templateLoading}
              className="flex flex-col gap-5 border-none p-0 m-0 w-full min-w-0"
            >
              {/* Optional Custom Domain Controls Slot */}
              {typeof customControls === 'function'
                ? customControls({
                    draft,
                    setDraft: setTrackedDraft,
                    updateDraft,
                    canCustomize,
                    isSaving,
                  })
                : customControls}

              {/* Standard Formatting Controls guarded by canCustomize */}
              {canCustomize ? (
                <>
                  {/* Document Sections Visibility & Options */}
                  {Boolean(dataDoc) && (draft.sections || []).length > 0 && (
                    <section className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                          Document Sections
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Configure visibility and layout for each section:
                      </p>
                      <div className="space-y-2 pt-1">
                        {(draft.sections || []).map((sec: any) => (
                          <div
                            key={sec.id}
                            className="p-2 rounded border border-slate-200/80 bg-slate-50/50"
                          >
                            <label className="flex items-center justify-between cursor-pointer font-semibold text-xs text-slate-800">
                              <span className="capitalize">
                                {sec.id.replace('sec-', '').replace(/-/g, ' ')}
                              </span>
                              <input
                                type="checkbox"
                                checked={sec.visible !== false}
                                disabled={isSaving}
                                onChange={(e) =>
                                  updateSection(sec.id, { visible: e.target.checked })
                                }
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                              />
                            </label>

                            {/* Header-Specific Sub-Options */}
                            {sec.type === 'header' && sec.visible !== false && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 pl-2 space-y-1.5 text-[11px] text-slate-600">
                                <label className="flex items-center justify-between cursor-pointer">
                                  <span>Show Document Title</span>
                                  <input
                                    type="checkbox"
                                    checked={sec.showTitle !== false}
                                    disabled={isSaving}
                                    onChange={(e) =>
                                      updateSection(sec.id, { showTitle: e.target.checked })
                                    }
                                    className="rounded text-indigo-600 w-3.5 h-3.5"
                                  />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                  <span>Show Subtitle / Description</span>
                                  <input
                                    type="checkbox"
                                    checked={sec.showSubtitle !== false}
                                    disabled={isSaving}
                                    onChange={(e) =>
                                      updateSection(sec.id, { showSubtitle: e.target.checked })
                                    }
                                    className="rounded text-indigo-600 w-3.5 h-3.5"
                                  />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                  <span>Show Tenant / Company Name</span>
                                  <input
                                    type="checkbox"
                                    checked={sec.showTenantName !== false}
                                    disabled={isSaving}
                                    onChange={(e) =>
                                      updateSection(sec.id, { showTenantName: e.target.checked })
                                    }
                                    className="rounded text-indigo-600 w-3.5 h-3.5"
                                  />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                  <span>Show Document Date</span>
                                  <input
                                    type="checkbox"
                                    checked={sec.showDate !== false}
                                    disabled={isSaving}
                                    onChange={(e) =>
                                      updateSection(sec.id, { showDate: e.target.checked })
                                    }
                                    className="rounded text-indigo-600 w-3.5 h-3.5"
                                  />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                  <span>Bottom Divider Line</span>
                                  <input
                                    type="checkbox"
                                    checked={sec.showBorder !== false}
                                    disabled={isSaving}
                                    onChange={(e) =>
                                      updateSection(sec.id, { showBorder: e.target.checked })
                                    }
                                    className="rounded text-indigo-600 w-3.5 h-3.5"
                                  />
                                </label>
                              </div>
                            )}

                            {/* Table-Specific Sub-Options */}
                            {sec.type === 'table' && sec.visible !== false && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 pl-2 space-y-1.5 text-[11px] text-slate-600">
                                <label className="flex items-center justify-between cursor-pointer">
                                  <span>Zebra Striping</span>
                                  <input
                                    type="checkbox"
                                    checked={sec.zebraStriping !== false}
                                    disabled={isSaving}
                                    onChange={(e) =>
                                      updateSection(sec.id, { zebraStriping: e.target.checked })
                                    }
                                    className="rounded text-indigo-600 w-3.5 h-3.5"
                                  />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                  <span>Table Outer Border</span>
                                  <input
                                    type="checkbox"
                                    checked={sec.showBorder !== false}
                                    disabled={isSaving}
                                    onChange={(e) =>
                                      updateSection(sec.id, { showBorder: e.target.checked })
                                    }
                                    className="rounded text-indigo-600 w-3.5 h-3.5"
                                  />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                  <span>Repeat Header on Page Break</span>
                                  <input
                                    type="checkbox"
                                    checked={sec.repeatHeaderOnPageBreak !== false}
                                    disabled={isSaving}
                                    onChange={(e) =>
                                      updateSection(sec.id, {
                                        repeatHeaderOnPageBreak: e.target.checked,
                                      })
                                    }
                                    className="rounded text-indigo-600 w-3.5 h-3.5"
                                  />
                                </label>
                              </div>
                            )}

                            {/* Footer-Specific Sub-Options */}
                            {sec.type === 'footer' && sec.visible !== false && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 pl-2 space-y-1.5 text-[11px] text-slate-600">
                                <label className="flex items-center justify-between cursor-pointer">
                                  <span>Show Page Numbers</span>
                                  <input
                                    type="checkbox"
                                    checked={sec.showPageNumbers !== false}
                                    disabled={isSaving}
                                    onChange={(e) =>
                                      updateSection(sec.id, { showPageNumbers: e.target.checked })
                                    }
                                    className="rounded text-indigo-600 w-3.5 h-3.5"
                                  />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                  <span>Show Printed Timestamp</span>
                                  <input
                                    type="checkbox"
                                    checked={sec.showPrintedDate !== false}
                                    disabled={isSaving}
                                    onChange={(e) =>
                                      updateSection(sec.id, { showPrintedDate: e.target.checked })
                                    }
                                    className="rounded text-indigo-600 w-3.5 h-3.5"
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Page Formatting & Typography */}
                  <section className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                        Page &amp; Typography
                      </span>
                    </div>

                    {/* Font Family */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Font Family:
                      </label>
                      <select
                        value={draft.styles.fontFamily || 'Arial, Helvetica, sans-serif'}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            styles: { ...prev.styles, fontFamily: e.target.value },
                          }))
                        }
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Inter, -apple-system, sans-serif">
                          Inter (Modern Sans)
                        </option>
                        <option value="Arial, Helvetica, sans-serif">
                          Arial / Helvetica (Clean)
                        </option>
                        <option value="Roboto, sans-serif">Roboto (Technical)</option>
                        <option value="Georgia, serif">Georgia (Serif)</option>
                        <option value="Courier New, monospace">Courier New (Monospace)</option>
                      </select>
                    </div>

                    {/* Paper Size */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Paper Size:
                      </label>
                      <div className="flex gap-2">
                        {(['A4', 'A5', 'Letter'] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => updatePageSetting('size', sz)}
                            className={`flex-1 py-1 px-2 text-xs rounded border transition ${
                              draft.page.size === sz
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Orientation */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Orientation:
                      </label>
                      <div className="flex gap-2">
                        {(['portrait', 'landscape'] as const).map((orient) => (
                          <button
                            key={orient}
                            type="button"
                            onClick={() => updatePageSetting('orientation', orient)}
                            className={`flex-1 py-1 px-2 text-xs rounded border capitalize transition ${
                              draft.page.orientation === orient
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {orient}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Margins */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Page Margins (mm):
                      </label>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                          <div key={side}>
                            <span className="text-[10px] uppercase text-slate-400 block mb-0.5">
                              {side}
                            </span>
                            <input
                              type="number"
                              min="5"
                              max="50"
                              value={draft.page.margins[side] ?? 10}
                              onChange={(e) => handlePageMarginChange(side, e.target.value)}
                              onBlur={() => handlePageMarginBlur(side)}
                              className="w-full text-center px-1 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Base Font Size */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-600">
                          Base Typography Scale:
                        </label>
                        <span className="text-xs font-bold text-indigo-600">
                          {draft.styles.fontSizePt || 11}pt
                        </span>
                      </div>
                      <input
                        type="range"
                        min="7"
                        max="16"
                        step="1"
                        value={draft.styles.fontSizePt || 11}
                        onChange={(e) => updateFontSize(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Field-level Font Sizes & Weights */}
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                        Component Font Sizes (pt)
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Header:</span>
                          <input
                            type="number"
                            min="7"
                            max="24"
                            value={draft.styles.headerFontSizePt ?? ''}
                            placeholder={String(draft.styles.fontSizePt || 11)}
                            onChange={(e) =>
                              handleFieldFontSizeChange('headerFontSizePt', e.target.value)
                            }
                            onBlur={() => handleFieldFontSizeBlur('headerFontSizePt', 7, 24)}
                            className="w-full mt-0.5 px-1.5 py-0.5 border border-slate-200 rounded text-center text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Subheading:</span>
                          <input
                            type="number"
                            min="6"
                            max="20"
                            value={draft.styles.subheadingFontSizePt ?? ''}
                            placeholder="10"
                            onChange={(e) =>
                              handleFieldFontSizeChange(
                                'subheadingFontSizePt' as any,
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              handleFieldFontSizeBlur('subheadingFontSizePt' as any, 6, 20)
                            }
                            className="w-full mt-0.5 px-1.5 py-0.5 border border-slate-200 rounded text-center text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Table Cells:</span>
                          <input
                            type="number"
                            min="6"
                            max="18"
                            value={draft.styles.tableFontSizePt ?? ''}
                            placeholder={String(draft.styles.fontSizePt || 11)}
                            onChange={(e) =>
                              handleFieldFontSizeChange('tableFontSizePt', e.target.value)
                            }
                            onBlur={() => handleFieldFontSizeBlur('tableFontSizePt', 6, 18)}
                            className="w-full mt-0.5 px-1.5 py-0.5 border border-slate-200 rounded text-center text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">
                            Quantities / Qty:
                          </span>
                          <input
                            type="number"
                            min="7"
                            max="20"
                            value={draft.styles.qtyFontSizePt ?? ''}
                            placeholder="12"
                            onChange={(e) =>
                              handleFieldFontSizeChange('qtyFontSizePt', e.target.value)
                            }
                            onBlur={() => handleFieldFontSizeBlur('qtyFontSizePt', 7, 20)}
                            className="w-full mt-0.5 px-1.5 py-0.5 border border-slate-200 rounded text-center text-xs"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">
                            Subheading Weight:
                          </span>
                          <select
                            value={draft.styles.subheadingFontWeight || '600'}
                            onChange={(e) =>
                              updateDraft((prev) => ({
                                ...prev,
                                styles: {
                                  ...prev.styles,
                                  subheadingFontWeight: e.target.value as any,
                                },
                              }))
                            }
                            className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800"
                          >
                            <option value="400">Regular (400)</option>
                            <option value="500">Medium (500)</option>
                            <option value="600">Semi-Bold (600)</option>
                            <option value="700">Bold (700)</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">
                            Qty Font Weight:
                          </span>
                          <select
                            value={draft.styles.qtyFontWeight || '700'}
                            onChange={(e) =>
                              updateDraft((prev) => ({
                                ...prev,
                                styles: { ...prev.styles, qtyFontWeight: e.target.value as any },
                              }))
                            }
                            className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800"
                          >
                            <option value="400">Regular (400)</option>
                            <option value="500">Medium (500)</option>
                            <option value="600">Semi-Bold (600)</option>
                            <option value="700">Bold (700)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Table Columns Visibility Section (Grouped by Table) */}
                  {tableGroups.length > 0 && (
                    <section className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Columns className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                            Table Columns
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">
                          grouped by table
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Toggle column visibility per table:</p>

                      <div className="space-y-2.5">
                        {tableGroups.map((group) => {
                          const isCollapsed = Boolean(collapsedTables[group.key]);
                          const visibleCount = group.columns.filter(
                            (c: { key: string }) => !group.hiddenColumns.includes(c.key)
                          ).length;

                          return (
                            <div
                              key={group.key}
                              className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs"
                            >
                              <button
                                type="button"
                                onClick={() => toggleTableCollapse(group.key)}
                                className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 transition text-left cursor-pointer"
                              >
                                <span className="text-xs font-bold text-slate-800 capitalize flex items-center gap-1.5">
                                  {isCollapsed ? (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                  {group.title} Columns
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium bg-slate-200/60 px-1.5 py-0.5 rounded">
                                  {visibleCount}/{group.columns.length} visible
                                </span>
                              </button>

                              {!isCollapsed && (
                                <div className="p-2 space-y-1.5 bg-white max-h-48 overflow-y-auto">
                                  {group.columns.map((col: { key: string; label: string }) => {
                                    const isVisible = !group.hiddenColumns.includes(col.key);
                                    return (
                                      <label
                                        key={col.key}
                                        className="flex items-center justify-between text-xs text-slate-700 hover:bg-slate-50 px-2 py-1 rounded cursor-pointer transition"
                                      >
                                        <span className="truncate pr-2">{col.label}</span>
                                        <input
                                          type="checkbox"
                                          checked={isVisible}
                                          disabled={isSaving}
                                          onChange={(e) =>
                                            toggleTableColumn(group.key, col.key, e.target.checked)
                                          }
                                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Reset Configuration Controls */}
                  <section className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      disabled={isSaving || templateLoading}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset to Default Settings
                    </button>
                    {canManageDefault && isCustom && (
                      <button
                        type="button"
                        onClick={handleRestoreFactoryDefaults}
                        disabled={isSaving || templateLoading}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md transition disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore Factory Defaults
                      </button>
                    )}
                  </section>
                </>
              ) : (
                <section className="bg-amber-50 p-3.5 rounded-lg border border-amber-200 text-xs text-amber-800">
                  <span className="font-semibold block mb-1">Layout Customization Locked</span>
                  Template styling and layout customization are disabled by your organization
                  policy. Documents will be printed using the tenant default layout.
                </section>
              )}
            </fieldset>
          </aside>

          {/* RIGHT PANEL: Live WYSIWYG Print Canvas */}
          <main className="flex-1 bg-slate-200/90 overflow-y-auto p-8 flex flex-col items-center">
            {/* Toolbar for Zoom & Guide */}
            <div className="mb-3 flex items-center justify-between w-full max-w-[850px] px-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>
                  📄 {draft.page.size} Print Canvas ({draft.page.orientation})
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-700">
                  {pageCount} Page{pageCount > 1 ? 's' : ''}
                </span>
                <span>•</span>
                <span>
                  Margins: L {draft.page.margins.left}mm | R {draft.page.margins.right}mm | T{' '}
                  {draft.page.margins.top}mm | B {draft.page.margins.bottom}mm
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded shadow-sm border border-slate-200">
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(1))))}
                  className="px-1.5 py-0.5 font-bold hover:bg-slate-100 rounded text-slate-700"
                  title="Zoom Out"
                >
                  −
                </button>
                <span className="font-mono text-slate-700">{Math.round(zoomScale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.min(1.5, Number((s + 0.1).toFixed(1))))}
                  className="px-1.5 py-0.5 font-bold hover:bg-slate-100 rounded text-slate-700"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  className="ml-1 text-[11px] text-indigo-600 hover:underline"
                >
                  Reset
                </button>
                <span className="text-slate-300">|</span>
                <label
                  className="flex items-center gap-1 cursor-pointer select-none text-[11px]"
                  title="Toggle dashed page break lines"
                >
                  <input
                    type="checkbox"
                    checked={showPageBreaks}
                    onChange={(e) => setShowPageBreaks(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Page Breaks</span>
                </label>
                <span className="text-slate-300">|</span>
                <label className="flex items-center gap-1 cursor-pointer select-none text-[11px]">
                  <input
                    type="checkbox"
                    checked={showFilingGuide}
                    onChange={(e) => setShowFilingGuide(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>18mm Guide</span>
                </label>
              </div>
            </div>

            {/* Paper Sheet Simulator */}
            {(() => {
              const isLandscape = draft.page.orientation === 'landscape';
              const isA5 = draft.page.size === 'A5';
              const isLetter = draft.page.size === 'Letter';
              const rawWidth = isA5 ? 148 : isLetter ? 216 : 210;
              const rawHeight = isA5 ? 210 : isLetter ? 279 : 297;
              const canvasWidthMm = isLandscape ? rawHeight : rawWidth;
              const canvasHeightMm = isLandscape ? rawWidth : rawHeight;

              return (
                <div
                  className="transition-transform duration-100 origin-top flex flex-col items-center"
                  style={{ transform: `scale(${zoomScale})` }}
                >
                  <div
                    ref={sheetContainerRef}
                    className="relative bg-white shadow-2xl rounded-sm border border-slate-300 transition-all duration-150 mx-auto"
                    style={{
                      width: `${canvasWidthMm}mm`,
                      maxWidth: `${canvasWidthMm}mm`,
                      minHeight: `${canvasHeightMm}mm`,
                      paddingTop: `${draft.page.margins.top}mm`,
                      paddingRight: `${draft.page.margins.right}mm`,
                      paddingBottom: `${draft.page.margins.bottom}mm`,
                      paddingLeft: `${draft.page.margins.left}mm`,
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Visual Page Break Dividers */}
                    {showPageBreaks &&
                      pageCount > 1 &&
                      Array.from({ length: pageCount - 1 }).map((_, i) => {
                        const pageNum = i + 1;
                        const marginTopMm = draft.page.margins?.top ?? 10;
                        const marginBottomMm = draft.page.margins?.bottom ?? 10;
                        const usablePageHeightMm = Math.max(
                          10,
                          canvasHeightMm - marginTopMm - marginBottomMm
                        );
                        return (
                          <div
                            key={`page-divider-${pageNum}`}
                            className="absolute left-0 right-0 pointer-events-none z-30 flex flex-col items-center print:hidden"
                            style={{
                              top: `${marginTopMm + pageNum * usablePageHeightMm}mm`,
                              transform: 'translateY(-50%)',
                            }}
                          >
                            <div className="w-full py-1 bg-slate-100/95 border-y-2 border-dashed border-indigo-400 shadow-sm flex items-center justify-between px-3">
                              <span className="text-[9px] font-mono font-bold text-indigo-700 uppercase tracking-wider bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                                ✂ Sheet {pageNum} Ends · Physical Page Break
                              </span>
                              <span className="text-[9px] font-mono font-bold bg-indigo-600 text-white px-2 py-0.5 rounded shadow select-none uppercase tracking-wide">
                                Page Break · Page {pageNum} / {pageNum + 1}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                    {/* Visual 18mm Filing Guide Overlay */}
                    {showFilingGuide && (
                      <div
                        className="absolute top-0 bottom-0 left-0 border-r-2 border-dashed border-rose-300 pointer-events-none z-20 flex flex-col justify-center items-center opacity-60"
                        style={{ width: '18mm' }}
                      >
                        <span className="text-[9px] uppercase tracking-widest text-rose-500 rotate-90 select-none">
                          18mm Filing Margin
                        </span>
                      </div>
                    )}

                    {/* Canvas Content Target */}
                    <PrintModalContext.Provider value={{ hiddenColumns, toggleColumn }}>
                      {dataDoc ? (
                        <DocumentRenderer
                          ref={componentRef}
                          data={dataDoc}
                          descriptor={draft}
                          inspectionMode={inspectionMode}
                        />
                      ) : typeof children === 'function' ? (
                        children({
                          componentRef,
                          descriptor: draft,
                          hiddenColumns,
                          isColumnVisible: (k) => !hiddenColumns.includes(k),
                        })
                      ) : (
                        children
                      )}
                    </PrintModalContext.Provider>
                  </div>
                </div>
              );
            })()}
          </main>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentPreviewModal;
