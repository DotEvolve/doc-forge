import { DataDoc, ReportTemplateDescriptor } from '@dotevolve/doc-forge';

export const commercialInvoiceDescriptor: ReportTemplateDescriptor = {
  slug: 'commercial-invoice',
  name: 'B2B Commercial Tax Invoice',
  version: 1,
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 12, right: 12, bottom: 12, left: 18 },
    slipsPerSheet: 1,
  },
  styles: {
    primaryColor: '#090d16',
    accentColor: '#4f46e5',
    headerBgColor: '#f8fafc',
    zebraBgColor: '#f1f5f9',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizePt: 9.5,
    lineHeight: 1.3,
    compact: false,
    cellPadding: 'normal',
  },
  sections: [
    {
      id: 'inv-header',
      type: 'header',
      visible: true,
      showTenantName: true,
      showTitle: true,
      showDocumentNumber: true,
      documentNumberLabel: 'Invoice #',
      showDate: true,
      dateLabel: 'Issue Date',
      showBorder: true,
    },
    {
      id: 'divider-top',
      type: 'divider',
      visible: true,
      style: 'solid',
    },
    {
      id: 'party-info-grid',
      type: 'key-value-grid',
      visible: true,
      columns: 3,
      fields: [
        { sourceKey: 'billTo', label: 'Billed To' },
        { sourceKey: 'taxId', label: 'Client Tax ID' },
        { sourceKey: 'currency', label: 'Settlement Currency' },
        { sourceKey: 'poRef', label: 'Purchase Order #' },
        { sourceKey: 'paymentTerms', label: 'Payment Terms' },
        { sourceKey: 'dueDate', label: 'Payment Due By' },
      ],
    },
    {
      id: 'invoice-lines-table',
      type: 'table',
      visible: true,
      tableKey: 'lineItems',
      showBorder: true,
      zebraStriping: true,
    },
    {
      id: 'invoice-summary-table',
      type: 'table',
      visible: true,
      tableKey: 'summaryTotals',
      showBorder: true,
      zebraStriping: false,
    },
    {
      id: 'payment-notes',
      type: 'notes',
      visible: true,
      title: 'Remittance & Wire Transfer Details',
      contentKey: 'wireInstructions',
    },
    {
      id: 'barcode-invoice',
      type: 'barcode',
      visible: true,
      barcodeKey: 'invoiceBarcode',
      heightPx: 40,
      align: 'left',
    },
    {
      id: 'inv-footer',
      type: 'footer',
      visible: true,
      showPageNumbers: true,
      showPrintedDate: true,
      customText: 'Nova Cloud & Network Technologies Inc. • Thank you for your business.',
    },
  ],
};

export const commercialInvoiceDataDoc: DataDoc = {
  metadata: {
    tenantName: 'Nova Cloud & Network Technologies Inc.',
    documentTitle: 'Commercial Tax Invoice',
    documentDate: 'Nov 02, 2026',
    documentNumber: 'INV-2026-8819',
  },
  units: [
    {
      unitId: 'inv-unit-1',
      unitTitle: 'Invoice Settlement Summary',
      keyValueData: {
        billTo: 'Meridian Global Enterprises LLC\n100 Enterprise Way, Suite 400, Chicago, IL',
        taxId: 'US-EIN-948192014',
        currency: 'USD ($)',
        poRef: 'PO-MGE-2026-118',
        paymentTerms: 'Net 30 Days',
        dueDate: 'Dec 02, 2026',
      },
      tables: {
        lineItems: {
          columns: [
            { key: 'lineNo', label: '#' },
            { key: 'sku', label: 'SKU / Item Code' },
            { key: 'description', label: 'Description & Scope of Deliverables' },
            { key: 'quantity', label: 'Qty', align: 'right' },
            { key: 'unitPrice', label: 'Unit Price', align: 'right' },
            { key: 'amount', label: 'Subtotal', align: 'right' },
          ],
          rows: [
            {
              lineNo: '1',
              sku: 'SRV-EDG-DED',
              description: 'Dedicated Edge Compute Gateway (Q4 SLA Guarantee)',
              quantity: '4 Units',
              unitPrice: '$1,250.00',
              amount: '$5,000.00',
            },
            {
              lineNo: '2',
              sku: 'NET-ANY-10G',
              description: '10 Gbps Anycast Global Transit Uplink Bandwidth Tier',
              quantity: '1 Mo',
              unitPrice: '$2,800.00',
              amount: '$2,800.00',
            },
            {
              lineNo: '3',
              sku: 'LIC-SEC-ENT',
              description: 'Zero Trust WAF & DDoS Shield Protection (150 seats)',
              quantity: '150 Seats',
              unitPrice: '$18.00',
              amount: '$2,700.00',
            },
            {
              lineNo: '4',
              sku: 'CS-ENG-ARCH',
              description: 'Solutions Architecture & Migration Support Retainer',
              quantity: '20 Hrs',
              unitPrice: '$175.00',
              amount: '$3,500.00',
            },
          ],
          totals: {
            description: 'Total Net Deliverables',
            amount: '$14,000.00',
          },
        },
        summaryTotals: {
          columns: [
            { key: 'chargeType', label: 'Tax & Ledger Breakdown', align: 'left' },
            { key: 'rate', label: 'Applied Rate', align: 'center' },
            { key: 'total', label: 'Total Amount (USD)', align: 'right' },
          ],
          rows: [
            {
              chargeType: 'Subtotal Net Services',
              rate: 'Standard',
              total: '$14,000.00',
            },
            {
              chargeType: 'State Sales & Infrastructure Tax',
              rate: '7.25%',
              total: '$1,015.00',
            },
            {
              chargeType: 'Early Settlement Incentive (if paid within 10 days)',
              rate: '-2.00%',
              total: '-$280.00',
            },
            {
              chargeType: 'Total Amount Due',
              rate: 'NET 30',
              total: '$14,735.00',
            },
          ],
        },
      },
      barcodes: {
        invoiceBarcode: 'INV-2026-8819-US',
      },
      notes: {
        wireInstructions:
          'Bank Name: Silicon Valley Commercial Bank\nRouting Number (ABA): 121000358\nAccount Number: 8492019481\nSWIFT / BIC: SVBKUS6S\nBeneficiary: Nova Cloud & Network Technologies Inc.\nPlease reference Invoice #INV-2026-8819 in the wire description.',
      },
    },
  ],
};
