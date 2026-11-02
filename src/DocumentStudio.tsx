import React, { useState, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Printer,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileCode,
  Layers,
  Sliders,
} from 'lucide-react';
import { DocumentPreview } from './DocumentPreview';
import { ReportTemplateDescriptor } from './types';
import { DataDoc } from './dataDoc';
import { normalizeTemplateDescriptor } from './schemas';
import { buildDynamicPrintPageStyle } from './reportStyleBridge';
import { TemplateCustomizerSidebar } from './TemplateCustomizerSidebar';

import jobSlipJson from './templates/job-slip.json';
import articlesReportJson from './templates/articles-report.json';
import ledgerReportJson from './templates/ledger-report.json';

const PRESET_TEMPLATES: Record<string, { name: string; descriptor: any; sampleDoc: DataDoc }> = {
  'job-slip': {
    name: 'Job Slip (A5-in-A4)',
    descriptor: jobSlipJson,
    sampleDoc: {
      metadata: {
        tenantName: 'Acme Industrial Manufacturing',
        documentTitle: 'Production Work Order Slip',
        documentNumber: 'WO-2026-904',
        documentDate: '20 Oct 2026',
        subtitle: 'In Production',
      },
      summaries: {
        jobNumber: 'WO-2026-904',
        articleName: 'Precision Unit Model-X',
        totalPairs: 120,
        category: 'Precision Equipment',
        jobDate: '20 Oct 2026',
        status: 'In Production',
      },
      tables: {
        sizes: {
          columns: [
            { key: 'article', label: 'Article', widthPct: 25 },
            { key: 'color', label: 'Color', widthPct: 15 },
            { key: 'size_7', label: '7', widthPct: 15, align: 'right' },
            { key: 'size_8', label: '8', widthPct: 15, align: 'right' },
            { key: 'size_9', label: '9', widthPct: 15, align: 'right' },
            { key: 'total', label: 'Total', widthPct: 15, align: 'right' },
          ],
          rows: [
            {
              article: 'Classic Oxford',
              color: 'Black Leather',
              size_7: 20,
              size_8: 30,
              size_9: 10,
              total: 60,
            },
            {
              article: 'Classic Oxford',
              color: 'Tan Suede',
              size_7: 15,
              size_8: 35,
              size_9: 10,
              total: 60,
            },
          ],
          footerRow: {
            article: 'Total',
            color: '',
            size_7: 35,
            size_8: 65,
            size_9: 20,
            total: 120,
          },
          emptyMessage: 'No articles.',
        },
        steps: {
          columns: [
            { key: 'jobNumber', label: 'Work Order', widthPct: 25 },
            { key: 'step_Cutting', label: 'Fabrication Lead', widthPct: 35 },
            { key: 'step_Stitching', label: 'Assembly Lead', widthPct: 40 },
          ],
          rows: [
            {
              jobNumber: 'WO-2026-904',
              step_Cutting: 'Operator A',
              step_Stitching: 'Operator B',
            },
          ],
          emptyMessage: 'No steps assigned.',
        },
      },
      units: [
        {
          unitId: 'unit-cutting',
          unitTitle: 'Fabrication Copy',
          unitNumber: 1,
          summaries: {
            jobNumber: 'WO-2026-904',
            articleName: 'Precision Unit Model-X',
            totalPairs: 120,
            worker: 'Operator A',
          },
        },
        {
          unitId: 'unit-stitching',
          unitTitle: 'Assembly Copy',
          unitNumber: 2,
          summaries: {
            jobNumber: 'WO-2026-904',
            articleName: 'Precision Unit Model-X',
            totalPairs: 120,
            worker: 'Operator B',
          },
        },
      ],
    },
  },
  'articles-report': {
    name: 'Articles Inventory Report',
    descriptor: articlesReportJson,
    sampleDoc: {
      metadata: {
        tenantName: 'Acme Industrial Manufacturing',
        documentTitle: 'Articles Inventory & Production Summary',
        documentDate: '20 Oct 2026',
      },
      summaries: {
        Category: 'All Active Styles',
        Period: 'Current Month',
      },
      tables: {
        articles: {
          columns: [
            { key: 'code', label: 'SKU Code', widthPct: 15 },
            { key: 'name', label: 'Description', widthPct: 35 },
            { key: 'category', label: 'Category', widthPct: 20 },
            { key: 'cost', label: 'Standard Cost', widthPct: 15, align: 'right' },
            { key: 'stock', label: 'In Stock', widthPct: 15, align: 'right' },
          ],
          rows: [
            {
              code: 'ART-001',
              name: 'Classic Oxford Model A',
              category: 'Formal',
              cost: '$48.00',
              stock: 320,
            },
            {
              code: 'ART-002',
              name: 'Casual Loafer Model B',
              category: 'Casual',
              cost: '$38.00',
              stock: 180,
            },
            {
              code: 'ART-003',
              name: 'Ankle Boot Model C',
              category: 'Boots',
              cost: '$62.00',
              stock: 95,
            },
          ],
          footerRow: {
            code: 'Total',
            name: '',
            category: '',
            cost: '',
            stock: 595,
          },
          emptyMessage: 'No articles found.',
        },
      },
      units: [
        {
          unitId: 'rep-unit-1',
          unitTitle: 'Articles Inventory & Production Summary',
          unitNumber: 1,
        },
      ],
    },
  },
  ledger: {
    name: 'Ledger Statement',
    descriptor: ledgerReportJson,
    sampleDoc: {
      metadata: {
        tenantName: 'Acme Industrial Manufacturing',
        documentTitle: 'Worker Production Ledger',
        documentDate: '20 Oct 2026',
      },
      summaries: {
        Worker: 'Operator A (Fabrication)',
        Period: '01 Oct 2026 – 20 Oct 2026',
        TotalEarned: '$1,940.00',
      },
      tables: {
        ledger: {
          columns: [
            { key: 'date', label: 'Date', widthPct: 15 },
            { key: 'jobId', label: 'Job Ref', widthPct: 20 },
            { key: 'op', label: 'Operation', widthPct: 30 },
            { key: 'pairs', label: 'Pairs', widthPct: 15, align: 'right' },
            { key: 'amount', label: 'Amount', widthPct: 20, align: 'right' },
          ],
          rows: [
            {
              date: '18 Oct 2026',
              jobId: 'WO-901',
              op: 'Precision Laser Cutting',
              pairs: 100,
              amount: '$480.00',
            },
            {
              date: '19 Oct 2026',
              jobId: 'WO-904',
              op: 'Surface Polishing',
              pairs: 120,
              amount: '$620.00',
            },
            {
              date: '20 Oct 2026',
              jobId: 'WO-910',
              op: 'Final Sub-Assembly',
              pairs: 180,
              amount: '$840.00',
            },
          ],
          footerRow: {
            date: 'Total',
            jobId: '',
            op: '',
            pairs: 400,
            amount: '$1,940.00',
          },
          emptyMessage: 'No ledger transactions recorded.',
        },
      },
      units: [
        {
          unitId: 'ledger-unit-1',
          unitTitle: 'Worker Production Ledger',
          unitNumber: 1,
        },
      ],
    },
  },
};

