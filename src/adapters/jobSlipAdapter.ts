import { DataDoc, DataDocTable, DataDocUnit } from '../dataDoc';
import { ReportTemplateDescriptor } from '../types';
import { formatPrintDate } from '../print';

export interface SizeOption {
  name: string;
  defaultValue?: number;
}

export interface JobSlipAdapterOptions {
  tenantName?: string;
  articleAttributes?: any[];
  workerMap?: Record<string, any>;
  sizeRange?: SizeOption[];
  stepNames?: string[];
  descriptor?: ReportTemplateDescriptor;
  inspectionMode?: boolean;
}

export const resolveWorkerName = (
  workerId: string | { firstName: string; lastName: string } | null | undefined,
  workerMap: Record<string, any> = {}
): string => {
  if (!workerId) return 'Unassigned';
  if (typeof workerId === 'object') {
    if (workerId.firstName === 'None') return 'Unassigned';
    return `${workerId.firstName || ''} ${workerId.lastName || ''}`.trim() || 'Unknown Worker';
  }

  const worker = workerMap?.[workerId];
  if (!worker) return 'Unassigned';

  if (typeof worker === 'object') {
    if (worker.firstName === 'None') return 'Unassigned';
    return `${worker.firstName || ''} ${worker.lastName || ''}`.trim() || 'Unknown Worker';
  }

  return typeof worker === 'string' ? worker : 'Unassigned';
};

const readAttributes = (item: any): Record<string, any> => {
  if (!item) return {};
  return item.attributes instanceof Map
    ? Object.fromEntries(item.attributes)
    : item.attributes || {};
};

/**
 * Transforms an industrial job or manufacturing work order entity and tenant configuration into a ready-data DataDoc.
 * Strict adherence to Ready-Data Principle: All calculations, aggregations, and
 * date pre-formatting are executed here. DocForge section primitives do zero math.
 */
