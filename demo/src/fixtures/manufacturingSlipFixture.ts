import { DataDoc, ReportTemplateDescriptor } from '@dotevolve/doc-forge';

export const manufacturingSlipDescriptor: ReportTemplateDescriptor = {
  slug: 'manufacturing-order',
  name: 'Industrial Production Work Order',
  version: 1,
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 10, right: 10, bottom: 10, left: 18 },
    slipsPerSheet: 1,
  },
  styles: {
    primaryColor: '#0f172a',
    accentColor: '#4f46e5',
    headerBgColor: '#f1f5f9',
    zebraBgColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizePt: 10,
    lineHeight: 1.3,
    compact: false,
    cellPadding: 'normal',
  },
  sections: [
    {
      id: 'header-sec',
      type: 'header',
      visible: true,
      showTenantName: true,
      showTitle: true,
      showDocumentNumber: true,
      documentNumberLabel: 'Work Order #',
      showDate: true,
      dateLabel: 'Date Issued',
      showBorder: true,
    },
    {
      id: 'divider-top',
      type: 'divider',
      visible: true,
      style: 'solid',
    },
    {
      id: 'meta-grid',
      type: 'key-value-grid',
      visible: true,
      columns: 3,
      fields: [
        { sourceKey: 'customer', label: 'Client / Brand' },
        { sourceKey: 'poNumber', label: 'PO Reference' },
        { sourceKey: 'priority', label: 'Priority' },
        { sourceKey: 'targetDate', label: 'Scheduled Due' },
        { sourceKey: 'lineStation', label: 'Assembly Line' },
        { sourceKey: 'supervisor', label: 'Floor Supervisor' },
      ],
    },
    {
      id: 'items-table',
      type: 'table',
      visible: true,
      tableKey: 'items',
      showBorder: true,
      zebraStriping: true,
      groupKey: 'article',
    },
    {
      id: 'barcode-sec',
      type: 'barcode',
      visible: true,
      barcodeKey: 'trackingCode',
      heightPx: 48,
      align: 'left',
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
      showPrintedDate: true,
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
      summaries: {
        customer: 'Apex Outdoor Retailers Corp',
        poNumber: 'PO-2026-9941',
        priority: 'High Express',
        targetDate: 'Nov 15, 2026',
        lineStation: 'Line 4 - Vulcanizing & Stitching',
        supervisor: 'Elena Rostova (ID: OP-412)',
        qcNotes:
          '1. Inspect double stitching along reinforced heel counter before joining to sole.\n2. Heat-press vulcanized outsole at 142°C for exactly 90 seconds.\n3. Insert antimicrobial orthotic innersole before carton boxing.\n4. Scan tracking barcode at Line 4 exit gate.',
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
          emptyMessage: 'No order items registered.',
          footerRow: {
            article: 'Total Batch Quantity',
            quantity: '1,030 Pairs',
          },
        },
      },
      barcodes: {
        trackingCode: {
          value: 'WO-89421-LN4-BATCH01',
          format: 'CODE128',
        },
      },
    },
  ],
};
