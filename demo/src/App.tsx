import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Sliders,
  Printer,
  Maximize2,
  Code,
  RotateCcw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Copy,
  X,
  FileCode,
} from 'lucide-react';
import {
  DocumentPreview,
  DocumentPreviewModal,
  TemplateCustomizerSidebar,
  ReportTemplateDescriptor,
  ReportTemplateDescriptorSchema,
  DataDoc,
  DataDocSchema,
  buildPrintPageStyle,
} from '@dotevolve/doc-forge';
import { useReactToPrint } from 'react-to-print';

// Synthetic Fixtures
import {
  manufacturingSlipDescriptor,
  manufacturingSlipDataDoc,
} from './fixtures/manufacturingSlipFixture';
import {
  commercialInvoiceDescriptor,
  commercialInvoiceDataDoc,
} from './fixtures/commercialInvoiceFixture';
import {
  inventoryLedgerDescriptor,
  inventoryLedgerDataDoc,
} from './fixtures/inventoryLedgerFixture';
import {
  basicPurchaseOrderDescriptor,
  basicPurchaseOrderDataDoc,
} from './fixtures/basicPurchaseOrderFixture';

type DocumentType = 'manufacturing' | 'invoice' | 'inventory' | 'custom';

interface DocumentPreset {
  id: DocumentType;
  title: string;
  badge: string;
  icon: string;
  description: string;
  defaultDescriptor: ReportTemplateDescriptor;
  dataDoc: DataDoc;
}

const PRESETS: Record<DocumentType, DocumentPreset> = {
  manufacturing: {
    id: 'manufacturing',
    title: 'Work Order & Job Slip',
    badge: 'Industrial Manufacturing',
    icon: '🏭',
    description:
      'Work order with barcode, multi-size breakdowns, and smart attribute cell deduplication.',
    defaultDescriptor: manufacturingSlipDescriptor,
    dataDoc: manufacturingSlipDataDoc,
  },
  invoice: {
    id: 'invoice',
    title: 'Commercial Tax Invoice',
    badge: 'B2B Billing & FinTech',
    icon: '🧾',
    description:
      'Itemized billing with currency formatting, multi-column tax breakdown, and payment details.',
    defaultDescriptor: commercialInvoiceDescriptor,
    dataDoc: commercialInvoiceDataDoc,
  },
  inventory: {
    id: 'inventory',
    title: 'Warehouse Audit Ledger',
    badge: 'Supply Chain & Logistics',
    icon: '📦',
    description:
      'Landscape ledger with bin locations, variance calculations, and category grouping.',
    defaultDescriptor: inventoryLedgerDescriptor,
    dataDoc: inventoryLedgerDataDoc,
  },
  custom: {
    id: 'custom',
    title: 'Custom Playground',
    badge: 'User Defined PO',
    icon: '📝',
    description:
      'Editable custom descriptor and ready-data document with live validation and hot reload.',
    defaultDescriptor: basicPurchaseOrderDescriptor,
    dataDoc: basicPurchaseOrderDataDoc,
  },
};

