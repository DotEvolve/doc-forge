import { DataDoc, ReportTemplateDescriptor } from '@dotevolve/doc-forge';

export const commercialInvoiceDescriptor: ReportTemplateDescriptor = {
  version: '1.0',
  name: 'B2B Commercial Tax Invoice',
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 12, right: 12, bottom: 12, left: 12 },
  },
  typography: {
    primaryFont: 'Inter, system-ui, sans-serif',
    baseFontSize: 10.5,
    headerScale: 1.3,
  },
  table: {
    compact: false,
    zebra: true,
    gridLines: true,
    verticalPadding: 7,
    horizontalPadding: 10,
  },
  colors: {
    primary: '#090d16',
    border: '#e2e8f0',
    background: '#ffffff',
    zebraAlt: '#f8fafc',
  },
  sections: [
    {
      id: 'inv-header',
      type: 'header',
      visible: true,
      title: 'COMMERCIAL TAX INVOICE',
      showTenantName: true,
      showDocumentDate: true,
      showDocumentNumber: true,
      showLogo: false,
    },
    {
      id: 'divider-top',
      type: 'divider',
      visible: true,
      style: 'solid',
      color: '#4f46e5',
      thickness: 3,
    },
    {
      id: 'party-info-grid',
      type: 'keyValueGrid',
      visible: true,
      title: 'Billing & Transaction Details',
      columns: 3,
      fields: [
        { key: 'billTo', label: 'Billed To' },
        { key: 'taxId', label: 'Client Tax ID' },
        { key: 'currency', label: 'Settlement Currency' },
        { key: 'poRef', label: 'Purchase Order #' },
        { key: 'paymentTerms', label: 'Payment Terms' },
        { key: 'dueDate', label: 'Payment Due By' },
      ],
    },
    {
      id: 'invoice-lines-table',
      type: 'table',
      visible: true,
      tableKey: 'lineItems',
      showFooter: true,
      columns: [
        { key: 'lineNo', label: '#', align: 'center', width: '5%' },
        { key: 'sku', label: 'SKU / Item Code', align: 'left', width: '18%' },
        {
          key: 'description',
          label: 'Description & Scope of Deliverables',
          align: 'left',
          width: '37%',
        },
        { key: 'quantity', label: 'Qty', align: 'right', width: '10%' },
        { key: 'unitPrice', label: 'Unit Price', align: 'right', width: '15%' },
        { key: 'amount', label: 'Subtotal', align: 'right', width: '15%' },
      ],
    },
    {
      id: 'invoice-summary-table',
      type: 'table',
      visible: true,
      tableKey: 'summaryTotals',
      showFooter: false,
      columns: [
        { key: 'chargeType', label: 'Tax & Ledger Breakdown', align: 'left', width: '60%' },
        { key: 'rate', label: 'Applied Rate', align: 'center', width: '20%' },
        { key: 'total', label: 'Total Amount (USD)', align: 'right', width: '20%' },
      ],
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
      format: 'CODE128',
      displayValue: true,
      height: 40,
    },
    {
      id: 'inv-footer',
      type: 'footer',
      visible: true,
      showPageNumbers: true,
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
