import { DataDoc, ReportTemplateDescriptor } from '@dotevolve/doc-forge';

export const inventoryLedgerDescriptor: ReportTemplateDescriptor = {
  version: '1.0',
  name: 'Warehouse Audit & Inventory Ledger',
  page: {
    size: 'A4',
    orientation: 'landscape',
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
  },
  typography: {
    primaryFont: 'Inter, system-ui, sans-serif',
    baseFontSize: 10,
    headerScale: 1.2,
  },
  table: {
    compact: true,
    zebra: true,
    gridLines: true,
    verticalPadding: 5,
    horizontalPadding: 8,
  },
  colors: {
    primary: '#0f766e',
    border: '#cbd5e1',
    background: '#ffffff',
    zebraAlt: '#f0fdfa',
  },
  sections: [
    {
      id: 'audit-header',
      type: 'header',
      visible: true,
      title: 'WAREHOUSE AUDIT & INVENTORY LEDGER',
      showTenantName: true,
      showDocumentDate: true,
      showDocumentNumber: true,
      showLogo: false,
    },
    {
      id: 'divider-audit',
      type: 'divider',
      visible: true,
      style: 'solid',
      color: '#0f766e',
      thickness: 2,
    },
    {
      id: 'facility-meta',
      type: 'keyValueGrid',
      visible: true,
      title: 'Logistics Facility & Audit Scope',
      columns: 4,
      fields: [
        { key: 'facility', label: 'Distribution Center' },
        { key: 'zone', label: 'Storage Zone' },
        { key: 'leadAuditor', label: 'Lead Auditor' },
        { key: 'auditType', label: 'Audit Protocol' },
      ],
    },
    {
      id: 'inventory-table',
      type: 'table',
      visible: true,
      tableKey: 'auditLedger',
      groupKey: 'category',
      showFooter: true,
      columns: [
        { key: 'category', label: 'Product Category', align: 'left', width: '18%' },
        { key: 'sku', label: 'SKU Code', align: 'left', width: '15%' },
        { key: 'description', label: 'Item Description', align: 'left', width: '25%' },
        { key: 'binLocation', label: 'Bin / Aisle', align: 'center', width: '10%' },
        { key: 'bookQty', label: 'ERP Book Qty', align: 'right', width: '11%' },
        { key: 'countedQty', label: 'Physical Count', align: 'right', width: '11%' },
        { key: 'variance', label: 'Variance', align: 'right', width: '10%' },
      ],
    },
    {
      id: 'audit-notes',
      type: 'notes',
      visible: true,
      title: 'Auditor Observations & Reconciliation Notes',
      contentKey: 'findings',
    },
    {
      id: 'barcode-audit',
      type: 'barcode',
      visible: true,
      barcodeKey: 'batchAuditCode',
      format: 'CODE128',
      displayValue: true,
      height: 38,
    },
    {
      id: 'audit-footer',
      type: 'footer',
      visible: true,
      showPageNumbers: true,
      customText: 'Apex Global Logistics & Distribution Hub • Strict Chain of Custody Record',
    },
  ],
};

export const inventoryLedgerDataDoc: DataDoc = {
  metadata: {
    tenantName: 'Apex Global Logistics & Distribution',
    documentTitle: 'Warehouse Inventory Audit Report',
    documentDate: 'Nov 02, 2026',
    documentNumber: 'AUD-HUB4-2026-90',
  },
  units: [
    {
      unitId: 'unit-hub4',
      unitTitle: 'Central Distribution Hub #4 - Zone B & C',
      keyValueData: {
        facility: 'Central Fulfilment Center #4 (Dallas, TX)',
        zone: 'Zone B (High-Bay Racks) & Zone C (Cold Vault)',
        leadAuditor: 'Marcus Vance, CPA (License #89210)',
        auditType: 'Q4 Annual Comprehensive Reconciliation',
      },
      tables: {
        auditLedger: {
          columns: [
            { key: 'category', label: 'Product Category', align: 'left' },
            { key: 'sku', label: 'SKU Code', align: 'left' },
            { key: 'description', label: 'Item Description', align: 'left' },
            { key: 'binLocation', label: 'Bin / Aisle', align: 'center' },
            { key: 'bookQty', label: 'ERP Book Qty', align: 'right' },
            { key: 'countedQty', label: 'Physical Count', align: 'right' },
            { key: 'variance', label: 'Variance', align: 'right' },
          ],
          rows: [
            // Category: Precision Automation
            {
              category: 'Precision Automation Sensors',
              sku: 'SEN-OPT-092',
              description: 'Optical Laser Distance Sensor (100m range)',
              binLocation: 'B-04-12',
              bookQty: '140',
              countedQty: '140',
              variance: '0',
            },
            {
              category: 'Precision Automation Sensors',
              sku: 'SEN-PRS-440',
              description: 'Industrial Hydraulic Pressure Transducer',
              binLocation: 'B-04-14',
              bookQty: '85',
              countedQty: '84',
              variance: '-1',
            },
            {
              category: 'Precision Automation Sensors',
              sku: 'SEN-VIB-102',
              description: 'Triaxial Piezoelectric Vibration Sensor',
              binLocation: 'B-05-01',
              bookQty: '210',
              countedQty: '210',
              variance: '0',
            },
            // Category: Robotics & Servos
            {
              category: 'Robotics & Servo Actuators',
              sku: 'ROB-SRV-750W',
              description: 'AC Brushless Servo Motor 750W w/ Encoder',
              binLocation: 'C-01-08',
              bookQty: '42',
              countedQty: '42',
              variance: '0',
            },
            {
              category: 'Robotics & Servo Actuators',
              sku: 'ROB-DRV-48V',
              description: 'CANopen Intelligent Micro-Drive Controller',
              binLocation: 'C-01-09',
              bookQty: '68',
              countedQty: '69',
              variance: '+1',
            },
            {
              category: 'Robotics & Servo Actuators',
              sku: 'ROB-GRIP-PNEU',
              description: 'Parallel Angular Pneumatic Gripper 60mm',
              binLocation: 'C-02-04',
              bookQty: '115',
              countedQty: '115',
              variance: '0',
            },
          ],
          totals: {
            category: 'Total Zone Physical Units',
            bookQty: '660',
            countedQty: '660',
            variance: '0 Units Net',
          },
        },
      },
      barcodes: {
        batchAuditCode: 'AUD-HUB4-2026-90-ZONE-BC',
      },
      notes: {
        findings:
          'Net variance across 6 audited SKU lines is 0 units (1 minor bin cross-allocation between B-04-14 and C-01-09 investigated and corrected in SAP ERP). Overall inventory accuracy rate: 99.85%.',
      },
    },
  ],
};
