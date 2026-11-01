import { ReportTemplateDescriptor } from './types';
import { normalizeTemplateDescriptor } from './schemas';

import jobSlipJson from './templates/job-slip.json';
import articlesReportJson from './templates/articles-report.json';
import ledgerReportJson from './templates/ledger-report.json';
import workerJobsReportJson from './templates/worker-jobs-report.json';
import tasksReportJson from './templates/tasks-report.json';

/**
 * Standard factory-default margins adhering to 18mm left filing requirement
 */
export const FACTORY_PAGE_MARGINS = {
  top: 10,
  right: 10,
  bottom: 10,
  left: 18,
};
export const DEFAULT_PAGE_MARGINS = FACTORY_PAGE_MARGINS;

export const DEFAULT_JOB_SLIP_DESCRIPTOR: ReportTemplateDescriptor =
  normalizeTemplateDescriptor(jobSlipJson);
export const DEFAULT_REPORT_ARTICLES_DESCRIPTOR: ReportTemplateDescriptor =
  normalizeTemplateDescriptor(articlesReportJson);
export const DEFAULT_LEDGER_DESCRIPTOR: ReportTemplateDescriptor =
  normalizeTemplateDescriptor(ledgerReportJson);
export const DEFAULT_WORKER_JOBS_DESCRIPTOR: ReportTemplateDescriptor =
  normalizeTemplateDescriptor(workerJobsReportJson);
export const DEFAULT_REPORT_TASKS_DESCRIPTOR: ReportTemplateDescriptor =
  normalizeTemplateDescriptor(tasksReportJson);

export const DEFAULT_REPORT_ARTICLES_DETAIL_DESCRIPTOR: ReportTemplateDescriptor = {
  ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
  slug: 'report-articles-detail',
  name: 'Article Detail Report',
  page: {
    ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR.page,
    orientation: 'landscape',
  },
};

export const DEFAULT_REPORT_ARTICLES_DETAIL_GROUPED_DESCRIPTOR: ReportTemplateDescriptor = {
  ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
  slug: 'report-articles-detail-grouped',
  name: 'Article Detail Report (Grouped)',
  page: {
    ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR.page,
    orientation: 'portrait',
  },
};

export const DEFAULT_GENERIC_REPORT_DESCRIPTOR: ReportTemplateDescriptor = {
  ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
  slug: 'generic-report',
  name: 'Standard Report',
  page: {
    ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR.page,
    orientation: 'portrait',
  },
  styles: {
    ...DEFAULT_REPORT_ARTICLES_DESCRIPTOR.styles,
    lineHeight: 1.35,
  },
};

export const DEFAULT_FALLBACK_DESCRIPTOR: ReportTemplateDescriptor =
  DEFAULT_GENERIC_REPORT_DESCRIPTOR;

/**
 * Bundled offline dictionary indexed by slug (Layer 0 offline resilience)
 * Maps both canonical and legacy slug variants for maximum compatibility.
 */
export const BUNDLED_DEFAULT_DESCRIPTORS: Record<string, ReportTemplateDescriptor> = {
  'job-slip': DEFAULT_JOB_SLIP_DESCRIPTOR,
  'articles-report': DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
  'report-articles': DEFAULT_REPORT_ARTICLES_DESCRIPTOR,
  'report-articles-detail': DEFAULT_REPORT_ARTICLES_DETAIL_DESCRIPTOR,
  'articles-detail-report': DEFAULT_REPORT_ARTICLES_DETAIL_DESCRIPTOR,
  'report-articles-detail-grouped': DEFAULT_REPORT_ARTICLES_DETAIL_GROUPED_DESCRIPTOR,
  'articles-detail-grouped-report': DEFAULT_REPORT_ARTICLES_DETAIL_GROUPED_DESCRIPTOR,
  ledger: DEFAULT_LEDGER_DESCRIPTOR,
  'ledger-report': DEFAULT_LEDGER_DESCRIPTOR,
  'worker-jobs-report': DEFAULT_WORKER_JOBS_DESCRIPTOR,
  'report-worker-jobs': DEFAULT_WORKER_JOBS_DESCRIPTOR,
  'tasks-report': DEFAULT_REPORT_TASKS_DESCRIPTOR,
  'report-tasks': DEFAULT_REPORT_TASKS_DESCRIPTOR,
  'generic-report': DEFAULT_GENERIC_REPORT_DESCRIPTOR,
  'report-jobs': DEFAULT_GENERIC_REPORT_DESCRIPTOR,
};

/**
 * Safely normalizes a template descriptor without throwing.
 * Resolves to the template's bundled default or the specified fallback if validation fails.
 */
export function safeNormalizeTemplateDescriptor(
  rawDesc: any,
  fallback?: ReportTemplateDescriptor
): ReportTemplateDescriptor {
  if (!rawDesc) {
    return fallback || DEFAULT_JOB_SLIP_DESCRIPTOR;
  }
  try {
    return normalizeTemplateDescriptor(rawDesc);
  } catch (err) {
    const slug = rawDesc?.slug;
    if (slug && BUNDLED_DEFAULT_DESCRIPTORS[slug]) {
      return BUNDLED_DEFAULT_DESCRIPTORS[slug];
    }
    return fallback || DEFAULT_JOB_SLIP_DESCRIPTOR;
  }
}
