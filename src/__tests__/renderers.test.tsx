import React from 'react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { DocumentRenderer } from '../DocumentRenderer';
import { DocumentPreview } from '../DocumentPreview';
import {
  DEFAULT_JOB_SLIP_DESCRIPTOR,
  DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
} from '../defaultDescriptors';
import { isNormalizedDescriptor, NORMALIZED_DESCRIPTOR_SYMBOL } from '../schemas';
import { jobToDataDoc } from '../adapters/jobSlipAdapter';
import { reportToDataDoc } from '../adapters/tabularReportAdapter';

describe('DocForge Renderers & Primitives', () => {
  it('renders a full Job Slip document with 2-Up tiled units and cut line', () => {
    const mockJob = {
      jobId: 'JOB-7701',
      jobDate: '2026-10-20',
      jobStatus: 'Pending',
      steps: [
        { order: 1, stepName: 'Cutting', workerId: 'w1' },
        { order: 2, stepName: 'Stitching', workerId: 'w2' },
      ],
      items: [
        {
          articleName: 'Derby Classic',
          totalQuantity: 100,
          quantities: { '8': 60, '9': 40 },
          attributes: { Color: 'Black' },
        },
      ],
    };

    const dataDoc = jobToDataDoc(mockJob, {
      tenantName: 'SoleCraft Ltd',
      sizeRange: [{ name: '8' }, { name: '9' }],
      stepNames: ['Cutting', 'Stitching'],
      workerMap: { w1: 'Rashid', w2: 'Tariq' },
    });

    const { container } = render(
      <DocumentRenderer data={dataDoc} descriptor={DEFAULT_JOB_SLIP_DESCRIPTOR} />
    );

    // Verify slip sections rendered
    expect(container.querySelectorAll('.print-doc__slip')).toHaveLength(2);
    expect(screen.getByText(/Cutting Copy/i)).toBeInTheDocument();
    expect(screen.getByText(/Stitching Copy/i)).toBeInTheDocument();

    // Verify cut line rendered between 2 slips
    expect(container.querySelector('.print-doc__slip-cut')).toBeInTheDocument();

    // Verify sizes table content
    expect(screen.getAllByText('Derby Classic').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100').length).toBeGreaterThan(0);
  });

  it('renders a tabular report with DocumentRenderer', () => {
    const dataDoc = reportToDataDoc(
      'Daily Article Inventory',
      [
        { key: 'code', label: 'Article Code', widthPct: 30 },
        { key: 'stock', label: 'In Stock', widthPct: 70, align: 'right' },
      ],
      [
        { code: 'ART-01', stock: 50 },
        { code: 'ART-02', stock: 120 },
      ],
      {
        tenantName: 'Floorix Manufacturing',
        tableKey: 'articles',
      }
    );

    const { container } = render(
      <DocumentRenderer data={dataDoc} descriptor={DEFAULT_REPORT_ARTICLES_DESCRIPTOR} />
    );

    expect(screen.getByText('Daily Article Inventory')).toBeInTheDocument();
    expect(screen.getByText('ART-01')).toBeInTheDocument();
    expect(screen.getByText('ART-02')).toBeInTheDocument();
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('does not fall back to main when an explicit tableKey is not found', () => {
    const dataDoc = reportToDataDoc(
      'Document',
      [{ key: 'name', label: 'Name' }],
      [{ name: 'Widget' }],
      { tableKey: 'main' }
    );

    const descriptor = {
      ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
      sections: [
        {
          id: 'sec-missing',
          type: 'table' as const,
          tableKey: 'nonExistentTable',
          visible: true,
        },
      ],
    };

    const { container } = render(<DocumentRenderer data={dataDoc} descriptor={descriptor} />);
    expect(container.querySelector('table')).toBeNull();
  });

  it('renders footer page number as empty span reliant on CSS counters', () => {
    const dataDoc = reportToDataDoc('Report', [{ key: 'id', label: 'ID' }], [{ id: '1' }]);

    const { container } = render(
      <DocumentRenderer data={dataDoc} descriptor={DEFAULT_REPORT_ARTICLES_DESCRIPTOR} />
    );

    const pageNumSpan = container.querySelector('.print-doc__page-num .page-number');
    expect(pageNumSpan).toBeInTheDocument();
    expect(pageNumSpan?.textContent).toBe('');
  });

  it('renders interactive DocumentPreview simulator with toolbar and filing guide', () => {
    const { container } = render(<DocumentPreview descriptor={DEFAULT_JOB_SLIP_DESCRIPTOR} />);

    // Verify toolbar title
    expect(screen.getByText(DEFAULT_JOB_SLIP_DESCRIPTOR.name)).toBeInTheDocument();
    // Verify physical sheet container
    expect(container.querySelector('.report-sheet')).toBeInTheDocument();
    // Verify filing guide overlay
    expect(screen.getByText(/Printable Content/i)).toBeInTheDocument();
  });

  it('verifies that barcode section is removed from default job slip descriptor', () => {
    const barcodeSec = DEFAULT_JOB_SLIP_DESCRIPTOR.sections?.find((s) => s.type === 'barcode');
    expect(barcodeSec).toBeUndefined();
  });

  it('suppresses duplicate cell values in consecutive table rows', () => {
    const dataDoc = reportToDataDoc(
      'Articles with Duplicates',
      [
        { key: 'article', label: 'Article', widthPct: 50, suppressDuplicates: true },
        { key: 'color', label: 'Color', widthPct: 50 },
      ],
      [
        { article: 'Derby Oxford', color: 'Black' },
        { article: 'Derby Oxford', color: 'Brown' }, // Duplicate article should be blanked
        { article: 'Chelsea Boot', color: 'Tan' },
      ],
      { tenantName: 'SoleCraft' }
    );

    const descriptor = {
      ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
      sections: [
        {
          id: 'sec-table',
          type: 'table' as const,
          tableKey: 'main',
          visible: true,
          suppressDuplicates: ['article'],
        },
      ],
    };

    const { container } = render(<DocumentRenderer data={dataDoc} descriptor={descriptor} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);

    // Row 0 has "Derby Oxford"
    expect(rows[0].children[0].textContent).toBe('Derby Oxford');
    // Row 1 has duplicate suppressed -> empty string
    expect(rows[1].children[0].textContent).toBe('');
    // Row 2 has "Chelsea Boot"
    expect(rows[2].children[0].textContent).toBe('Chelsea Boot');
  });

  it('allows section.suppressDuplicates = false to explicitly disable suppression even if column sets suppressDuplicates: true', () => {
    const dataDoc = reportToDataDoc(
      'Articles with Duplicates',
      [
        { key: 'article', label: 'Article', widthPct: 50, suppressDuplicates: true },
        { key: 'color', label: 'Color', widthPct: 50 },
      ],
      [
        { article: 'Derby Oxford', color: 'Black' },
        { article: 'Derby Oxford', color: 'Brown' },
      ],
      { tenantName: 'SoleCraft' }
    );

    const descriptor = {
      ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
      sections: [
        {
          id: 'sec-table',
          type: 'table' as const,
          tableKey: 'main',
          visible: true,
          suppressDuplicates: false,
        },
      ],
    };

    const { container } = render(<DocumentRenderer data={dataDoc} descriptor={descriptor} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);

    // Row 1 must retain "Derby Oxford" because suppression was disabled at section level
    expect(rows[0].children[0].textContent).toBe('Derby Oxford');
    expect(rows[1].children[0].textContent).toBe('Derby Oxford');
  });

  it('does not suppress dependent column (__merged) if parent column (article) differs between rows', () => {
    const dataDoc = reportToDataDoc(
      'Hierarchical Duplicate Test',
      [
        { key: 'article', label: 'Article', widthPct: 50 },
        { key: '__merged', label: 'Details', widthPct: 50 },
      ],
      [
        { article: 'Derby Oxford', __merged: 'Black Leather' },
        // Same details, but DIFFERENT article: __merged must NOT be suppressed!
        { article: 'Brogue Oxford', __merged: 'Black Leather' },
        // Same article and same details: both article and __merged MUST be suppressed!
        { article: 'Brogue Oxford', __merged: 'Black Leather' },
      ],
      { tenantName: 'SoleCraft' }
    );

    const descriptor = {
      ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
      sections: [
        {
          id: 'sec-table',
          type: 'table' as const,
          tableKey: 'main',
          visible: true,
          suppressDuplicates: ['article', '__merged'],
        },
      ],
    };

    const { container } = render(<DocumentRenderer data={dataDoc} descriptor={descriptor} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);

    // Row 0: Derby Oxford, Black Leather
    expect(rows[0].children[0].textContent).toBe('Derby Oxford');
    expect(rows[0].children[1].textContent).toBe('Black Leather');

    // Row 1: Brogue Oxford, Black Leather (retained because article changed!)
    expect(rows[1].children[0].textContent).toBe('Brogue Oxford');
    expect(rows[1].children[1].textContent).toBe('Black Leather');

    // Row 2: Same article (blanked), Same details (blanked)
    expect(rows[2].children[0].textContent).toBe('');
    expect(rows[2].children[1].textContent).toBe('');
  });

  it('does not blank numeric quantity and total cells when suppressDuplicates is set to true', () => {
    const dataDoc = reportToDataDoc(
      'Numeric Deduplication Safety Test',
      [
        { key: 'category', label: 'Category', widthPct: 40 },
        { key: 'qty', label: 'Quantity', widthPct: 30, align: 'right' },
        { key: 'total', label: 'Total', widthPct: 30, align: 'right' },
      ],
      [
        { category: 'Footwear', qty: 100, total: 5000 },
        // Same category, and identical qty/total: category should be blanked, but qty and total MUST NOT be blanked!
        { category: 'Footwear', qty: 100, total: 5000 },
      ],
      { tenantName: 'SoleCraft' }
    );

    const descriptor = {
      ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
      sections: [
        {
          id: 'sec-table',
          type: 'table' as const,
          tableKey: 'main',
          visible: true,
          suppressDuplicates: true,
        },
      ],
    };

    const { container } = render(<DocumentRenderer data={dataDoc} descriptor={descriptor} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);

    // Row 0
    expect(rows[0].children[0].textContent).toBe('Footwear');
    expect(rows[0].children[1].textContent).toBe('100');
    expect(rows[0].children[2].textContent).toBe('5000');

    // Row 1: Category blanked, but numeric qty and total preserved!
    expect(rows[1].children[0].textContent).toBe('');
    expect(rows[1].children[1].textContent).toBe('100');
    expect(rows[1].children[2].textContent).toBe('5000');
  });

  it('blanks repeated duplicate cells in sibling attribute columns (e.g. sole, material) even when another attribute (e.g. color) changes within the same article', () => {
    const dataDoc = reportToDataDoc(
      'Sibling Attribute Deduplication Test',
      [
        { key: 'article', label: 'Article', widthPct: 25 },
        { key: 'color', label: 'Color', widthPct: 25 },
        { key: 'sole', label: 'Sole', widthPct: 25 },
        { key: 'material', label: 'Material', widthPct: 25 },
      ],
      [
        { article: '85556', color: 'Black', sole: '261 wispy', material: 'Knot Polish' },
        // Same article, different color, but SAME sole and material:
        // Article, sole, and material should be blanked; color should be displayed!
        { article: '85556', color: 'Taupe', sole: '261 wispy', material: 'Knot Polish' },
        // Same article, different color, different sole, same material:
        // Article and material should be blanked; color and sole should be displayed!
        { article: '85556', color: 'Brown', sole: 'TPR Sole', material: 'Knot Polish' },
        // NEW article: all columns should be displayed!
        { article: '85557', color: 'Brown', sole: 'TPR Sole', material: 'Knot Polish' },
      ],
      { tenantName: 'SoleCraft' }
    );

    const descriptor = {
      ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
      sections: [
        {
          id: 'sec-table',
          type: 'table' as const,
          tableKey: 'main',
          visible: true,
          suppressDuplicates: true,
        },
      ],
    };

    const { container } = render(<DocumentRenderer data={dataDoc} descriptor={descriptor} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(4);

    // Row 0: All shown
    expect(rows[0].children[0].textContent).toBe('85556');
    expect(rows[0].children[1].textContent).toBe('Black');
    expect(rows[0].children[2].textContent).toBe('261 wispy');
    expect(rows[0].children[3].textContent).toBe('Knot Polish');

    // Row 1: Article blank, Color shown, Sole blank, Material blank
    expect(rows[1].children[0].textContent).toBe('');
    expect(rows[1].children[1].textContent).toBe('Taupe');
    expect(rows[1].children[2].textContent).toBe('');
    expect(rows[1].children[3].textContent).toBe('');

    // Row 2: Article blank, Color shown, Sole shown, Material blank
    expect(rows[2].children[0].textContent).toBe('');
    expect(rows[2].children[1].textContent).toBe('Brown');
    expect(rows[2].children[2].textContent).toBe('TPR Sole');
    expect(rows[2].children[3].textContent).toBe('');

    // Row 3: New Article -> all shown!
    expect(rows[3].children[0].textContent).toBe('85557');
    expect(rows[3].children[1].textContent).toBe('Brown');
    expect(rows[3].children[2].textContent).toBe('TPR Sole');
    expect(rows[3].children[3].textContent).toBe('Knot Polish');
  });

  it('respects explicitly configured section.groupKey (e.g. sku) regardless of column ordering', () => {
    // Notice columns order: 'warehouse' is column 0, 'sku' is column 1, 'description' is column 2
    const dataDoc = reportToDataDoc(
      'Configurable GroupKey Test',
      [
        { key: 'warehouse', label: 'Warehouse', widthPct: 30 },
        { key: 'sku', label: 'SKU', widthPct: 30 },
        { key: 'description', label: 'Description', widthPct: 40 },
      ],
      [
        { warehouse: 'WH-East', sku: 'SKU-001', description: 'Standard Pack' },
        // Same sku, same warehouse, same description -> deduplicates
        { warehouse: 'WH-East', sku: 'SKU-001', description: 'Standard Pack' },
        // Different sku, same warehouse -> new sku group, warehouse and sku should both render!
        { warehouse: 'WH-East', sku: 'SKU-002', description: 'Standard Pack' },
      ],
      { tenantName: 'Warehouse Corp' }
    );

    const descriptor = {
      ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
      sections: [
        {
          id: 'sec-table',
          type: 'table' as const,
          tableKey: 'main',
          visible: true,
          suppressDuplicates: true,
          groupKey: 'sku', // explicitly set groupKey to 'sku'
        },
      ],
    };

    const { container } = render(<DocumentRenderer data={dataDoc} descriptor={descriptor} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);

    // Row 0: All shown
    expect(rows[0].children[0].textContent).toBe('WH-East');
    expect(rows[0].children[1].textContent).toBe('SKU-001');
    expect(rows[0].children[2].textContent).toBe('Standard Pack');

    // Row 1: Same SKU -> duplicate values blanked
    expect(rows[1].children[0].textContent).toBe('');
    expect(rows[1].children[1].textContent).toBe('');
    expect(rows[1].children[2].textContent).toBe('');

    // Row 2: SKU changed -> reset! Even though warehouse ('WH-East') matches previous row,
    // it belongs to a new SKU group and must render!
    expect(rows[2].children[0].textContent).toBe('WH-East');
    expect(rows[2].children[1].textContent).toBe('SKU-002');
    expect(rows[2].children[2].textContent).toBe('Standard Pack');
  });

  it('correctly marks descriptors with NORMALIZED_DESCRIPTOR_SYMBOL sentinel', () => {
    expect(isNormalizedDescriptor(DEFAULT_JOB_SLIP_DESCRIPTOR)).toBe(true);
    expect(isNormalizedDescriptor({ slug: 'raw', version: 1 })).toBe(false);
  });

  it('runs raw descriptors through normalization when rendered directly', () => {
    const rawDescriptor = {
      slug: 'raw-custom',
      name: 'Raw Report',
      version: 1,
      page: {
        size: 'A4' as const,
        orientation: 'portrait' as const,
        margins: { top: 10, right: 10, bottom: 10, left: 18 },
      },
      styles: {
        primaryColor: '#123456',
      },
      sections: [
        {
          id: 'h',
          type: 'header' as const,
          visible: true,
          showTitle: true,
        },
      ],
    };

    expect(isNormalizedDescriptor(rawDescriptor)).toBe(false);

    const dataDoc = reportToDataDoc('Title', [], []);
    const { container } = render(
      <DocumentRenderer data={dataDoc} descriptor={rawDescriptor as any} />
    );

    expect(container.querySelector('.print-doc__header')).toBeInTheDocument();
  });

  it('exports DocumentStudio and DocForgeStudio alias from package index', async () => {
    const { DocumentStudio, DocForgeStudio } = await import('../index');
    expect(DocumentStudio).toBeDefined();
    expect(DocForgeStudio).toBeDefined();
    expect(DocumentStudio).toBe(DocForgeStudio);
  });
});
