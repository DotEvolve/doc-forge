import { DataDoc, ReportTemplateDescriptor } from '@dotevolve/doc-forge';

export const manufacturingSlipDescriptor: ReportTemplateDescriptor = {
  version: '1.0',
  name: 'Industrial Production Work Order',
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
  },
  typography: {
    primaryFont: 'Inter, system-ui, sans-serif',
    baseFontSize: 11,
    headerScale: 1.25,
  },
  table: {
    compact: false,
    zebra: true,
    gridLines: true,
    verticalPadding: 6,
    horizontalPadding: 8,
  },
  colors: {
    primary: '#1e293b',
    border: '#cbd5e1',
    background: '#ffffff',
    zebraAlt: '#f8fafc',
  },
  sections: [
    {
      id: 'header-sec',
      type: 'header',
      visible: true,
      title: 'INDUSTRIAL PRODUCTION ORDER',
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
      color: '#0f172a',
      thickness: 2,
    },
    {
      id: 'meta-grid',
      type: 'keyValueGrid',
      visible: true,
      title: 'Order Specifications',
      columns: 3,
      fields: [
        { key: 'customer', label: 'Client / Brand' },
        { key: 'poNumber', label: 'PO Reference' },
        { key: 'priority', label: 'Priority' },
        { key: 'targetDate', label: 'Scheduled Due' },
        { key: 'lineStation', label: 'Assembly Line' },
        { key: 'supervisor', label: 'Floor Supervisor' },
      ],
    },
    {
      id: 'items-table',
      type: 'table',
      visible: true,
      tableKey: 'items',
      showFooter: true,
      groupKey: 'article',
      columns: [
        { key: 'article', label: 'Article / Model', align: 'left', width: '22%' },
        { key: 'material', label: 'Upper Material', align: 'left', width: '18%' },
        { key: 'color', label: 'Colorway', align: 'left', width: '15%' },
        { key: 'size', label: 'Size', align: 'center', width: '12%' },
        { key: 'quantity', label: 'Pairs', align: 'right', width: '15%' },
        { key: 'status', label: 'Inspection', align: 'center', width: '18%' },
      ],
    },
    {
      id: 'barcode-sec',
      type: 'barcode',
      visible: true,
      barcodeKey: 'trackingCode',
      format: 'CODE128',
      displayValue: true,
      height: 48,
    },
    {
      id: 'notes-sec',
      type: 'notes',
      visible: true,
      title: 'Quality Control Instructions',
      contentKey: 'qcNotes',
    },
    {
      id: 'footer-sec',
      type: 'footer',
      visible: true,
      showPageNumbers: true,
      customText: 'Acme Footwear Manufacturing Ltd. • Confidential Work Order • ISO 9001 Certified',
    },
  ],
};

export const manufacturingSlipDataDoc: DataDoc = {
  metadata: {
    tenantName: 'Acme Industrial Gear & Footwear',
    documentTitle: 'Industrial Production Work Order',
    documentDate: 'Nov 02, 2026',
    documentNumber: 'WO-89421',
  },
  units: [
    {
      unitId: 'unit-1',
      unitTitle: 'Batch #01 - TrailMaster Apex',
      keyValueData: {
        customer: 'Apex Outdoor Retailers Corp',
        poNumber: 'PO-2026-9941',
        priority: 'High Express',
        targetDate: 'Nov 15, 2026',
        lineStation: 'Line 4 - Vulcanizing & Stitching',
        supervisor: 'Elena Rostova (ID: OP-412)',
      },
      tables: {
        items: {
          columns: [
            { key: 'article', label: 'Article / Model', align: 'left' },
            { key: 'material', label: 'Upper Material', align: 'left' },
            { key: 'color', label: 'Colorway', align: 'left' },
            { key: 'size', label: 'Size', align: 'center' },
            { key: 'quantity', label: 'Pairs', align: 'right' },
            { key: 'status', label: 'Inspection', align: 'center' },
          ],
          rows: [
            // Article 1: TrailMaster Pro (Demonstrates smart attribute cell deduplication)
            {
              article: 'TrailMaster Pro High-Top',
              material: 'Full Grain Leather + Cordura',
              color: 'Obsidian Black',
              size: '41 EU',
              quantity: '120',
              status: 'Passed QC',
            },
            {
              article: 'TrailMaster Pro High-Top',
              material: 'Full Grain Leather + Cordura',
              color: 'Obsidian Black',
              size: '42 EU',
              quantity: '240',
              status: 'Passed QC',
            },
            {
              article: 'TrailMaster Pro High-Top',
              material: 'Full Grain Leather + Cordura',
              color: 'Desert Coyote',
              size: '42 EU',
              quantity: '180',
              status: 'Passed QC',
            },
            {
              article: 'TrailMaster Pro High-Top',
              material: 'Full Grain Leather + Cordura',
              color: 'Desert Coyote',
              size: '43 EU',
              quantity: '150',
              status: 'Passed QC',
            },
            // Article 2: Alpine Swift
            {
              article: 'Alpine Swift Ultralight',
              material: 'Ripstop Nylon + TPU Film',
              color: 'Glacier Blue',
              size: '39 EU',
              quantity: '90',
              status: 'In Progress',
            },
            {
              article: 'Alpine Swift Ultralight',
              material: 'Ripstop Nylon + TPU Film',
              color: 'Glacier Blue',
              size: '40 EU',
              quantity: '140',
              status: 'In Progress',
            },
            {
              article: 'Alpine Swift Ultralight',
              material: 'Ripstop Nylon + TPU Film',
              color: 'Solar Ember',
              size: '41 EU',
              quantity: '110',
              status: 'Queued',
            },
          ],
          totals: {
            article: 'Total Batch Quantity',
            quantity: '1,030 Pairs',
          },
        },
      },
      barcodes: {
        trackingCode: 'WO-89421-LN4-BATCH01',
      },
      notes: {
        qcNotes:
          '1. Inspect double stitching along reinforced heel counter before joining to sole.\n2. Heat-press vulcanized outsole at 142°C for exactly 90 seconds.\n3. Insert antimicrobial orthotic innersole before carton boxing.\n4. Scan tracking barcode at Line 4 exit gate.',
      },
    },
  ],
};