export function jobToDataDoc(job: any, options: JobSlipAdapterOptions = {}): DataDoc {
  const {
    tenantName = 'Acme Manufacturing',
    articleAttributes = [],
    workerMap = {},
    sizeRange = [],
    stepNames = [],
    descriptor,
    inspectionMode = false,
  } = options;

  const jobNumber = String(job?.jobId || job?.taskName || '');
  const jobDateStr = formatPrintDate(job?.jobDate || job?.createdAt);
  const jobStatusStr = String(job?.jobStatus || '—');

  const steps: any[] = [...(job?.steps || [])].sort(
    (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
  );

  const stepsToPrint =
    stepNames.length === 1 && stepNames[0] === ''
      ? [{ stepName: '' }]
      : stepNames.length > 0
        ? steps.filter((s: any) => stepNames.includes(s.stepName))
        : steps.length > 0
          ? steps
          : [{ stepName: '' }];

  const items: any[] = job?.items || [];
  const grandTotal = items.reduce(
    (acc: number, it: any) => acc + (Number(it.totalQuantity) || 0),
    0
  );

  const globalAttributes = articleAttributes.filter((a: any) => !!a.isGlobal);
  const rowAttributes = articleAttributes.filter((a: any) => !a.isGlobal);

  const getGlobalAttrValue = (attrName: string, attrLabel?: string): string => {
    const valuesSet = new Set<string>();
    if (job?.globalAttributes) {
      const ga =
        job.globalAttributes instanceof Map
          ? Object.fromEntries(job.globalAttributes)
          : job.globalAttributes;
      const val = ga[attrName] ?? (attrLabel ? ga[attrLabel] : undefined);
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        valuesSet.add(String(val).trim());
      }
    }
    for (const item of items) {
      const attrs = readAttributes(item);
      const val = attrs[attrName] ?? (attrLabel ? attrs[attrLabel] : undefined);
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        valuesSet.add(String(val).trim());
      }
    }
    return Array.from(valuesSet).join(', ');
  };

  // Dimensions & Width calculation
  const isLandscape = descriptor?.page?.orientation === 'landscape';
  const isA5 = descriptor?.page?.size === 'A5';
  const isLetter = descriptor?.page?.size === 'Letter';
  const rawSheetWidth = isA5 ? 148 : isLetter ? 216 : 210;
  const rawSheetHeight = isA5 ? 210 : isLetter ? 279 : 297;
  const sheetWidth = isLandscape ? rawSheetHeight : rawSheetWidth;
  const margins = descriptor?.page?.margins || { left: 18, right: 10, top: 10, bottom: 10 };
  const contentWidthMm = sheetWidth - (margins.left + margins.right);

  const jobSlipOpts = descriptor?.jobSlipOptions ?? descriptor?.jobSlip;
  const minAttrColMm = jobSlipOpts?.minAttrColMm ?? 14;
  const sizeColTargetPct = jobSlipOpts?.sizeGridTargetPct ?? 4.6;
  const articleColPctSetting = jobSlipOpts?.articleColPct ?? 16;
  const totalColPctSetting = jobSlipOpts?.totalColPct ?? 9;
  const attrBlockMinPct = jobSlipOpts?.attributeBlockMinPct ?? 19;

  const hiddenColumns: string[] = inspectionMode ? [] : jobSlipOpts?.hiddenColumns || [];
  const hiddenDetails: string[] = inspectionMode ? [] : jobSlipOpts?.hiddenDetails || [];
  const hideEmptyAttrs: boolean = inspectionMode
    ? false
    : (jobSlipOpts?.hideEmptyAttributes ?? true);

  const showArticleCol: boolean = !hiddenColumns.includes('article');
  const showTotalCol: boolean = !hiddenColumns.includes('total');
  const showWorkerTable: boolean =
    inspectionMode ||
    (jobSlipOpts?.showWorkerTable !== false && !hiddenDetails.includes('workerTable'));
  const showGlobalAttributes: boolean =
    inspectionMode || !hiddenDetails.includes('globalAttributes');
  const showDateAndStatus: boolean =
    inspectionMode ||
    (jobSlipOpts?.showDateAndStatus !== false && !hiddenDetails.includes('dateAndStatus'));

  const visibleRowAttributes = rowAttributes.filter(
    (a: any) => !hiddenColumns.includes(a.name) && !hiddenColumns.includes(a.label)
  );
  const visibleSizeRange = sizeRange.filter(
    (s: any) => !hiddenColumns.includes(s.name) && !hiddenColumns.includes('sizes')
  );

  // Global attributes summaries
  const activeGlobalAttributes = globalAttributes.filter((attr: any) => {
    if (!showGlobalAttributes) return false;
    if (hiddenDetails.includes(attr.name) || (attr.label && hiddenDetails.includes(attr.label))) {
      return false;
    }
    if (hideEmptyAttrs) {
      const val = getGlobalAttrValue(attr.name, attr.label);
      return val !== '' && val !== '-';
    }
    return true;
  });

  const globalAttrSummaryMap: Record<string, string> = {};
  for (const attr of activeGlobalAttributes) {
    const label = attr.label || attr.name;
    globalAttrSummaryMap[attr.name] = getGlobalAttrValue(attr.name, attr.label);
    globalAttrSummaryMap[label] = globalAttrSummaryMap[attr.name];
  }

  // Budget calculations
  const effArticleColPct = showArticleCol ? articleColPctSetting : 0;
  const effTotalColPct = showTotalCol ? totalColPctSetting : 0;
  const effAttrBlockMinPct = visibleRowAttributes.length > 0 ? attrBlockMinPct : 0;

  const sizeBudgetPct =
    visibleSizeRange.length > 0
      ? Math.min(
          visibleSizeRange.length * sizeColTargetPct,
          Math.max(0, 100 - effArticleColPct - effTotalColPct - effAttrBlockMinPct)
        )
      : 0;
  const sizeColPct = visibleSizeRange.length > 0 ? sizeBudgetPct / visibleSizeRange.length : 0;
  const remainingForAttrsAndArticle = 100 - effTotalColPct - sizeBudgetPct;
  const attrsPct =
    visibleRowAttributes.length > 0
      ? showArticleCol
        ? remainingForAttrsAndArticle - effArticleColPct
        : remainingForAttrsAndArticle
      : 0;
  const perAttrPct = visibleRowAttributes.length > 0 ? attrsPct / visibleRowAttributes.length : 0;
  const articleColPct = showArticleCol
    ? visibleRowAttributes.length > 0
      ? effArticleColPct
      : remainingForAttrsAndArticle
    : 0;

  const mergeAttributes =
    visibleRowAttributes.length > 1 && (perAttrPct / 100) * contentWidthMm < minAttrColMm;

  // Build sizes table columns
  const sizeColumns: any[] = [];
  if (showArticleCol) {
    sizeColumns.push({
      key: 'article',
      label: 'Article',
      align: 'left',
      widthPct: Math.round(articleColPct * 10) / 10,
    });
  }

  if (mergeAttributes) {
    sizeColumns.push({
      key: '__merged',
      label: visibleRowAttributes.map((a: any) => a.label || a.name).join(' · '),
      align: 'left',
      widthPct: Math.round(attrsPct * 10) / 10,
    });
  } else {
    for (const attr of visibleRowAttributes) {
      sizeColumns.push({
        key: attr.name,
        label: attr.label || attr.name,
        align: 'left',
        widthPct: Math.round(perAttrPct * 10) / 10,
      });
    }
  }

  for (const s of visibleSizeRange) {
    sizeColumns.push({
      key: `size_${s.name}`,
      label: s.name,
      align: 'right',
      widthPct: Math.round(sizeColPct * 10) / 10,
    });
  }

  if (showTotalCol) {
    sizeColumns.push({
      key: 'total',
      label: 'Total',
      align: 'right',
      widthPct: Math.round(effTotalColPct * 10) / 10,
    });
  }

  // Pre-calculate size totals across all items
  const sizeTotals: Record<string, number> = {};
  for (const s of visibleSizeRange) {
    sizeTotals[s.name] = 0;
  }

  // Build sizes table rows
  const sizeRows = items.map((it: any) => {
    const itemAttrs = readAttributes(it);
    const row: Record<string, any> = {
      article: it.articleName || it.articleCode || it.articleId || '—',
    };

    if (mergeAttributes) {
      row['__merged'] = visibleRowAttributes.map((a: any) => itemAttrs[a.name] || '-').join(' · ');
    } else {
      for (const attr of visibleRowAttributes) {
        row[attr.name] = String(itemAttrs[attr.name] || '-');
      }
    }

    const itQuantities =
      it.quantities instanceof Map
        ? Object.fromEntries(it.quantities)
        : it.quantities || it.sizes || {};

    for (const s of visibleSizeRange) {
      const qVal = itQuantities[s.name];
      const qNum = Number(qVal) || 0;
      sizeTotals[s.name] = (sizeTotals[s.name] || 0) + qNum;
      row[`size_${s.name}`] = qNum > 0 ? qNum : '-';
    }

    row['total'] = Number(it.totalQuantity) || 0;
    return row;
  });

  const sizesFooterRow: Record<string, any> = {
    article: 'Total',
  };
  if (mergeAttributes) {
    sizesFooterRow['__merged'] = '';
  } else {
    for (const attr of visibleRowAttributes) {
      sizesFooterRow[attr.name] = '';
    }
  }
  for (const s of visibleSizeRange) {
    sizesFooterRow[`size_${s.name}`] = sizeTotals[s.name] || 0;
  }
  sizesFooterRow['total'] = grandTotal;

  const sizesTable: DataDocTable = {
    columns: sizeColumns,
    rows: sizeRows,
    footerRow: sizesFooterRow,
    emptyMessage: 'No articles in this job.',
  };

  // Build steps table
  const stepColumns = [
    { key: 'jobNumber', label: 'Job Number', align: 'left' as const, widthPct: 20 },
    ...steps.map((st: any) => ({
      key: `step_${st.stepName}`,
      label: `${st.stepName} Man`,
      align: 'left' as const,
      widthPct: Math.round((80 / Math.max(1, steps.length)) * 10) / 10,
    })),
  ];

  const stepRow: Record<string, any> = {
    jobNumber: jobNumber || '—',
  };
  for (const st of steps) {
    const wName = resolveWorkerName(st.workerId, workerMap);
    stepRow[`step_${st.stepName}`] =
      wName === 'Unassigned' ? (inspectionMode ? 'Unassigned' : '—') : wName;
  }

  const stepsTable: DataDocTable = {
    columns: stepColumns,
    rows: [stepRow],
    emptyMessage: 'No steps assigned.',
  };

  const tablesMap: Record<string, DataDocTable> = {
    sizes: sizesTable,
  };
  if (activeGlobalAttributes.length > 0) {
    const globalAttrsRow: Record<string, any> = {};
    for (const attr of activeGlobalAttributes) {
      globalAttrsRow[attr.name] = getGlobalAttrValue(attr.name, attr.label) || '-';
    }
    tablesMap.globalAttributes = {
      columns: activeGlobalAttributes.map((attr: any) => ({
        key: attr.name,
        label: attr.label || attr.name,
        align: 'left' as const,
      })),
      rows: [globalAttrsRow],
      emptyMessage: '',
    };
  }
  if (showWorkerTable && steps.length > 0) {
    tablesMap.steps = stepsTable;
  }

  // Generate DataDocUnits: One unit per step to print
  const units: DataDocUnit[] = stepsToPrint.map((stp: any, idx: number) => {
    const stepName = stp.stepName || '';
    const unitTitle = stepName ? `${stepName} Copy` : 'Job Slip';
    const thisWorker = steps.find((s: any) => s.stepName === stepName);
    const workerName = resolveWorkerName(thisWorker?.workerId, workerMap);

    return {
      unitId: stepName ? `step-${stepName.toLowerCase().replace(/\s+/g, '-')}` : `slip-${idx + 1}`,
      unitTitle,
      unitNumber: idx + 1,
      summaries: {
        tenantName,
        stepName: stepName ? `${stepName} Copy` : 'Job Slip',
        worker: workerName === 'Unassigned' ? '' : workerName,
        jobNumber,
        jobDate: showDateAndStatus ? jobDateStr : '',
        status: showDateAndStatus ? jobStatusStr : '',
        totalPairs: grandTotal,
        ...globalAttrSummaryMap,
      },
      tables: tablesMap,
      barcodes: {
        jobNumber: {
          value: jobNumber,
          label: jobNumber,
          format: 'CODE128',
        },
      },
    };
  });

  return {
    metadata: {
      tenantName,
      documentTitle: `${tenantName} — Job Slip`,
      documentNumber: jobNumber,
      documentDate: showDateAndStatus ? jobDateStr : '',
      subtitle: showDateAndStatus ? jobStatusStr : '',
    },
    summaries: {
      jobNumber,
      jobDate: showDateAndStatus ? jobDateStr : '',
      status: showDateAndStatus ? jobStatusStr : '',
      totalPairs: grandTotal,
      ...globalAttrSummaryMap,
    },
    tables: tablesMap,
    barcodes: {
      jobNumber: {
        value: jobNumber,
        label: jobNumber,
        format: 'CODE128',
      },
    },
    units,
  };
}
