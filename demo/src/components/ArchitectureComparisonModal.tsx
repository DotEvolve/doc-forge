import React, { useState } from 'react';
import {
  X,
  Scale,
  Cpu,
  Layers,
  ShieldCheck,
  Check,
  Code2,
  Copy,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  BookOpen,
  Printer,
  Boxes,
} from 'lucide-react';

interface ArchitectureComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'comparison' | 'license' | 'quickstart';

const COMPARISON_ROWS = [
  {
    feature: 'Declarative JSON Template',
    docforge: 'Yes (ReportTemplateDescriptor)',
    pdfme: 'Yes (schemas JSON)',
    reactPdf: 'No (JSX components only)',
    pdfmake: 'Yes (docDefinition)',
    jsreport: 'Partial (Handlebars/JS)',
  },
  {
    feature: 'Ready-Data Architecture',
    docforge: 'Yes (Strict DataDoc contract)',
    pdfme: 'Partial (inputs payload)',
    reactPdf: 'No (logic in components)',
    pdfmake: 'No (ad-hoc data binding)',
    jsreport: 'No (server data scripts)',
  },
  {
    feature: 'Embeddable WYSIWYG Studio Modal',
    docforge: 'Yes (DocumentPreviewModal)',
    pdfme: 'Yes (Canvas designer)',
    reactPdf: 'No (code-only)',
    pdfmake: 'No (code-only)',
    jsreport: 'Partial (separate studio web app)',
  },
  {
    feature: '100% Client-Side (Zero Server Cost)',
    docforge: 'Yes (Browser native)',
    pdfme: 'Yes (Browser/Node)',
    reactPdf: 'Yes (Browser/Node)',
    pdfmake: 'Yes (Browser/Node)',
    jsreport: 'No (Server/Docker required)',
  },
  {
    feature: 'Flowing Multi-Page Tables & Margins',
    docforge: 'Yes (CSS @page & print budget)',
    pdfme: 'Weak (Fixed X/Y canvas bias)',
    reactPdf: 'Partial (Manual break handling)',
    pdfmake: 'Yes (Auto-pagination)',
    jsreport: 'Yes (Headless Chrome flow)',
  },
  {
    feature: 'Tenant Customization in Database',
    docforge: 'Yes (Serializable JSON schema)',
    pdfme: 'Partial (Complex schemas)',
    reactPdf: 'No (Requires code deploy)',
    pdfmake: 'Partial (Raw JS objects)',
    jsreport: 'Partial (Template storage)',
  },
  {
    feature: 'Native Industrial Barcodes',
    docforge: 'Yes (Code128, Code39, QR SVG)',
    pdfme: 'Via plugin packages',
    reactPdf: 'Requires external SVG/images',
    pdfmake: 'Requires custom extensions',
    jsreport: 'Requires plugins',
  },
  {
    feature: 'Multi-Slip 2-Up Tiling',
    docforge: 'Yes (slipsPerSheet: 2 built-in)',
    pdfme: 'No (Manual coordinate math)',
    reactPdf: 'No (Manual component math)',
    pdfmake: 'No (Manual multi-table layout)',
    jsreport: 'No (Manual CSS tuning)',
  },
];

const CODE_EXAMPLE = `import React from 'react';
import { DocumentPreview, ReportTemplateDescriptor, DataDoc } from '@dotevolve/doc-forge';
import '@dotevolve/doc-forge/styles';

const descriptor: ReportTemplateDescriptor = {
  slug: 'purchase-order',
  name: 'Standard Purchase Order',
  version: 1,
  page: { size: 'A4', orientation: 'portrait', margins: { top: 10, right: 10, bottom: 10, left: 18 } },
  styles: { primaryColor: '#0f172a', accentColor: '#2563eb' },
  sections: [
    { id: 'header', type: 'header', showTitle: true, showDate: true },
    { id: 'items', type: 'table', tableKey: 'orderItems', showBorder: true },
    { id: 'footer', type: 'footer', showPageNumbers: true }
  ]
};

const data: DataDoc = {
  metadata: { documentTitle: 'Purchase Order', documentNumber: 'PO-2026-001' },
  units: [
    {
      unitId: 'po-1',
      tables: {
        orderItems: {
          columns: [
            { key: 'code', label: 'Item Code', widthPct: 20 },
            { key: 'desc', label: 'Description', widthPct: 50 },
            { key: 'total', label: 'Total', widthPct: 30, align: 'right' }
          ],
          rows: [
            { code: 'SKU-1', desc: 'Industrial Temperature Sensor', total: '$450.00' }
          ],
          emptyMessage: 'No items.'
        }
      }
    }
  ]
};

export function DocumentView() {
  return <DocumentPreview descriptor={descriptor} data={data} showToolbar={true} />;
}`;

