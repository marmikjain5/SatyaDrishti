# SatyaDrishti

SatyaDrishti is an AI-assisted consumer protection and Legal Metrology intelligence platform for inspecting packaged commodities, validating statutory declarations, managing violations, and coordinating citizen and enforcement workflows.

This repository contains the SatyaSetu SIH full-stack prototype: a React/Vite frontend, an optional FastAPI backend, browser and server OCR/vision services, deterministic compliance rules, regulatory retrieval, product intelligence, complaints, reports, and an autonomous e-commerce inspection crawler.

> `README.md` is listed in `.gitignore` and is intentionally not tracked by Git. This file is local project documentation.

## Product scope

SatyaDrishti brings together three experiences:

1. A public product directory and verification experience for citizens.
2. An inspection workspace for package capture, OCR, declaration extraction, readability analysis, and rule validation.
3. Enforcement and supervisory dashboards for violations, complaints, manufacturers, crawler findings, analytics, reports, and regulatory knowledge.

The platform is designed around the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011. It is a compliance-support prototype; findings require appropriate human and statutory review before use as an official legal or enforcement decision.

## Implemented capabilities

### Package inspection and OCR

- Image upload, live camera capture, and multi-angle package inspection.
- Browser OCR with Tesseract.js, bundled English training data, and Vite-served OCR assets.
- OpenCV preprocessing and optional FastAPI preprocessing endpoints.
- Extraction of manufacturer/packer/importer, net quantity, MRP, unit price, country of origin, consumer-care details, PIN codes, and other declaration fields.
- Multilingual/Indic text handling, field normalization, and multi-angle consolidation.
- Barcode lookup, product dimensions, readability/font-size measurement, evidence views, scan history, recommendations, and report export.

### Compliance and regulatory intelligence

- Deterministic validation for mandatory declarations and statutory package requirements.
- Versioned rules and active-rule retrieval through the backend.
- Regulatory ingestion and hybrid retrieval helpers using lexical/vector-style matching, metadata, and source context.
- Regulatory RAG views with provenance-oriented findings.
- Optional LLM/vision augmentation for extraction and validation; deterministic rules remain the compliance foundation.

### Enforcement and case management

- Violation ledger with evidence, severity, status, review, and action information.
- Consumer grievance registration, evidence, case correlation, and progress tracking.
- Inspector review and administrative oversight workflows.
- Manufacturer records, associated products, risk ranking, and dossier views.
- Show Cause Notice and inspection-report generation with optional Gmail dispatch.
- Offline inspection queue with backend synchronization.

### E-commerce and market intelligence

- Scheduled and on-demand e-commerce listing inspection.
- Crawler status, history, logs, batch execution, and URL inspection.
- Optional ScraperAPI and Jina Reader integrations.
- Product, manufacturer, violation, complaint, OCR-scan, and compliance analytics views.
- GIS-oriented and national/zonal trajectory visualizations.

### Public and technical experience

- Responsive landing page, directory, verification, and login flows.
- Consumer, inspector, and administrator portal navigation.
- Multilingual UI translations, dark/light theme switching, mobile navigation, and production service-worker registration.
- Technical documentation with a document-outline UI, fullscreen reading mode, and system architecture handoff.
- Prototype demo video embedded in the shared footer.

### Scan, complaint, and report workflow

- A scan can run locally in the browser, use the FastAPI extraction/validation endpoints, or fall back between the available providers.
- Scan findings can be reviewed with evidence, readability measurements, rule-level audits, recommendations, historical context, and complaint correlation.
- Inspectors can generate single-product compliance reports or consolidated multi-product inspection-session reports, export them as PDF or Word-compatible documents, and revisit locally stored report history.
- Citizens can submit multilingual complaints with supporting evidence; deterministic classification and OCR correlation map the complaint to relevant statutory rules before inspector review.
- Crawler findings can be synchronized into the same product, manufacturer, violation, and analytics views used by inspection workflows.

## Routes

Routes are defined in [`src/App.tsx`](src/App.tsx).