export const DocumentStudio: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('job-slip');
  const [activeTab, setActiveTab] = useState<'customizer' | 'descriptor' | 'dataDoc'>('customizer');

  const preset = PRESET_TEMPLATES[selectedPreset] || PRESET_TEMPLATES['job-slip'];

  const [descriptorText, setDescriptorText] = useState<string>(() =>
    JSON.stringify(preset.descriptor, null, 2)
  );
  const [dataDocText, setDataDocText] = useState<string>(() =>
    JSON.stringify(preset.sampleDoc, null, 2)
  );

  const [descriptorError, setDescriptorError] = useState<string | null>(null);
  const [dataDocError, setDataDocError] = useState<string | null>(null);

  const handleSelectPreset = (key: string) => {
    setSelectedPreset(key);
    const p = PRESET_TEMPLATES[key];
    if (p) {
      setDescriptorText(JSON.stringify(p.descriptor, null, 2));
      setDataDocText(JSON.stringify(p.sampleDoc, null, 2));
      setDescriptorError(null);
      setDataDocError(null);
    }
  };

  const activeDescriptor: ReportTemplateDescriptor = useMemo(() => {
    try {
      const parsed = JSON.parse(descriptorText);
      setDescriptorError(null);
      return normalizeTemplateDescriptor(parsed);
    } catch (e: any) {
      setDescriptorError(e?.message || 'Invalid Template JSON');
      return normalizeTemplateDescriptor(preset.descriptor);
    }
  }, [descriptorText, preset.descriptor]);

  const activeDataDoc: DataDoc = useMemo(() => {
    try {
      const parsed = JSON.parse(dataDocText);
      setDataDocError(null);
      return parsed as DataDoc;
    } catch (e: any) {
      setDataDocError(e?.message || 'Invalid DataDoc JSON');
      return preset.sampleDoc;
    }
  }, [dataDocText, preset.sampleDoc]);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: buildDynamicPrintPageStyle(
      activeDescriptor.page.orientation,
      activeDescriptor.page.margins,
      activeDescriptor.page.size
    ),
    documentTitle: activeDataDoc.metadata.documentTitle || activeDescriptor.name,
  });

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Left Control & JSON Editor Panel */}
      <div className="w-[480px] min-w-[400px] flex flex-col border-r border-slate-800 bg-slate-900">
        {/* Studio Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">DocForge Studio</h1>
              <p className="text-[11px] text-slate-400">Declarative Document Playground</p>
            </div>
          </div>
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print Test
          </button>
        </div>

        {/* Presets & Tabs Toolbar */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/60">
          <div className="flex-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
              Document Preset
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {Object.entries(PRESET_TEMPLATES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleSelectPreset(selectedPreset)}
            title="Reset to default preset"
            className="mt-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Editor Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 text-xs">
          <button
            onClick={() => setActiveTab('customizer')}
            className={`flex-1 py-2 px-2 text-center font-medium transition flex items-center justify-center gap-1.5 ${
              activeTab === 'customizer'
                ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Visual Customizer
          </button>
          <button
            onClick={() => setActiveTab('descriptor')}
            className={`flex-1 py-2 px-2 text-center font-medium transition flex items-center justify-center gap-1.5 ${
              activeTab === 'descriptor'
                ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Template JSON
            {descriptorError ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('dataDoc')}
            className={`flex-1 py-2 px-2 text-center font-medium transition flex items-center justify-center gap-1.5 ${
              activeTab === 'dataDoc'
                ? 'border-b-2 border-indigo-500 text-indigo-400 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            DataDoc JSON
            {dataDocError ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
        </div>

        {/* Code Editor Body */}
        <div className="flex-1 p-3 flex flex-col relative overflow-hidden">
          {activeTab === 'customizer' ? (
            <div className="flex-1 overflow-hidden -m-3 flex flex-col">
              {descriptorError && (
                <div className="bg-red-950/90 text-red-200 border-b border-red-800 p-2.5 text-xs flex items-center gap-2 shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span className="truncate">
                    Descriptor syntax error: {descriptorError}. Please fix in JSON tab.
                  </span>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <TemplateCustomizerSidebar
                  descriptor={activeDescriptor}
                  onChange={(updated) => {
                    setDescriptorText(JSON.stringify(updated, null, 2));
                    setDescriptorError(null);
                  }}
                  onReset={() => handleSelectPreset(selectedPreset)}
                />
              </div>
            </div>
          ) : activeTab === 'descriptor' ? (
            <>
              <textarea
                value={descriptorText}
                onChange={(e) => setDescriptorText(e.target.value)}
                spellCheck={false}
                className="w-full flex-1 bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
              {descriptorError && (
                <div className="absolute bottom-4 left-4 right-4 bg-red-950/90 text-red-200 border border-red-800 rounded p-2 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span className="truncate">{descriptorError}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <textarea
                value={dataDocText}
                onChange={(e) => setDataDocText(e.target.value)}
                spellCheck={false}
                className="w-full flex-1 bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
              {dataDocError && (
                <div className="absolute bottom-4 left-4 right-4 bg-red-950/90 text-red-200 border border-red-800 rounded p-2 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span className="truncate">{dataDocError}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Canvas Preview Area */}
      <div className="flex-1 h-full relative overflow-hidden">
        <DocumentPreview descriptor={activeDescriptor} data={activeDataDoc} initialZoom={0.8} />
        {/* Hidden Container for react-to-print */}
        <div className="hidden">
          <div ref={printRef}>
            <DocumentPreview
              descriptor={activeDescriptor}
              data={activeDataDoc}
              showToolbar={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentStudio;