export default function App() {
  const [selectedType, setSelectedType] = useState<DocumentType>('manufacturing');
  const [descriptors, setDescriptors] = useState<Record<DocumentType, ReportTemplateDescriptor>>({
    manufacturing: JSON.parse(JSON.stringify(manufacturingSlipDescriptor)),
    invoice: JSON.parse(JSON.stringify(commercialInvoiceDescriptor)),
    inventory: JSON.parse(JSON.stringify(inventoryLedgerDescriptor)),
    custom: JSON.parse(JSON.stringify(basicPurchaseOrderDescriptor)),
  });

  const [customDataDoc, setCustomDataDoc] = useState<DataDoc>(() =>
    JSON.parse(JSON.stringify(basicPurchaseOrderDataDoc))
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Inspector & Editor State
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonTab, setJsonTab] = useState<'descriptor' | 'dataDoc'>('descriptor');
  const [editorText, setEditorText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const activePreset = PRESETS[selectedType];
  const activeDescriptor = descriptors[selectedType];
  const activeDataDoc = selectedType === 'custom' ? customDataDoc : activePreset.dataDoc;

  // Sync editor text whenever opening modal or switching tabs
  useEffect(() => {
    if (jsonModalOpen) {
      const source =
        jsonTab === 'descriptor'
          ? JSON.stringify(activeDescriptor, null, 2)
          : JSON.stringify(activeDataDoc, null, 2);
      setEditorText(source);
      setJsonError(null);
      setApplySuccess(false);
    }
  }, [jsonModalOpen, jsonTab, activeDescriptor, activeDataDoc]);

  // Direct Browser Print Ref
  const printComponentRef = useRef<HTMLDivElement>(null);
  const handleDirectPrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `${activeDataDoc.metadata.documentTitle}_${activeDataDoc.metadata.documentNumber || 'print'}`,
    pageStyle: buildPrintPageStyle(
      activeDescriptor.page.orientation,
      activeDescriptor.page.margins,
      activeDescriptor.page.size
    ),
  });

  const handleDescriptorChange = (updated: ReportTemplateDescriptor) => {
    setDescriptors((prev) => ({
      ...prev,
      [selectedType]: updated,
    }));
  };

  const handleReset = () => {
    if (selectedType === 'custom') {
      setDescriptors((prev) => ({
        ...prev,
        custom: JSON.parse(JSON.stringify(basicPurchaseOrderDescriptor)),
      }));
      setCustomDataDoc(JSON.parse(JSON.stringify(basicPurchaseOrderDataDoc)));
    } else {
      setDescriptors((prev) => ({
        ...prev,
        [selectedType]: JSON.parse(JSON.stringify(activePreset.defaultDescriptor)),
      }));
    }
  };

  const handleLoadBasicExample = () => {
    if (jsonTab === 'descriptor') {
      setEditorText(JSON.stringify(basicPurchaseOrderDescriptor, null, 2));
    } else {
      setEditorText(JSON.stringify(basicPurchaseOrderDataDoc, null, 2));
    }
    setJsonError(null);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(editorText);
      setEditorText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleApplyJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(editorText);

      if (jsonTab === 'descriptor') {
        const result = ReportTemplateDescriptorSchema.safeParse(parsed);
        if (!result.success) {
          const firstErr = result.error.issues[0];
          const pathStr = firstErr.path.join('.') || 'root';
          setJsonError(`Descriptor Schema Error in "${pathStr}": ${firstErr.message}`);
          return;
        }
        setDescriptors((prev) => ({
          ...prev,
          custom: result.data,
        }));
      } else {
        const result = DataDocSchema.safeParse(parsed);
        if (!result.success) {
          const firstErr = result.error.issues[0];
          const pathStr = firstErr.path.join('.') || 'root';
          setJsonError(`DataDoc Schema Error in "${pathStr}": ${firstErr.message}`);
          return;
        }
        setCustomDataDoc(result.data);
      }

      // Switch to custom preset to see results live
      setSelectedType('custom');
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 2500);
    } catch (err: any) {
      setJsonError(`JSON Parse Error: ${err.message}`);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(editorText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">DocForge</span>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v0.1.3
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Pure declarative document & print rendering engine
              </p>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden md:block" />

          {/* Document Preset Switcher */}
          <nav className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800/80">
            {(Object.keys(PRESETS) as DocumentType[]).map((key) => {
              const preset = PRESETS[key];
              const isSelected = selectedType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedType(key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span className="hidden sm:inline">{preset.title}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Customizer Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              sidebarOpen
                ? 'bg-slate-800 text-indigo-400 border-indigo-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Customization Controls"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden lg:inline">
              {sidebarOpen ? 'Hide Controls' : 'Show Controls'}
            </span>
          </button>

          {/* Raw JSON Inspector */}
          <button
            type="button"
            onClick={() => setJsonModalOpen(true)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Inspect Declarative JSON Specs"
          >
            <Code className="w-4 h-4" />
            <span className="hidden lg:inline">Inspect JSON</span>
          </button>

          {/* Full Studio Modal Trigger */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
            title="Open DocumentPreviewModal component"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Studio Modal</span>
          </button>

          {/* Direct Print Button */}
          <button
            type="button"
            onClick={() => handleDirectPrint()}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {/* GitHub Repository Link */}
          <a
            href="https://github.com/DotEvolve/doc-forge"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="View on GitHub"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Split Studio Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Side: Live Template Customizer Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 md:w-96 border-r border-slate-800 bg-slate-900 shrink-0 flex flex-col h-full overflow-hidden shadow-xl z-10 transition-all">
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Live Customizer
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                title="Restore default layout options"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <TemplateCustomizerSidebar
                descriptor={activeDescriptor}
                onChange={handleDescriptorChange}
                onReset={handleReset}
                canManageDefault={false}
              />
            </div>
          </aside>
        )}

        {/* Center / Right: Interactive Document Preview Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden relative">
          {/* Preset Context Banner */}
          <div className="bg-slate-900/60 border-b border-slate-800/60 px-6 py-2 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                {activePreset.badge}
              </span>
              <span className="font-medium text-slate-300">{activePreset.title}</span>
              <span className="text-slate-600">•</span>
              <span className="hidden md:inline text-slate-400">{activePreset.description}</span>
              {selectedType === 'custom' && (
                <button
                  type="button"
                  onClick={() => setJsonModalOpen(true)}
                  className="ml-2 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/50 flex items-center gap-1 transition cursor-pointer"
                  title="Open live JSON editor"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Custom Spec</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-500">
                {activeDescriptor.page.size} ({activeDescriptor.page.orientation})
              </span>
            </div>
          </div>

          {/* Interactive Document Preview */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <div ref={printComponentRef} className="w-full flex justify-center">
              <DocumentPreview
                descriptor={activeDescriptor}
                data={activeDataDoc}
                initialZoom={0.85}
                showToolbar={true}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Full Presentation Studio Modal */}
      {modalOpen && (
        <DocumentPreviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={activeDataDoc.metadata.documentTitle}
          tenantName={activeDataDoc.metadata.tenantName}
          descriptor={activeDescriptor}
          onDescriptorChange={handleDescriptorChange}
          canCustomize={true}
          canManageDefault={true}
          dataDoc={activeDataDoc}
          initialOrientation={activeDescriptor.page.orientation}
        />
      )}

      {/* JSON Schema & DataDoc Inspector & Custom Editor Modal */}
      {jsonModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setJsonModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-slate-800 bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white text-base">
                  Declarative Specs & Playground
                </h3>
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setJsonTab('descriptor')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      jsonTab === 'descriptor'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Template Descriptor
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonTab('dataDoc')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      jsonTab === 'dataDoc'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ready-Data DataDoc
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Load Basic Example */}
                <button
                  type="button"
                  onClick={handleLoadBasicExample}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-amber-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Load clean basic Purchase Order example"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Basic Example</span>
                </button>

                {/* Format JSON */}
                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Re-indent and format JSON"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Format</span>
                </button>

                {/* Copy JSON */}
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copyFeedback ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Apply to Live Canvas */}
                <button
                  type="button"
                  onClick={handleApplyJson}
                  className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                  title="Validate schema with Zod and apply to live document preview"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply to Live Canvas</span>
                </button>

                <div className="h-5 w-px bg-slate-800 mx-1" />

                <button
                  type="button"
                  onClick={() => setJsonModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Inspector (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Error & Success Notification Banners */}
            {jsonError && (
              <div className="px-6 py-2.5 bg-rose-950/80 border-b border-rose-800/80 text-rose-200 text-xs flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-mono break-all">{jsonError}</span>
              </div>
            )}
            {applySuccess && (
              <div className="px-6 py-2.5 bg-emerald-950/80 border-b border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Valid specification! Successfully applied to live canvas and custom preset.
                </span>
              </div>
            )}

            {/* Editable JSON Area */}
            <div className="flex-1 relative bg-slate-950 flex flex-col min-h-0 overflow-hidden">
              <textarea
                value={editorText}
                onChange={(e) => {
                  setEditorText(e.target.value);
                  if (jsonError) setJsonError(null);
                }}
                spellCheck={false}
                className="w-full h-full p-4 font-mono text-xs leading-relaxed text-slate-200 bg-slate-950 border-0 focus:outline-none resize-none selection:bg-indigo-900 selection:text-white overflow-auto"
                placeholder="Enter valid JSON descriptor or DataDoc..."
              />
            </div>

            {/* Footer with Hint */}
            <div className="px-6 py-2 bg-slate-950/90 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
              <span>
                💡 Tip: You can edit or paste your own JSON specification. Click{' '}
                <strong className="text-slate-300">"Apply to Live Canvas"</strong> to validate with
                Zod and render instantly.
              </span>
              <span className="font-mono text-slate-500">
                {jsonTab === 'descriptor' ? 'ReportTemplateDescriptor' : 'DataDoc'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
