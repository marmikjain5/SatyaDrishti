# SatyaDrishti — Mobile Responsiveness & Viewport Testing Matrix
**Legal Metrology & Packaged Commodities Compliance Platform**  
*SIH 2026 Problem Statement: SIH26034*

---

## 1. Executive Summary

This document establishes the official mobile-first responsive design specifications and validation matrix for **SatyaDrishti**. The application has been optimized to ensure seamless operation across compact smartphones (320px–430px), tablets (768px–1024px), and wide desktop consoles (1280px–1920px).

Key mobile adaptations include:
1. **Off-Canvas Navigation Drawer**: On viewports `< 1024px`, the desktop sidebar transitions to a drawer with backdrop overlay, body scroll locking, and route change auto-closure.
2. **Fixed Bottom Navigation**: `<MobileBottomNav />` provides role-aware persistent actions with minimum 44x44px touch targets.
3. **Stacked Responsive Cards**: Complex enterprise tables (`ScanHistoryTable`, `ProductsIntelligence`, `ConsumerComplaintsPortal`, `ViolationsTable`) transform into thumb-friendly cards on small screens (`block md:hidden`).
4. **Camera & Video Viewfinders**: Hardware viewfinders maintain a responsive max height of `50vh` to `55vh`, preventing page-level layout shifts and vertical overflow.
5. **Horizontal Internal Scroll Containers**: Complex multi-angle selector strips, statistical summary bars, and workflow steppers scroll horizontally inside their containers with zero page-level horizontal overflow.

---

## 2. Comprehensive Viewport Testing Matrix

| Viewport Resolution | Common Devices / Categories | Primary Layout Mode | Navigation Pattern | Table / Card Presentation | Viewfinder Max Height |
|---|---|---|---|---|---|
| **320 × 568** | iPhone SE (1st gen), Compact Androids | 1-column stacked | Hamburger drawer + Bottom Nav | 100% Stacked Cards | `50vh` (min 220px) |
| **375 × 667** | iPhone 8, SE (2nd/3rd gen) | 1-column stacked | Hamburger drawer + Bottom Nav | 100% Stacked Cards | `50vh` (min 240px) |
| **390 × 844** | iPhone 12 / 13 / 14 | 1-column stacked | Hamburger drawer + Bottom Nav | 100% Stacked Cards | `50vh` (min 260px) |
| **430 × 932** | iPhone 14 / 15 / 16 Pro Max | 1-column stacked | Hamburger drawer + Bottom Nav | 100% Stacked Cards | `52vh` (min 260px) |
| **768 × 1024** | iPad Mini, iPad 9.7", Android Tablets (Portrait) | 2-column grid | Hamburger drawer + Topbar | Mixed / Responsive Table | `55vh` (min 300px) |
| **1024 × 768** | iPad (Landscape), Small Laptops | 2-3 column grid | Persistent Sidebar (Collapsible) | Full Enterprise Table | `420px` fixed |
| **1280 × 720** | Standard Laptop / Desktop HD | 3-4 column grid | Persistent Expanded Sidebar | Full Enterprise Table | `460px` fixed |
| **1440 × 900+** | High-DPI Desktop / Enterprise Console | Multi-column grid | Full Expanded Sidebar | Full Enterprise Table | `480px` fixed |

---

## 3. Route-by-Route Responsiveness Audit

### 3.1 Public Landing Page (`/`)
- **Navigation**: Desktop header features the primary navigation links and portal login button. Below `768px`, a hamburger toggle slides down a clean, accessible mobile drawer containing links to About, Public Directory, System Architecture, Technical Blog, and Portal Login.
- **Hero & Metrics**: Two-column hero collapses into a single vertical column with prominent "Launch Inspector Portal" and "Consumer Grievance" call-to-action buttons.
- **Scrolling**: Fluid vertical scrolling with zero horizontal overflow (`overflow-x-hidden`).
- **Touch Targets**: All public links and buttons satisfy ≥ 44x44px touch targets.

---

### 3.2 Product Scanner (`/dashboard/scanner`)
- **Role Modes**:
  - **Manufacturer Mode**: Strictly **Live Camera Only** (`LiveProductCapture.tsx`). No sample buttons, file upload inputs, or gallery shortcuts are present.
  - **Inspector Mode**: Retains deterministic high-resolution file upload (`ImageUploader.tsx`) with multi-angle batching.
- **Viewfinder**: Responsive viewfinder framed at `min-h-[260px]` and `max-h-[55vh]` with rear-camera default (`facingMode: { ideal: "environment" }`).
- **Capture Controls**: 64px thumb-friendly floating capture trigger, camera switch button, and clear flash/grid toggles.
- **Permission & HTTPS Handling**: Explicit alert instructions displayed if the browser blocks `getUserMedia` or is served over insecure HTTP.
- **Stream Cleanup**: Camera hardware streams are cleanly stopped and garbage collected on capture or component unmount.

---