| Route | Description |
| --- | --- |
| `/` | Landing page |
| `/about` | Platform overview and workflow |
| `/directory` | Public product directory |
| `/verify` | Directory/verification alias |
| `/login` | Demo login for consumer, inspector, and admin |
| `/technical-blog` | Technical documentation and engineering story |
| `/system-architecture` | Interactive HLA/LLA architecture portal |
| `/deployment-architecture` | Deployment architecture and operating model |
| `/dashboard` | Role-aware dashboard overview |
| `/dashboard/products` | Product intelligence |
| `/dashboard/crawler` | E-commerce crawler and inspector |
| `/dashboard/scanner` | Product scanner |
| `/dashboard/violations` | Violation ledger |
| `/dashboard/manufacturers` | Manufacturer risk ranking and dossiers |
| `/dashboard/complaints` | Consumer complaints and case portal |
| `/dashboard/analytics` | Analytics and enforcement intelligence |
| `/dashboard/regulatory-rag` | Regulatory retrieval and rule context |
| `/dashboard/settings` | Currently redirects to `/dashboard` |

`/tech-blog`, `/architecture`, `/deployment`, and `/public-directory` redirect to their canonical routes. Unknown routes redirect to `/`.

## Roles and demo access

The current login flow is a client-side demonstration flow defined in `src/pages/LoginPage.tsx` and `src/store/authStore.ts`.

| Role | Demo email | Demo password | Scope |
| --- | --- | --- | --- |
| Consumer | `consumer@demo.gov.in` | `consumer123` | Public directory and grievances |
| Inspector | `inspector@demo.gov.in` | `inspect123` | Scanning, inspections, violations, and enforcement work |
| Admin | `admin@demo.gov.in` | `admin123` | Supervisory analytics, manufacturers, crawler, rules, and administration |

These credentials are for demonstration only, not production authentication. `DashboardLayout` and `Sidebar` apply role-aware client-side restrictions.

## Architecture

```text
Browser / PWA
  React Router + Zustand + Tailwind + local OCR + offline queue
        |
        | Vite /api proxy or VITE_API_URL
        v
FastAPI backend
  extraction + validation + vision + crawler + complaints + email + sync
        |
        +-- SQLAlchemy and PostgreSQL/SQLite
        +-- Optional Ollama, Pollinations, Gemini, Gmail, ScraperAPI, Jina
```

### Inspection pipeline

```text
Package image / camera / multi-angle capture
        ↓
Preprocessing and OCR
        ↓
Field extraction, multilingual normalization, consolidation
        ↓
Optional vision/LLM augmentation
        ↓
Deterministic Legal Metrology rules
        ↓
Violations, evidence, readability findings, recommendations, reports
```

The LLM is an augmentation layer. It should not independently invent statutory requirements or replace deterministic validation and human review.

### Repository layers

- `src/pages/` contains route-level screens; `src/components/` contains reusable UI, layout, scanner, citizen, map, and dashboard components.
- `src/store/` contains Zustand stores for auth, scans, compliance data, reports, language, and theme.
- `src/lib/` contains OCR, extraction, rule engine, readability, complaint, retrieval, report, barcode, and offline helpers.
- `src/services/` contains API clients, crawler, Gmail dispatch, storage, complaint persistence, and offline synchronization.
- `backend/api/routes/` contains FastAPI route groups; `backend/services/` contains extraction, validation, retrieval, ingestion, crawler, email, and vision services.
- `backend/models/` and `backend/database.py` contain SQLAlchemy models, database setup, schema creation, and migrations.

## Technology stack

### Frontend

React 18, TypeScript, Vite 5, React Router 6, Tailwind CSS, Zustand, Framer Motion, Lucide React, Recharts, Leaflet, Tesseract.js, ZXing, html2canvas, jsPDF, Web Manifest, and service-worker support.

### Backend

Python, FastAPI, Uvicorn, Pydantic, SQLAlchemy 2, PostgreSQL/SQLite-compatible persistence, HTTPX, BeautifulSoup, python-dotenv, NumPy, OpenCV, Transformers, and Torch.

### Optional integrations

Ollama, Pollinations AI, Gemini, Gmail OAuth, ScraperAPI, and Jina Reader.

## Repository layout

