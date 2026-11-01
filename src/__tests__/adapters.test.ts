import { describe, it, expect } from 'vitest';
import { jobToDataDoc, resolveWorkerName } from '../adapters/jobSlipAdapter';
import { reportToDataDoc } from '../adapters/tabularReportAdapter';

describe('DocForge Domain Adapters', () => {
  describe('jobSlipAdapter', () => {
    it('resolves worker names accurately for objects, ids, and unassigned', () => {
      const workerMap = {
        w1: { firstName: 'Ali', lastName: 'Khan' },
        w2: 'Babur',
      };
      expect(resolveWorkerName(null, workerMap)).toBe('Unassigned');
      expect(resolveWorkerName('w1', workerMap)).toBe('Ali Khan');
      expect(resolveWorkerName('w2', workerMap)).toBe('Babur');
      expect(resolveWorkerName('non-existent', workerMap)).toBe('Unassigned');
      expect(resolveWorkerName({ firstName: 'None', lastName: '' })).toBe('Unassigned');
      expect(resolveWorkerName({ firstName: 'Zayd', lastName: 'Ahmad' })).toBe('Zayd Ahmad');
    });

    it('transforms a complex Floorix Job into ready-data DataDoc with multi-slip units', () => {
      const mockJob = {
        jobId: '10842',
        jobDate: '2026-10-18T00:00:00.000Z',
        jobStatus: 'In Production',
        steps: [
          { order: 1, stepName: 'Cutting', workerId: 'w1' },
          { order: 2, stepName: 'Stitching', workerId: 'w2' },
        ],
        items: [
          {
            articleName: 'Derby Oxford',
            totalQuantity: 50,
            quantities: { '7': 20, '8': 30 },
            attributes: { Color: 'Black', Material: 'Leather' },
          },
          {
            articleName: 'Derby Oxford',
            totalQuantity: 70,
            quantities: { '7': 30, '8': 40 },
            attributes: { Color: 'Brown', Material: 'Suede' },
          },
        ],
      };

      const doc = jobToDataDoc(mockJob, {
        tenantName: 'SoleCraft Industries',
        sizeRange: [{ name: '7' }, { name: '8' }],
        articleAttributes: [
          { name: 'Color', label: 'Color', isGlobal: false },
          { name: 'Material', label: 'Material', isGlobal: false },
        ],
        workerMap: {
          w1: { firstName: 'Rashid', lastName: 'Minhas' },
          w2: { firstName: 'Tariq', lastName: 'Aziz' },
        },
        stepNames: ['Cutting', 'Stitching'],
      });

      expect(doc.metadata.tenantName).toBe('SoleCraft Industries');
      expect(doc.metadata.documentNumber).toBe('10842');
      expect(doc.summaries?.jobNumber).toBe('10842');
      expect(doc.summaries?.totalPairs).toBe(120);

      // Verify barcode payload
      expect(doc.barcodes?.jobNumber?.value).toBe('10842');
      expect(doc.barcodes?.jobNumber?.format).toBe('CODE128');

      // Verify multi-unit tiling generation (one unit per step)
      expect(doc.units).toHaveLength(2);
      expect(doc.units[0].unitTitle).toBe('Cutting Copy');
      expect(doc.units[0].summaries?.worker).toBe('Rashid Minhas');
      expect(doc.units[1].unitTitle).toBe('Stitching Copy');
      expect(doc.units[1].summaries?.worker).toBe('Tariq Aziz');

      // Verify sizes table pre-calculations (zero math in engine)
      const sizesTable = doc.units[0].tables?.sizes;
      expect(sizesTable).toBeDefined();
      expect(sizesTable?.rows).toHaveLength(2);
      expect(sizesTable?.rows[0].total).toBe(50);
      expect(sizesTable?.rows[1].total).toBe(70);

      // Verify footer totals row
      expect(sizesTable?.footerRow?.article).toBe('Total');
      expect(sizesTable?.footerRow?.size_7).toBe(50);
      expect(sizesTable?.footerRow?.size_8).toBe(70);
      expect(sizesTable?.footerRow?.total).toBe(120);
    });
  });

  describe('tabularReportAdapter', () => {
    it('formats currencies, dates, and numbers according to ready-data contract', () => {
      const columns = [
        { key: 'code', label: 'SKU Code' },
        { key: 'amount', label: 'Cost', format: 'currency' as const },
        { key: 'date', label: 'Creation Date', format: 'date' as const },
        { key: 'qty', label: 'Pairs', format: 'number' as const },
        { key: 'missing', label: 'Optional Field' },
      ];

      const rawRows = [
        {
          code: 'ART-99',
          amount: 14500,
          date: '2026-10-15T12:00:00Z',
          qty: 450,
          missing: null,
        },
      ];

      const doc = reportToDataDoc('Inventory Summary', columns, rawRows, {
        tenantName: 'Floorix Manufacturing',
        meta: [
          { label: 'Category', value: 'Formal Shoes' },
          { label: 'Period', value: 'Q4 2026' },
        ],
      });

      expect(doc.metadata.documentTitle).toBe('Inventory Summary');
      expect(doc.summaries?.Category).toBe('Formal Shoes');
      expect(doc.summaries?.Period).toBe('Q4 2026');

      const table = doc.units[0].tables?.main;
      expect(table).toBeDefined();
      expect(table?.rows).toHaveLength(1);

      const row = table?.rows[0];
      // Ready-Data assertions:
      expect(row?.code).toBe('ART-99');
      expect(row?.amount).toBe('₹14,500'); // Formatted currency string
      expect(typeof row?.date).toBe('string');
      expect(row?.date).toMatch(/2026/); // Formatted date string
      expect(row?.qty).toBe(450); // Preserved numeric value
      expect(row?.missing).toBe('—'); // Handled null with em-dash
    });
  });
});