### 3.3 Scan History (`ScanHistoryTable.tsx`)
- **Desktop (≥ 768px)**: Dense 7-column enterprise audit table (`hidden md:block`).
- **Mobile (< 768px)**: Stacked cards (`block md:hidden`) showing packaging thumbnail, timestamp, product title, confidence bar, status badge, and full-width action buttons ("Inspect", "Download Report", "Delete").
- **Overflow Prevention**: Eliminates table-driven page blowout on mobile screens.

---

### 3.4 OCR & Compliance Panels (`OCRResultsPanel.tsx` & `ComplianceResultsPanel.tsx`)
- **Summary Metrics**: Top summary bar adapts from a 5-item divided row into a 2-column mobile grid on screens `< 640px` and 5 columns on desktop.
- **Headers**: Wrap title, rule count, and compliance score boxes gracefully without squashing.
- **Data Table**: Contained within an internal `overflow-x-auto` wrapper with sticky column cues.
- **Evidence Inspector**: Bounding boxes scale proportionally via percentage coordinates; overlays adapt font sizes on compact viewports.

---

### 3.5 Factory Hygiene Monitoring (`/dashboard/factory-hygiene`)
- **Inspector Visual Inspection (`FactoryImageInspection.tsx`)**:
  - Upload dropzone padding scales (`p-6` on mobile, `p-12` on desktop).
  - Deterministic three-reference-image analysis findings stack vertically.
  - "Create Violation" action button is guaranteed min 44px height.
- **Manufacturer Hygiene Proof (`LiveFactoryVideoRecorder.tsx`)**:
  - Strictly **Live Video Only** (`MediaRecorder`).
  - Viewfinder maintains `aspect-video max-h-[50vh] min-h-[240px]`.
  - Prominent recording indicator with elapsed timer (`REC 00:14`).
  - Start, Stop, and Re-record buttons are touch-optimized (min 44px–48px).

---

### 3.6 Factory Dashboard (`FactoryList.tsx` & `ZoneMonitoringGrid.tsx`)
- **Grid Layout**: Responsive grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- **Search & Filters**: Search input and status dropdown stack vertically on phones and align horizontally on desktop.
- **Telemetry Cards**: Sensor metrics (temperature, humidity, pest activity, sanitation) format into compact 2-column or 1-column cards with visual status badges.
- **Action Buttons**: "Schedule Inspection" button expands to full width on mobile devices for easy thumb tapping.

---

### 3.7 Products Intelligence (`/dashboard/products`)
- **Desktop (≥ 768px)**: Complete enterprise SKU repository table.
- **Mobile (< 768px)**: Stacked product cards featuring product thumbnail, platform badge, SKU, dual pricing (List / MRP), OCR match confidence, compliance bar, and full-width "Inspect Packaging" action.

---

### 3.9 Consumer Complaints Portal (`/dashboard/complaints`)
- **Desktop (≥ 768px)**: National Grievance Adjudication table.
- **Mobile (< 768px)**: Stacked complaint cards displaying Ticket ID, Complainant name, Product/Shop location, alteration discrepancy variance, and "Inspect Officer Dossier" button.
- **Dossier Modal**: Officer Review Dossier adapts to `max-h-[92vh]` with internal scrolling and touch tabs.

---

### 3.10 Shared UI System (`Tabs.tsx` & `Modal.tsx`)
- **Tabs**: Segmented and underline tabs include `max-w-full overflow-x-auto scrollbar-none` with `whitespace-nowrap shrink-0` items, allowing fluid finger scrolling without pushing viewport boundaries.
- **Modals**:
  - Viewport margin scales down to `p-3` on mobile (vs `p-6` on desktop).
  - Maximum height constrained to `max-h-[92vh]` with internal scrollable body.
  - Close button touch target enlarged to `min-h-[44px] min-w-[44px]`.

---

## 4. Accessibility & Touch Ergonomics

1. **Touch Target Sizing**: All interactive buttons, form inputs, tab switches, and dropdown triggers conform to WCAG 2.1 Level AA touch criteria (minimum 44 × 44 CSS pixels).
2. **Visual Focus & Contrast**: High-contrast outline borders and focus rings (`focus:ring-2 focus:ring-blue-500`) maintained across dark and light modes.
3. **Aria Labels**: Screen-reader accessible attributes attached to icon-only triggers (hamburger menu `aria-label="Toggle navigation menu"`, modal close `aria-label="Close dialog"`).
4. **Body Scroll Locking**: Opening the mobile drawer or any modal locks `document.body.style.overflow = 'hidden'`, preventing background scroll jitter.

---

## 5. Known Platform Behaviors & Limitations

1. **Insecure Context Camera Access**:
   - WebRTC `getUserMedia` will not trigger over plain HTTP on remote mobile devices (except `localhost`). When testing on a real mobile device over a local Wi-Fi IP, developers must use an HTTPS tunnel (e.g., Cloudflare Tunnel, ngrok) or enable Chrome browser flag `chrome://flags/#unsafely-treat-insecure-origin-as-secure`.
2. **iOS Safari Fullscreen PWA Bar**:
   - iOS Safari in standalone PWA mode applies `apple-mobile-web-app-status-bar-style: black-translucent`. Content at the very top of the screen respects safe-area insets via Tailwind `pt-safe` and Topbar sticky offsets.