```text
.
├── backend/                 FastAPI app, routers, models, and services
├── docs/                    Deployment, mobile, and analysis guides
├── public/                  Product images, manifest, icon, service worker
├── src/components/          Shared UI, landing, layout, dashboard, scanner
├── src/data/                Demo products, scans, complaints, violations
├── src/lib/                 OCR, rules, retrieval, reports, and helpers
├── src/pages/               Route-level and dashboard pages
├── src/services/            API, crawler, email, storage, offline services
├── src/store/               Zustand stores
├── src/types/               TypeScript domain types
├── .env.example             Configuration template
├── docker-compose.yml       Local PostgreSQL service
├── eng.traineddata          Tesseract English data
├── package.json             Frontend scripts and dependencies
└── vite.config.ts           Vite, API proxy, and OCR asset handling
```

## Local setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Git
- Optional Docker Desktop for PostgreSQL
- Optional Ollama with a model such as `qwen2.5-vl`

### Frontend

```powershell
npm install
npm run dev
```

The Vite server runs on `http://localhost:3000`.

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

On macOS/Linux, activate the virtual environment with `source .venv/bin/activate`. The backend can also be started from `backend/` with `python main.py`.

### PostgreSQL

```powershell
docker compose up -d postgres
```

The local compose service provides PostgreSQL 16 at `localhost:5432` with database `satyadrishti`, user `postgres`, and password `postgres`. Change these values before shared or production use.

The current `docker-compose.yml` mounts `backend/schema.sql` as a PostgreSQL initialization script, but that file is not currently present in the repository. For a fresh Compose database, remove that volume mapping, add the intended schema file, or rely on the backend startup schema creation/migration path.

Useful URLs are `http://localhost:3000`, `http://localhost:8000/health`, `http://localhost:8000/docs`, and `http://localhost:8000/redoc`.

## Configuration

The full template is [`.env.example`](.env.example). Important variables are:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL or SQLite connection string |
| `VITE_API_URL` | Optional absolute FastAPI base URL |
| `POLLINATIONS_ENABLED` | Enable Pollinations augmentation |
| `POLLINATIONS_TEXT_API_KEY`, `POLLINATIONS_TEXT_BASE_URL`, `POLLINATIONS_TEXT_MODEL` | Pollinations text extraction/validation provider |
| `POLLINATIONS_VISION_API_KEY`, `POLLINATIONS_VISION_BASE_URL`, `POLLINATIONS_VISION_MODEL`, `POLLINATIONS_VISION_TIMEOUT` | Pollinations vision extraction provider |
| `POLLINATIONS_API_KEY`, `POLLINATIONS_BASE_URL` | Shared Pollinations fallback configuration |
| `ENABLE_YOLO_REFERENCE` | Enable the preserved YOLO reference-object path; disabled by default |
| `OLLAMA_BASE_URL`, `OLLAMA_VISION_MODEL` | Local Ollama configuration |
| `OLLAMA_NUM_CTX`, `OLLAMA_NUM_PREDICT` | Ollama inference limits |
| `GEMINI_API_KEY` | Optional Gemini fallback |
| `LLM_VALIDATION_MAX_TOKENS` | LLM response limit |
| `ENABLE_GMAIL_DISPATCH` | Enable Gmail dispatch |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | Gmail OAuth credentials |
| `GMAIL_SENDER_EMAIL`, `GMAIL_RECIPIENT_OVERRIDE` | Sender and demo recipient override |
| `SCRAPER_API_KEY`, `JINA_API_KEY` | Optional crawler integrations |
| `CRAWLER_AUTO_INTERVAL_HOURS` | Crawler cadence, default `24` |

Do not put backend secrets in browser-exposed `VITE_*` variables.

## Backend API

FastAPI's `/docs` is the authoritative live API reference. Registered groups include:

- `GET /` and `GET /health` for health checks and scheduler status.
- `/api` for stats, products, manufacturers, OCR scans, violations, complaints, rules, vector search, and embedding seeding.
- `/api/v1` for image preprocessing, reference-object detection, extraction, multi-angle extraction, validation, combined extraction/validation, and active rules.
- `/api/v1/crawler` for crawler status, history, logs, batch runs, and URL inspection.
- `/api/email` for Show Cause Notice and inspection-report dispatch.
- `/api/inspections/sync` for offline inspection synchronization.

The main resources are:

