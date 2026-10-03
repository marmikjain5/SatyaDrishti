# SatyaDrishti — Architecture & Production Deployment Strategy
**Legal Metrology & Packaged Commodities Compliance Platform**  
*SIH 2026 Problem Statement: SIH26034*

---

## 1. Current Architecture (Grounded in Actual Codebase)

The current implementation of **SatyaDrishti** consists of a decoupled frontend and backend architecture:

- **Frontend**:
  - **Framework**: React 18 + Vite 5 + TypeScript + Tailwind CSS.
  - **State Management**: Zustand stores (`scanStore`, `complianceStore`, `hygieneStore`, `authStore`, `reportStore`, `legalReviewStore`, `languageStore`).
  - **Client-Side Vision & OCR**: Browser-native `MediaDevices` API, Tesseract.js / Canvas OCR pre-processing, deterministic Legal Metrology validation engine (`src/lib/pcrRulesEngine.ts`), and RAG knowledge service (`src/lib/ragKnowledgeService.ts`).
  - **Routing**: React Router v6 with role-aware navigation (Inspector, Manufacturer, Citizen Consumer, Directorate Admin).
  - **PWA Capabilities**: Service Worker (`public/sw.js`), Web App Manifest (`public/manifest.json`), touch targets ≥ 44x44px, offline UI shell and OCR runtime/model caching.

- **Backend (Python FastAPI)**:
  - **Framework**: FastAPI (`backend/main.py`) with Uvicorn ASGI server.
  - **Database & ORM**: PostgreSQL via SQLAlchemy ORM with automatic SQLite fallback (`backend/config.py`).
  - **Core Services**: OCR processing endpoint, compliance audit rules, database models for products, violations, and scan telemetry.
  - **Containerization**: `docker-compose.yml` defining `backend` (FastAPI) and `postgres` (PostgreSQL 15-alpine).

> [!NOTE]
> **Active vs. Optional Components**:
> - **Currently Active**: React (Vite SPA) + FastAPI + PostgreSQL (Docker/local) + SQLite (dev fallback).
> - **Future / Optional Roadmap Extensions**: ChromaDB (vector store) and Neo4j (graph database). These are *not* currently bundled in `backend/requirements.txt` or active in runtime container manifests and must be treated as optional scale enhancements rather than present production dependencies.

---

## 2. Frontend Deployment

### Production Build
```bash
npm run build
# Outputs optimized static distribution bundle to dist/
```

### Static Hosting Targets
1. **Cloudflare Pages / Vercel / Netlify**:
   - Zero-config deployment from Git branch.
   - Built-in global CDN distribution (edge caching of `.js`, `.css`, SVG/media).
   - Single Page Application (SPA) rewrite rule required:
     - Cloudflare Pages: `_routes.json` or fallback rule to `index.html`.
     - Vercel: `vercel.json` rewrite: `{"source": "/(.*)", "destination": "/index.html"}`.
     - Netlify: `_redirects` rule: `/* /index.html 200`.