export const ArchitectureComparisonModal: React.FC<ArchitectureComparisonModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLE);
    setCopyCodeSuccess(true);
    setTimeout(() => setCopyCodeSuccess(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  DocForge Architecture & Ecosystem Guide
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  MPL-2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Understanding the pure declarative document model, engine comparison, and licensing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close dialog (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 px-6 py-2.5 bg-slate-950/80 border-b border-slate-800/80 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Why DocForge?</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Comparison Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('license')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'license'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>License (MPL-2.0)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quickstart')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'quickstart'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Quick Start</span>
          </button>
        </nav>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & ARCHITECTURAL PILLARS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  The Missing Middle Ground in Document Generation
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Most document generation solutions force a hard compromise between low-level PDF
                  code generators (like <code className="text-indigo-400">@react-pdf</code> or{' '}
                  <code className="text-indigo-400">pdfmake</code>) that end-users cannot customize,
                  and heavyweight server-side report platforms (like{' '}
                  <code className="text-indigo-400">jsreport</code> or ActiveReports) that require
                  expensive Docker infrastructure.
                </p>
                <p className="text-sm text-slate-300 leading-relaxed mt-2">
                  <strong>DocForge</strong> delivers the missing middle ground: a 100% client-side
                  React document engine driven by JSON descriptors that can be customized live by
                  non-technical users and saved directly to any database.
                </p>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <Boxes className="w-4 h-4" />
                    <h4>1. Pure Declarative Descriptors</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Document layout, margins, typography, and section visibility are specified as
                    standard JSON (<code className="text-slate-200">ReportTemplateDescriptor</code>
                    ). Easily stored in Postgres, MySQL, or DynamoDB per tenant or user without
                    deploying new code.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <h4>2. Ready-Data Contract</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Zero arithmetic, rounding, or business logic in the rendering path (
                    <code className="text-slate-200">DataDoc</code>). All currencies, totals, and
                    dates are formatted before rendering, guaranteeing 100% deterministic,
                    side-effect-free document output.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                    <Printer className="w-4 h-4" />
                    <h4>3. Industrial Print & PDF Pagination</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Built-in support for exact 18mm filing margins, repeating table headers across
                    page breaks, dynamic CSS page counters (
                    <code className="text-slate-200">page-number</code>), and 2-Up multi-slip tiling
                    (<code className="text-slate-200">slipsPerSheet: 2</code>).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm">
                    <Cpu className="w-4 h-4" />
                    <h4>4. 100% In-Browser Execution</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Zero headless Chrome servers, zero Puppeteer container overhead, and zero
                    serverless invocation bills. Real-time WYSIWYG preview in milliseconds with
                    instant native browser print dialogs.
                  </p>
                </div>
              </div>

              {/* Callout Box */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/50 flex items-start gap-3 text-xs text-indigo-200">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">
                    Built-in Studio Modal Component
                  </strong>
                  Drop{' '}
                  <code className="bg-indigo-900/50 px-1 py-0.5 rounded text-indigo-300">
                    &lt;DocumentPreviewModal /&gt;
                  </code>{' '}
                  into any React view to instantly provide your users with a full-screen print setup
                  dialog with margin adjustments, column visibility toggles, and live paper zoom.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPARISON MATRIX */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  How DocForge Compares to Existing Engines
                </h3>
                <p className="text-xs text-slate-400">
                  Side-by-side analysis of popular document and PDF engines in the JavaScript and
                  React ecosystem.
                </p>
              </div>

              {/* Full Comparison Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden overflow-x-auto bg-slate-950/60 shadow-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300">
                      <th className="py-3 px-4 font-semibold w-1/4">Feature / Capability</th>
                      <th className="py-3 px-4 font-bold text-indigo-300 bg-indigo-950/30 border-x border-indigo-900/40">
                        DocForge (Ours)
                      </th>
                      <th className="py-3 px-4 font-semibold text-slate-300">pdfme</th>
                      <th className="py-3 px-4 font-semibold text-slate-300">@react-pdf</th>
                      <th className="py-3 px-4 font-semibold text-slate-300">pdfmake</th>
                      <th className="py-3 px-4 font-semibold text-slate-300">jsreport</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {COMPARISON_ROWS.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-200">{row.feature}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-400 bg-indigo-950/20 border-x border-indigo-900/30 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{row.docforge}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{row.pdfme}</td>
                        <td className="py-3 px-4 text-slate-400">{row.reactPdf}</td>
                        <td className="py-3 px-4 text-slate-400">{row.pdfmake}</td>
                        <td className="py-3 px-4 text-slate-400">{row.jsreport}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-slate-200 block">vs. pdfme</span>
                  <p className="text-slate-400 leading-relaxed">
                    pdfme relies on fixed X/Y coordinates suited for certificates and static cards.
                    DocForge excels at flowing multi-page business invoices, ledgers, and
                    repeat-header tables.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-slate-200 block">vs. @react-pdf</span>
                  <p className="text-slate-400 leading-relaxed">
                    @react-pdf is code-first (requires writing JSX). DocForge templates are pure
                    JSON schemas, allowing end-users to customize layouts without deploying new
                    code.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-slate-200 block">vs. jsreport</span>
                  <p className="text-slate-400 leading-relaxed">
                    jsreport requires hosting dedicated Node.js/Docker servers. DocForge executes
                    100% in the client browser with zero infrastructure bills.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LICENSE (MPL-2.0) */}
          {activeTab === 'license' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Mozilla Public License Version 2.0 (MPL-2.0)
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  DocForge is open-source under the{' '}
                  <strong>Mozilla Public License 2.0 (MPL-2.0)</strong>. This license strikes the
                  ideal balance between permissive adoption for SaaS builders and protection for the
                  core engine.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <h4>Safe for Commercial & Proprietary SaaS</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Unlike GPL/AGPL, MPL-2.0 is a <strong>file-level</strong> license, not a
                    project-level one. Any business or closed-source application can{' '}
                    <code className="text-slate-200">npm install @dotevolve/doc-forge</code> and use
                    it without open-sourcing their own application or backend code.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <h4>Protection Against Secret Forks</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    If someone forks or modifies the core files inside DocForge, they{' '}
                    <strong>must share those file improvements back</strong> under MPL-2.0.
                    Competitors cannot take DocForge's engine, secretly enhance it, and close the
                    source.
                  </p>
                </div>
              </div>

              {/* Patent & Brand Clause */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <strong className="text-slate-200 font-semibold block text-sm">
                  Patent Grant & Trademark Reservation
                </strong>
                <p className="text-slate-400 leading-relaxed">
                  MPL-2.0 includes an explicit, royalty-free patent grant from all contributors with
                  an automatic retaliation clause (if someone sues over patents regarding DocForge,
                  their license is revoked). It also explicitly reserves trademarks, protecting the
                  DotEvolve and DocForge brand identities.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: QUICK START */}
          {activeTab === 'quickstart' && (
            <div className="space-y-4 max-w-4xl">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Quick Start: Integrate in 3 Steps
                </h3>
                <p className="text-xs text-slate-400">
                  DocForge is published on GitHub Packages under{' '}
                  <code className="text-indigo-400">@dotevolve/doc-forge</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
                <div className="text-slate-400"># 1. Install package and peers</div>
                <div className="text-emerald-400 select-all">
                  npm install @dotevolve/doc-forge react-to-print lucide-react
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border border-slate-800 rounded-t-lg text-xs">
                  <span className="font-mono text-slate-400">MyPrintDocument.tsx</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
                  >
                    {copyCodeSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950/80 border border-t-0 border-slate-800 rounded-b-lg font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto max-h-[45vh]">
                  {CODE_EXAMPLE}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span>DotEvolve Open Source</span>
            <span>•</span>
            <span className="font-mono text-slate-500">DocForge v0.1.3</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/DotEvolve/doc-forge"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};
