# @dotevolve/doc-forge

> Pure declarative document and print rendering engine for React.

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![CI](https://github.com/DotEvolve/doc-forge/actions/workflows/ci.yml/badge.svg)](https://github.com/DotEvolve/doc-forge/actions/workflows/ci.yml)

DocForge provides a pure declarative model for building, previewing, and printing structured business documents (Purchase Orders, Work Orders, Commercial Invoices, Audit Ledgers) in React with pixel-perfect pagination and standard filing margins.

---

## Features

- 📄 **Declarative Document Model**: Layouts defined by serializable JSON descriptors (`ReportTemplateDescriptor`).
- ⚡ **Ready-Data Architecture**: Zero arithmetic or aggregation in the rendering path (`DataDoc` contract).
- 🖨️ **Pixel-Perfect Print & PDF**: Automatic page breaks, `@media print` CSS counters, filing guides, and orientation control.
- 🎨 **Live Customizer Studio**: WYSIWYG modal (`DocumentPreviewModal`) for tweaking margins, typography scale, column visibility, and section order.
- 🏷️ **First-Class Barcodes & Tables**: Native Code 128 / Code 39 / QR barcodes with SVG rendering and table column deduplication.

---

## Installation

```bash
npm install @dotevolve/doc-forge
```

Peer dependencies:

```bash
npm install react react-dom lucide-react react-to-print
```

---

## Quick Start

```tsx
import React from 'react';
import { DocumentPreview, ReportTemplateDescriptor, DataDoc } from '@dotevolve/doc-forge';
import '@dotevolve/doc-forge/styles';

const descriptor: ReportTemplateDescriptor = {
  slug: 'purchase-order',
  name: 'Standard Purchase Order',
  version: 1,
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 10, right: 10, bottom: 10, left: 18 },
  },
  styles: { primaryColor: '#0f172a', accentColor: '#2563eb' },
  sections: [
    { id: 'header', type: 'header', showTitle: true, showDate: true },
    { id: 'items', type: 'table', tableKey: 'orderItems', showBorder: true },
    { id: 'footer', type: 'footer', showPageNumbers: true },
  ],
};

const data: DataDoc = {
  metadata: { documentTitle: 'Purchase Order', documentNumber: 'PO-2026-001' },
  units: [
    {
      unitId: 'po-1',
      tables: {
        orderItems: {
          columns: [
            { key: 'code', label: 'Item Code', widthPct: 20 },
            { key: 'desc', label: 'Description', widthPct: 50 },
            { key: 'total', label: 'Total', widthPct: 30, align: 'right' },
          ],
          rows: [{ code: 'SKU-1', desc: 'Industrial Sensor', total: '$450.00' }],
          emptyMessage: 'No items.',
        },
      },
    },
  ],
};

export function MyDocument() {
  return <DocumentPreview descriptor={descriptor} data={data} showToolbar={true} />;
}
```

---

## Styling & Tailwind Integration

DocForge document rendering (`DocumentRenderer`, `DocumentPreview`) is styled via pure CSS Custom Properties and included stylesheets (`@dotevolve/doc-forge/styles`).

The interactive UI components (`DocumentPreviewModal`, `TemplateCustomizerSidebar`) feature **zero-config self-contained fallback styles** ensuring they never collapse or render transparent even without Tailwind CSS. If your host application uses Tailwind CSS v4, include the source directive in your CSS to inherit your customized design system tokens:

```css
@import 'tailwindcss';
@source "../node_modules/@dotevolve/doc-forge";
```

---

## Interactive Demo

Try the interactive playground live at [doc-forge.dotevolve.net](https://doc-forge.dotevolve.net).

---

## License

This Source Code Form is subject to the terms of the **Mozilla Public License, v. 2.0** ([MPL-2.0](LICENSE)).

- You may freely use, integrate, and distribute this library in commercial and proprietary closed-source applications.
- If you modify any existing files within this library, those modifications must be made available under the MPL-2.0.