2. **Containerized Nginx**:
   - Serve `dist/` through Nginx Alpine with gzip/brotli compression, HTTP/2 or HTTP/3, and custom security headers (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`).

---

## 3. Mobile Browser Deployment

SatyaDrishti has been engineered with a mobile-first responsive design supporting viewports from 320px to 430px (smartphones), 768px to 1024px (tablets), and 1280px+ (desktop consoles):

- **Responsive Drawer & Topbar**: Collapsible hamburger off-canvas drawer (`<Sidebar />`) with backdrop and touch scroll locking on screens `< 1024px`.
- **Role-Aware Bottom Navigation**: `<MobileBottomNav />` with 44x44px touch targets fixed to the viewport base for field inspectors and mobile citizens.
- **Stacked Card Views**: On screens `< 768px`, wide tabular views (`ScanHistoryTable`, `ProductsIntelligence`, `ConsumerComplaintsPortal`, `ViolationsTable`) transform seamlessly into high-legibility touch cards with thumb-friendly actions.

---

## 4. Progressive Web Application (PWA)

- **Manifest**: Located at `public/manifest.json` configured with `display: "standalone"`, `scope: "/"`, `start_url: "/"`, `#0F172A` theme color, and responsive maskable vector icons.
- **Service Worker (`public/sw.js`)**:
  - **Conservative Caching Policy**: Caches the static UI shell and the local Tesseract worker, WebAssembly core, and English model; inspection and API data are not cached by the service worker.
  - **Zero Sensitive Data Caching**: Inspection records, OCR results, legal notices, and compliance API requests are explicitly routed network-first with zero permanent static disk caching to protect citizen and industrial data privacy.
  - **Offline inspection workflow**: Completed scans and original evidence images are stored in the browser's IndexedDB queue. Inspectors use **Sync Now** when connected; `POST /api/inspections/sync` idempotently stores each inspection and evidence. A reused ID with different content is reported as a conflict, and the inspector can preserve the local copy as a new inspection. Sync stores the submitted result and evidence; it does not itself constitute server-side legal verification.
  - **Offline fallback**: The cached UI shell and OCR assets support local scanning after an online installation; sync requires a network connection and the backend.
- **Installation**: Users on Android (Chrome/Firefox) and iOS (Safari "Add to Home Screen") can install SatyaDrishti as a standalone app with full-screen experience and hardware camera access.

---

## 5. Optional Native Packaging (Capacitor Strategy)

If native packaging is desired in the future:
1. **Architecture**:
   - Do **NOT** rewrite the application in Flutter or React Native.
   - Use **Capacitor 6** (`@capacitor/core`, `@capacitor/cli`, `@capacitor/camera`) to wrap the existing production `dist/` bundle into an Android APK / iOS IPA.
2. **Benefits**:
   - Direct access to native camera APIs and flashlight toggle.
   - Offline biometric authentication (Fingerprint / Face ID for inspectors).
   - Enterprise distribution via MDM (Mobile Device Management) for Government of India enforcement officers.
3. **Implementation Steps**:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init SatyaDrishti gov.in.satyadrishti --web-dir dist
   npx cap add android
   npx cap sync
   ```

---

## 6. Backend Deployment (FastAPI)

### Production ASGI Execution
- Run FastAPI via Gunicorn with Uvicorn worker processes:
  ```bash
  gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120
  ```
- Configure worker concurrency proportional to CPU cores (`(2 * Cores) + 1`).
- Set request body upload limit to 15MB to support high-resolution label photographs.

---

## 7. PostgreSQL Database Deployment

### Schema & Storage
- **Primary Entities**: `products`, `declarations`, `violations`, `factories`, `hygiene_records`, `inspections`, `consumer_complaints`, `legal_notices`.
- **Indexing Strategy**:
  - B-tree indices on `sku`, `ticket_id`, `case_number`, `status`, `created_at`.
  - Full-text search (tsvector) on product titles, manufacturer names, and statutory rule codes.
- **Connection Pooling**:
  - Utilize SQLAlchemy connection pool (`pool_size=20, max_overflow=10`).
  - In high-throughput clusters, deploy **PgBouncer** in transaction pooling mode.

---

## 8. Containerization & Docker Orchestration

The repository includes a production-ready `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: satyadrishti
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@postgres:5432/satyadrishti
    ports:
      - "8000:8000"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

## 9. Environment Variables Specification

### Frontend (`.env.production`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base endpoint of FastAPI backend | `https://api.satyadrishti.gov.in` |
| `VITE_APP_ENV` | Environment identifier | `production` |
| `VITE_ENABLE_CAMERA` | Enable live video/photo capture | `true` |

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URI | `postgresql://user:pass@db:5432/satyadrishti` |
| `SECRET_KEY` | JWT token signing key | `[256-bit cryptographically secure string]` |
| `CORS_ORIGINS` | Comma-separated allowed web origins | `https://satyadrishti.gov.in,https://app.satyadrishti.gov.in` |
| `OCR_ENGINE` | Primary OCR backend engine | `tesseract_v5` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |

---

## 10. HTTPS & Security

- **Mandatory HTTPS**:
  - The browser `navigator.mediaDevices.getUserMedia` API **strictly requires** a secure context (`https://` or `localhost`). Over insecure HTTP, mobile browsers (Chrome on Android, Safari on iOS) will block camera access entirely.
  - Terminate TLS 1.3 at Cloudflare Edge, AWS ALB, or Nginx with Let's Encrypt automated certificates.
- **Security Headers**:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Permissions-Policy: camera=(self), microphone=(), geolocation=(self)`

---

## 11. Camera & Sensor Permissions

### Manufacturer Live Camera & Video
- **Packaging Declaration**: Exclusively live camera input (`facingMode: { ideal: "environment" }`) without sample or upload shortcuts to prevent spoofing.
- **Factory Hygiene Proof**: Exclusively live video capture (`MediaRecorder`) with visible real-time recording timer and automatic track disposal on unmount.
- **Permission Denial Handling**: When camera permission is denied or blocked, explicit on-screen guidance directs the user to browser site settings.

---

## 12. CORS Policy

In `backend/main.py`, enforce strict CORS whitelist:
```python
origins = [
    "https://satyadrishti.gov.in",
    "https://portal.satyadrishti.gov.in",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)
```

---

## 13. Security & Compliance Safeguards

1. **Role-Based Access Control (RBAC)**:
   - `admin`: Directorate level; full authority to issue Show Cause Notices, view risk heatmaps, inspect confidential factory streams.
   - `inspector`: Zonal field officer; authorized for on-site visual inspections and physical complaint validation.
   - `manufacturer`: Packaging verification, mandatory live factory video proofs, self-certification.
   - `consumer`: Public grievance lodging, retailer overcharge complaints, directory lookups.

---

## 14. CI/CD Pipeline

Recommended GitHub Actions workflow:
- **Lint & Typecheck**: `npm run build` on every pull request.
- **Automated Docker Image Build**: Build and push Docker images for `backend` and `frontend-nginx` to GitHub Container Registry (GHCR) or AWS ECR.
- **Staging Deployment**: Deploy on branch `feature-*` merge to staging environment.
- **Production Deployment**: Tagged release deployment to production cluster with zero-downtime rolling updates.

---

## 15. Monitoring, Logging & Telemetry

- **Frontend Error Monitoring**: Sentry / Datadog RUM for client-side uncaught exceptions, camera acquisition failures, and PWA registration telemetry.
- **Backend APM**: Prometheus metrics endpoint (`/metrics`) tracking request latency, OCR throughput, and database query durations.
- **Structured Logging**: JSON formatted logs with request correlation IDs across FastAPI middleware.

---

## 16. Backups & Disaster Recovery

- **PostgreSQL Database**:
  - Automated daily full backups via `pg_dump` with WAL (Write-Ahead Logging) archiving for Point-In-Time Recovery (PITR) up to 30 days.
  - Off-site immutable GCS / S3 backup storage with retention locking.
- **Evidence Storage**:
  - Encrypted object storage (GCS/S3) with multi-region redundancy for captured packaging photographs and video recordings.

---

## 17. Scaling Strategy

- **Stateless Web & API Tiers**:
  - Frontend SPA is globally distributed via Edge CDN.
  - FastAPI backend runs statelessly across multiple autoscaling instances behind an Application Load Balancer.
- **Asynchronous Task Queue (Production Roadmap)**:
  - For batch multi-angle OCR and heavy video analysis, introduce Celery / Redis to process visual inference outside of the synchronous HTTP request/response cycle.

---

## 18. Environment Tiers (Dev / Staging / Prod)

| Component | Development | Staging | Production |
|---|---|---|---|
| **Frontend** | Vite Dev Server (`localhost:5173`) | Vercel / Cloudflare Preview | Cloudflare Pages / Gov.in Edge |
| **Backend** | Uvicorn reload (`localhost:8000`) | Docker Staging Server | Kubernetes / Cloud Run / ECS |
| **Database** | SQLite / Local Docker Postgres | Managed PostgreSQL (db.t4g.medium) | Multi-AZ Managed PostgreSQL |
| **Storage** | Local Filesystem | S3 / GCS Staging Bucket | Secure Encrypted Gov Object Bucket |

---

## 19. Recommended Production Architecture vs. Hackathon Demo

### Hackathon Demo Deployment
- **Frontend**: Hosted on Cloudflare Pages or Vercel (free, global SSL, instant edge delivery).
- **Backend**: Containerized FastAPI + PostgreSQL deployed on a single virtual machine (Render / Railway / Hetzner / AWS EC2 t4g.small) via `docker-compose.yml`.
- **Domain & SSL**: Automatic Cloudflare SSL certificate.
- **Cost**: $0 – $15 / month.

### Government / Production Enterprise Deployment
- **Frontend**: Government NIC / MeghRaj Cloud or AWS GovCloud S3 + CloudFront with Indian origin nodes.
- **Backend**: Containerized FastAPI microservices orchestrated on Amazon EKS or Google Cloud Run with autoscaling (2 to 20 instances).
- **Database**: Amazon RDS for PostgreSQL (Multi-AZ with read replica) or Cloud SQL for PostgreSQL.
- **Security**: Cloudflare Enterprise DDoS protection, Web Application Firewall (WAF), ISO 27001 / CERT-In compliance audit.
- **Cost**: Scaled dynamically based on national traffic ($250 – $1,200 / month).

---

## 20. Architectural Alternatives Considered

1. **Next.js SSR vs. Vite SPA**:
   - *Decision*: Retained existing Vite SPA. Provides faster client-side routing, simpler PWA service worker caching, zero server runtime dependency for the frontend, and straightforward deployment to CDNs.
2. **React Native / Flutter Rewrite vs. Responsive Web + PWA**:
   - *Decision*: Strict PWA + Responsive Mobile Web. Rebuilding in Flutter/React Native would throw away months of verified desktop regulatory tooling. The current PWA delivers 100% of camera/hardware requirements with zero code duplication.

---

## 21. Summary of Cost & Complexity

| Architecture Pattern | Implementation Complexity | Setup Time | Monthly Operational Cost | Fit for Purpose |
|---|---|---|---|---|
| **Vite SPA + Cloudflare Pages + Docker Compose** | Low | 1 hour | $0 – $20 | **Ideal for Hackathon & Live Pilot** |
| **Vite SPA + Cloud Run + Cloud SQL** | Moderate | 1 day | $40 – $150 | **Ideal for State Government Launch** |
| **EKS + RDS Multi-AZ + CloudFront** | High | 1 week | $300 – $1,500 | **Ideal for Pan-India CCPA Scale** |
