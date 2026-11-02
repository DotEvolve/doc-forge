import React from 'react';
import { useReactToPrint } from 'react-to-print';
import { ReportTemplateDescriptor } from './types';
import { buildPrintPageStyle } from './print';

export interface UseDocumentPrinterOptions {
  descriptor: ReportTemplateDescriptor;
  contentRef: React.RefObject<HTMLDivElement | null>;
  documentTitle?: string;
  onBeforePrint?: () => Promise<void> | void;
  onAfterPrint?: () => void;
  onPrintError?: (errorLocation: 'onBeforePrint' | 'print', error: Error) => void;
}

/**
 * Universal hook for triggering browser print jobs styled dynamically
 * by the active DocForge TemplateDescriptor (page orientation, margins, and size).
 */
export function useDocumentPrinter({
  descriptor,
  contentRef,
  documentTitle,
  onBeforePrint,
  onAfterPrint,
  onPrintError,
}: UseDocumentPrinterOptions): () => void {
  const pageStyle = buildPrintPageStyle(
    descriptor.page.orientation,
    descriptor.page.margins,
    descriptor.page.size
  );

  const handlePrint = useReactToPrint({
    contentRef,
    pageStyle,
    documentTitle: documentTitle ?? descriptor.name,
    onBeforePrint: onBeforePrint
      ? async () => {
          await onBeforePrint();
        }
      : undefined,
    onAfterPrint,
    onPrintError,
  });

  return handlePrint;
}
