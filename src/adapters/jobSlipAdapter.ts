import * as contrib from '../contrib/jobSlipAdapter';

/**
 * @deprecated Footwear size option interface. Domain adapter moved to `@dotevolve/doc-forge/contrib`.
 */
export type SizeOption = contrib.SizeOption;

/**
 * @deprecated Footwear job slip adapter options. Domain adapter moved to `@dotevolve/doc-forge/contrib`.
 */
export type JobSlipAdapterOptions = contrib.JobSlipAdapterOptions;

/**
 * @deprecated Footwear worker name resolver. Domain adapter moved to `@dotevolve/doc-forge/contrib`.
 */
export const resolveWorkerName: typeof contrib.resolveWorkerName = contrib.resolveWorkerName;

/**
 * @deprecated Footwear manufacturing job adapter. Domain adapter moved to `@dotevolve/doc-forge/contrib`.
 * For generic document creation, use `tabularReportAdapter` or build a `DataDoc` directly.
 */
export const jobToDataDoc: typeof contrib.jobToDataDoc = contrib.jobToDataDoc;