| Prefix | Important operations |
| --- | --- |
| `/api` | `GET /stats`; CRUD-style product, manufacturer, OCR scan, violation, and complaint operations; rule vector status/search/seeding |
| `/api/v1` | `POST /preprocess-image`, `/opencv-preprocess`, `/detect-reference-object`, `/extract`, `/extract-image`, `/extract-multi-angle`, `/validate`, `/extract-and-validate`; `GET /rules` |
| `/api/v1/crawler` | `GET /status`, `/history`, `/logs`; `POST /run-batch`, `/inspect-url` |
| `/api/email` | `POST /send-scn`, `/send-inspection` |
| `/api/inspections` | `POST /sync` |

The exact request and response schemas are generated from the FastAPI application and should be checked in `/docs` rather than inferred from the UI.

## Data, persistence, and fallback behavior

The prototype can operate with demo data, backend persistence, or a mixture of both:

- Demo products, scans, complaints, manufacturers, violations, compliance trends, and rules are under `src/data/`.
- Zustand stores hold active frontend state and provide local fallback behavior when the backend is unavailable.
- Generated reports are persisted in browser `localStorage` by `src/store/reportStore.ts`.
- Theme, language, demo authentication state, and selected local UI data also use browser storage where appropriate.
- Complaints and selected enforcement records synchronize with the backend when reachable; new or updated records can remain local/queued when it is not.
- Offline inspection records are synchronized through `/api/inspections/sync`.
- Complaint evidence uploads use the storage integration in `src/services/supabaseStorageService.ts`; configure that integration before relying on remote evidence storage.

## Testing and build

```powershell
npx tsc --noEmit
npm run build
npm run preview
```

Backend diagnostics currently include:

```powershell
python backend\test_multilingual_ner.py
python backend\test_benchmark_image.py
python backend\test_live_links.py
python backend\test_extraction_regressions.py
```

Some diagnostics require network access, external model servers, credentials, or representative image data. Mobile camera testing requires HTTPS or localhost; see [`docs/MOBILE_CAMERA_TESTING.md`](docs/MOBILE_CAMERA_TESTING.md). The frontend test suite is Vitest-based and includes extraction, rule-engine, audit, network-status, offline-queue, and compatibility coverage.

## Deployment

See [`docs/DEPLOYMENT_STRATEGY.md`](docs/DEPLOYMENT_STRATEGY.md) for the detailed plan. The intended production shape is a static frontend bundle behind a CDN, FastAPI behind a production ASGI server/reverse proxy, managed PostgreSQL, explicit API/CORS configuration, HTTPS, secret management, monitoring, backups, migrations, rate limits, audit logging, and supervised crawler scheduling.

The current `docker-compose.yml` provisions local PostgreSQL only. It is not a complete production deployment. Resolve the missing `backend/schema.sql` initialization mapping before relying on Compose for a fresh database.

## Security and limitations

- Never commit `.env`, API keys, OAuth refresh tokens, database passwords, or service-role credentials.
- Vite `VITE_*` variables are available to browser code.
- Backend CORS currently allows all origins for development; use an allowlist in production.
- Demo login and client-side role checks are not a production identity system.
- LLM output must not replace deterministic rules, source provenance, human review, or legal authority.
- Uploaded images, complaint evidence, manufacturer data, and crawler results should be treated as sensitive.
- OCR and vision quality depends on image quality, language coverage, model availability, and package presentation.
- The repository mixes mock/demo data with backend-backed persistence depending on which services are running.
- The autonomous crawler starts with FastAPI; multi-instance deployments need a dedicated scheduler strategy to avoid duplicate jobs.

## Additional documentation

- [Deployment strategy](docs/DEPLOYMENT_STRATEGY.md)
- [Mobile camera testing](docs/MOBILE_CAMERA_TESTING.md)
- [Mobile responsiveness](docs/MOBILE_RESPONSIVENESS.md)
- [Competitive analysis](docs/COMPETITIVE_ANALYSIS_SATYADRISHTI.md)
- [Environment template](.env.example)
- [Frontend route map](src/App.tsx)
- [FastAPI entry point](backend/main.py)
- [License](LICENSE)

## License

See [`LICENSE`](LICENSE).
