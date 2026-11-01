import { describe, it, expect } from 'vitest';
import {
  DataDocSchema,
  ReportTemplateDescriptorSchema,
  normalizeTemplateDescriptor,
  safeNormalizeTemplateDescriptor,
  DEFAULT_JOB_SLIP_DESCRIPTOR,
  DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
  DEFAULT_LEDGER_DESCRIPTOR,
  DEFAULT_WORKER_JOBS_DESCRIPTOR,
  DEFAULT_REPORT_TASKS_DESCRIPTOR,
  BUNDLED_DEFAULT_DESCRIPTORS,
  computeReportStyleVariables,
  buildDynamicPrintPageStyle,
} from '../index';

describe('DocForge Canonical Schemas & Bridge', () => {
  describe('DataDocSchema', () => {
    it('validates a well-formed DataDoc with single and multi units', () => {
      const validDoc = {
        metadata: {
          documentTitle: 'Production Job Slip',
          documentNumber: 'DOC-12345',
          documentDate: '2026-10-20',
          tenantName: 'Floorix Manufacturing',
        },
        summaries: {
          jobNumber: 'J-1001',
          articleName: 'Oxford Classic',
          totalPairs: 120,
        },
        units: [
          {
            unitId: 'unit-1',
            unitNumber: 1,
            unitTitle: 'Cutting Slip',
            summaries: { step: 'Cutting', worker: 'John Doe' },
          },
          {
            unitId: 'unit-2',
            unitNumber: 2,
            unitTitle: 'Stitching Slip',
            summaries: { step: 'Stitching', worker: 'Jane Smith' },
          },
        ],
      };

      const result = DataDocSchema.safeParse(validDoc);
      expect(result.success).toBe(true);
    });

    it('fails validation when documentTitle is missing', () => {
      const invalidDoc = {
        metadata: {
          documentTitle: '',
        },
        units: [],
      };
      const result = DataDocSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
    });
  });

  describe('ReportTemplateDescriptorSchema', () => {
    it('validates bundled default descriptors', () => {
      expect(ReportTemplateDescriptorSchema.safeParse(DEFAULT_JOB_SLIP_DESCRIPTOR).success).toBe(
        true
      );
      expect(
        ReportTemplateDescriptorSchema.safeParse(DEFAULT_REPORT_ARTICLES_DESCRIPTOR).success
      ).toBe(true);
      expect(ReportTemplateDescriptorSchema.safeParse(DEFAULT_LEDGER_DESCRIPTOR).success).toBe(
        true
      );
      expect(ReportTemplateDescriptorSchema.safeParse(DEFAULT_WORKER_JOBS_DESCRIPTOR).success).toBe(
        true
      );
      expect(
        ReportTemplateDescriptorSchema.safeParse(DEFAULT_REPORT_TASKS_DESCRIPTOR).success
      ).toBe(true);
    });

    it('rejects margins out of allowed range (5mm - 50mm)', () => {
      const invalid = {
        ...DEFAULT_JOB_SLIP_DESCRIPTOR,
        page: {
          ...DEFAULT_JOB_SLIP_DESCRIPTOR.page,
          margins: { top: 2, right: 10, bottom: 10, left: 60 },
        },
      };
      const result = ReportTemplateDescriptorSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('normalizeTemplateDescriptor shim', () => {
    it('passes through already-normalized descriptors with sections unchanged', () => {
      const normalized = normalizeTemplateDescriptor(DEFAULT_JOB_SLIP_DESCRIPTOR);
      expect((normalized.sections || []).length).toBeGreaterThan(0);
      expect(normalized.slug).toBe('job-slip');
    });

    it('synthesizes section blueprints from legacy flat descriptor format', () => {
      const legacyDesc = {
        slug: 'legacy-report',
        name: 'Legacy Report',
        version: 1,
        page: {
          size: 'A4',
          orientation: 'portrait',
          margins: { top: 10, right: 10, bottom: 10, left: 18 },
        },
        header: {
          tenantName: 'Acme Shoes',
          title: 'Legacy Title',
          showDate: true,
        },
        metaFields: [
          { id: 'f1', label: 'Field 1' },
          { id: 'f2', label: 'Field 2' },
        ],
        tables: [
          {
            id: 'legacyTable',
            columns: [{ key: 'c1', label: 'Col 1', widthPct: 100 }],
            zebra: true,
          },
        ],
        styles: {
          primaryColor: '#123456',
          accentColor: '#654321',
          headerBgColor: '#e0e0e0',
          zebraBgColor: '#f5f5f5',
          fontFamily: 'Helvetica',
          fontSizePt: 10,
          lineHeight: 1.4,
          headingFontWeight: '700',
          subheadingFontWeight: '600',
          bodyFontWeight: '400',
          headerFontSizePt: 14,
          tableFontSizePt: 9,
          metaFontSizePt: 8,
          cellPadding: 'normal',
        },
        footer: {
          showPageNumbers: true,
          customNote: 'Legacy footer note',
        },
      };

      const normalized = normalizeTemplateDescriptor(legacyDesc);
      expect((normalized.sections || []).length).toBeGreaterThanOrEqual(4);
      const sectionTypes = (normalized.sections || []).map((s) => s.type);
      expect(sectionTypes).toContain('header');
      expect(sectionTypes).toContain('key-value-grid');
      expect(sectionTypes).toContain('table');
      expect(sectionTypes).toContain('footer');
    });

    it('throws error when non-object is passed to normalizeTemplateDescriptor', () => {
      expect(() => normalizeTemplateDescriptor(null)).toThrow();
      expect(() => normalizeTemplateDescriptor('invalid')).toThrow();
    });

    it('throws validation error when descriptor with sections contains invalid schema instead of synthesizing legacy fallback', () => {
      const invalidSectionDesc = {
        ...DEFAULT_JOB_SLIP_DESCRIPTOR,
        page: {
          ...DEFAULT_JOB_SLIP_DESCRIPTOR.page,
          margins: { top: -5, right: 10, bottom: 10, left: 10 },
        },
      };
      expect(() => normalizeTemplateDescriptor(invalidSectionDesc)).toThrow(
        /TemplateDescriptor validation failed/
      );
    });

    it('safeNormalizeTemplateDescriptor returns bundled template without throwing on invalid input', () => {
      const invalidSectionDesc = {
        slug: 'job-slip',
        page: {
          margins: { top: -5 },
        },
        sections: [{ id: 's1', type: 'header' }],
      };
      const result = safeNormalizeTemplateDescriptor(invalidSectionDesc);
      expect(result).toBeDefined();
      expect(result.slug).toBe('job-slip');
      expect(result.sections?.length).toBeGreaterThan(0);
    });
  });

  describe('reportStyleBridge', () => {
    it('computes both --doc-* and mirrored --report-* variables', () => {
      const vars = computeReportStyleVariables(DEFAULT_JOB_SLIP_DESCRIPTOR);
      expect(vars['--doc-page-margin-left']).toBe('18mm');
      expect(vars['--report-page-margin-left']).toBe('18mm');
      expect(vars['--doc-content-width-mm']).toBe('182mm');
      expect(vars['--report-content-width-mm']).toBe('182mm');
      expect(vars['--doc-primary-color']).toBe('#000000');
      expect(vars['--report-primary-color']).toBe('#000000');
    });

    it('generates dynamic @page print CSS rules', () => {
      const css = buildDynamicPrintPageStyle('portrait', {
        top: 12,
        right: 12,
        bottom: 12,
        left: 18,
      });
      expect(css).toBe('@page { size: A4 portrait; margin: 12mm 12mm 12mm 18mm; }');
    });
  });

  describe('BUNDLED_DEFAULT_DESCRIPTORS dictionary', () => {
    it('contains all 5 core document templates indexed by primary slug and aliases', () => {
      expect(BUNDLED_DEFAULT_DESCRIPTORS['job-slip']).toBeDefined();
      expect(BUNDLED_DEFAULT_DESCRIPTORS['articles-report']).toBeDefined();
      expect(BUNDLED_DEFAULT_DESCRIPTORS['report-articles']).toBeDefined();
      expect(BUNDLED_DEFAULT_DESCRIPTORS['ledger']).toBeDefined();
      expect(BUNDLED_DEFAULT_DESCRIPTORS['ledger-report']).toBeDefined();
      expect(BUNDLED_DEFAULT_DESCRIPTORS['worker-jobs-report']).toBeDefined();
      expect(BUNDLED_DEFAULT_DESCRIPTORS['report-worker-jobs']).toBeDefined();
      expect(BUNDLED_DEFAULT_DESCRIPTORS['tasks-report']).toBeDefined();
      expect(BUNDLED_DEFAULT_DESCRIPTORS['report-tasks']).toBeDefined();
    });
  });
});
