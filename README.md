# SatyaDrishti (सत्यदृष्टि)

## AI-Powered Legal Metrology & Consumer Protection Enforcement Platform

**Smart India Hackathon 2026 · Problem Statement SIH26034**

*Automating statutory packaging-label compliance audits across India's e-commerce and retail supply chain using hybrid on-device + multimodal-LLM vision and a deterministic rules engine grounded in gazette law.*



---

## The Problem

Under the **Legal Metrology Act, 2009**, the **Legal Metrology (Packaged Commodities) Rules, 2011/2022**, and the **Consumer Protection (E-Commerce) Rules, 2020**, every pre-packaged commodity sold in India, online or offline, must statutorily declare information such as:

* Manufacturer / packer / importer details
* Net quantity
* Maximum Retail Price (MRP), inclusive of applicable taxes
* Unit sale price
* Country of origin
* Consumer-care details
* Other mandatory declarations prescribed by law

In practice, these declarations are often checked manually. This process does not scale to the millions of SKUs listed across Indian e-commerce marketplaces and provides consumers with limited tools to independently verify compliance.

**SatyaDrishti** ("true vision") is a full-stack compliance intelligence platform designed to read a product label like a trained Legal Metrology inspector, cross-check extracted information against statutory rules, and produce an actionable, evidence-backed compliance report.

---

## What It Does

| Capability                                 | Description                                                                                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔍 **Statutory Label Extraction**          | Multi-stage OCR + vision pipeline reads packaging photos, including curved bottle surfaces, dot-matrix imprints, and nutritional panels, and extracts mandatory declaration fields. |
| ⚖️ **Deterministic Compliance Validation** | A rules engine checks extracted fields against gazette-sourced statutory clauses covering MRP format, unit sale price, PIN code validity, country-of-origin presence, and more.     |
| 🤖 **LLM Confirmation Pass**               | A lightweight LLM reviews only deterministic fail/warning findings, confirming or dismissing them instead of re-validating the entire label from scratch.                           |
| 🕸️ **Autonomous E-Commerce Crawler**      | Scheduled and on-demand crawling inspects live listings across Amazon India, Flipkart, Blinkit, Zepto, and Meesho, logs violations, and can draft legal notices.                    |
| 📚 **Regulatory RAG Knowledge Base**       | Hybrid retrieval using vector similarity, BM25, metadata filtering, and knowledge-graph traversal surfaces the statutory clause associated with a finding.                          |
| 📊 **Role-Aware Dashboards**               | Dedicated interfaces for Inspectors, Manufacturers, Directorate Admins, and Citizen Consumers.                                                                                      |
| ✉️ **Automated Legal Correspondence**      | One-click generation and Gmail API dispatch of Show-Cause Notices (SCNs) and inspection reports.                                                                                    |
| 📱 **Offline-First PWA**                   | Installable, service-worker-cached, mobile-first interface designed for field inspectors operating with limited connectivity.                                                       |

---

# Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│                    React 18 + Vite + TypeScript                     │
│                                                                      │
│  Zustand Stores │ React Router │ Service Worker / PWA               │
│                                                                      │
│  Client-Side Pipeline:                                               │
│                                                                      │
│  Camera / Upload                                                     │
│        ↓                                                             │
│  Tesseract.js OCR                                                    │
│        ↓                                                             │
│  fieldExtractors.ts                                                  │
│        ↓                                                             │
│  pcrRulesEngine.ts                                                   │
│        ↓                                                             │
│  ragKnowledgeService.ts                                              │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                │ REST API
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         FastAPI Backend                              │
│                                                                      │
│  extraction_api                                                      │
│        ↓                                                             │
│  extraction_service.py                                               │
│        ↓                                                             │
│  vision_service.py                                                   │
│        ├── Ollama                                                    │
│        ├── Gemini                                                     │
│        └── Cloud Vision Providers                                   │
│                                                                      │
│  validation_service.py                                               │
│        ↓                                                             │
│  llm_validation_service.py                                           │
│                                                                      │
│  crawler_api → ecommerce_crawler_service.py                          │
│        ├── ScraperAPI                                                 │
│        ├── Jina Reader                                                │
│        └── Stealth HTTP                                               │
│                                                                      │
│  database_api → SQLAlchemy                                            │
│        ├── Products                                                   │
│        ├── Manufacturers                                              │
│        ├── OCR Scans                                                  │
│        ├── Violations                                                 │
│        ├── Complaints                                                 │
│        └── Rules                                                      │
│                                                                      │
│  email_api → email_service.py                                        │
│        └── Gmail OAuth2 + MIME                                       │
│                                                                      │
│  Regulatory RAG                                                       │
│        ├── ingestion_service.py                                      │
│        └── hybrid_retriever.py                                       │
│             ├── Vector Similarity                                     │
│             ├── BM25                                                  │
│             ├── Knowledge Graph                                       │
│             └── Metadata Filtering                                    │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │     PostgreSQL 16       │
                    │        Docker           │
                    │                         │
                    │ SQLite fallback (dev)  │
                    └────────────────────────┘
```

## Design Principle: Hybrid Over Monolithic

SatyaDrishti follows a **deterministic-first, hybrid architecture**.

Field extraction initially runs on-device:

```text
Camera / Upload
      ↓
Tesseract.js OCR
      ↓
Field Extraction
      ↓
Deterministic Rules
      ↓
Regulatory Knowledge Retrieval
```

This provides:

* Fast response times
* Offline capability
* Reduced server cost
* Better usability in field inspections

When connectivity and a server are available, heavier workloads can be delegated to the FastAPI backend:

```text
Client
  ↓
FastAPI
  ↓
Vision Model
  ↓
Deterministic Validation
  ↓
LLM Confirmation
  ↓
Evidence-backed Report
```

The **LLM does not independently decide whether a product is compliant**.

Instead:

```text
Statutory Rules
      ↓
Deterministic Rule Engine
      ↓
Violation / Warning
      ↓
LLM Confirmation
      ↓
Final Finding
```

This keeps compliance decisions grounded in explicit statutory rules.

---

# Tech Stack

## Frontend

* React 18
* Vite 5
* TypeScript
* Tailwind CSS
* Zustand
* React Router v6
* Tesseract.js
* Leaflet
* Recharts
* jsPDF
* html2canvas
* Service Worker
* Web Manifest / PWA

## Backend

* FastAPI
* Uvicorn
* SQLAlchemy 2.0
* PostgreSQL 16
* SQLite development fallback
* httpx
* BeautifulSoup4
* python-dotenv

## AI / ML

Hybrid multimodal vision routing across:

* **Ollama**

  * Qwen2.5-VL
  * MiniCPM-V
  * Llama 3.2-Vision
* **Pollinations AI**
* **Gemini Flash**

The system uses priority-ordered fallback between available providers.

### Regulatory RAG

* Vector similarity
* BM25
* Metadata filtering
* Knowledge-graph traversal
* Amendment-aware document ingestion
* Document hashing and change detection

## Infrastructure

* Docker Compose
* PostgreSQL
* Gmail API
* OAuth2
* ScraperAPI
* Jina AI Reader

---

# Statutory Frameworks Covered

SatyaDrishti currently models compliance requirements from:

* **Legal Metrology Act, 2009**

  * Section 36(1) penalty / compounding provisions
* **Legal Metrology (Packaged Commodities) Rules, 2011**

  * G.S.R. 882(E)
* **Unit Sale Price Amendment**

  * G.S.R. 779(E)
  * Effective from 1 January 2023
* **Country of Origin Mandatory Declaration**

  * G.S.R. 1537(E)
* **Consumer Protection Act, 2019**

  * Section 89 penalty provisions
* **Consumer Protection (E-Commerce) Rules, 2020**

  * G.S.R. 462(E)

> **Note:** SatyaDrishti is a compliance-support system and should not be treated as a substitute for an official legal determination or inspection.

---

# Project Structure

```text
SatyaSetu-SIH/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   │   ├── fieldExtractors.ts
│   │   ├── pcrRulesEngine.ts
│   │   └── ragKnowledgeService.ts
│   ├── stores/
│   └── ...
│
├── backend/
│   ├── main.py
│   ├── services/
│   │   ├── extraction_service.py
│   │   ├── vision_service.py
│   │   ├── validation_service.py
│   │   ├── llm_validation_service.py
│   │   ├── ecommerce_crawler_service.py
│   │   ├── email_service.py
│   │   ├── ingestion_service.py
│   │   └── hybrid_retriever.py
│   │
│   ├── models/
│   ├── api/
│   └── requirements.txt
│
├── public/
│   └── ...
│
├── docker-compose.yml
├── package.json
├── .env.example
└── README.md
```

---

# Getting Started

## Prerequisites

Make sure you have:

* Node.js 18+
* npm
* Python 3.10+
* Docker

PostgreSQL is optional during development because the application can fall back to SQLite.

## 1. Clone the Repository

```bash
git clone https://github.com/marmikjain5/SatyaSetu-SIH.git

cd SatyaSetu-SIH
```

## 2. Configure Environment Variables

```bash
cp .env.example .env
```

Configure the required API keys and credentials.

AI and crawler integrations are designed to degrade gracefully when optional credentials are unavailable.

## 3. Install Frontend Dependencies

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment.

### Linux / macOS

```bash
python -m venv venv
source venv/bin/activate
```

### Windows

```powershell
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Start PostgreSQL

If you want to use PostgreSQL locally:

```bash
docker compose -f ../docker-compose.yml up -d postgres
```

Otherwise, the backend can use its SQLite development fallback.

## Start the Backend

```bash
uvicorn main:app --reload --port 8000
```

The backend exposes:

```text
GET /
GET /health
```

The database schema is automatically initialized on startup.

---

# Production Build

Build the frontend:

```bash
npm run build
```

The production bundle will be generated inside:

```text
dist/
```

---

# API Surface

| Route                   | Method     | Purpose                                |
| ----------------------- | ---------- | -------------------------------------- |
| `/extract`              | POST       | Extract label information              |
| `/extract-image`        | POST       | Run OCR / vision extraction            |
| `/extract-multi-angle`  | POST       | Process multiple label images          |
| `/validate`             | POST       | Run deterministic statutory validation |
| `/extract-and-validate` | POST       | Extract and validate in one operation  |
| `/rules`                | GET        | Fetch active statutory rules           |
| `/products`             | GET / POST | Product management                     |
| `/manufacturers`        | GET / POST | Manufacturer management                |
| `/ocr-scans`            | GET / POST | OCR scan records                       |
| `/violations`           | GET / POST | Compliance violations                  |
| `/complaints`           | GET / POST | Consumer complaints                    |
| `/crawler/run-batch`    | POST       | Trigger crawler batch                  |
| `/crawler/inspect-url`  | POST       | Inspect an e-commerce URL              |
| `/crawler/status`       | GET        | Crawler status                         |
| `/history`              | GET        | Crawler / inspection history           |
| `/logs`                 | GET        | System logs                            |
| `/send-scn`             | POST       | Send Show-Cause Notice                 |
| `/send-inspection`      | POST       | Send inspection report                 |

---

# Compliance Pipeline

A typical inspection follows this pipeline:

```text
Product Image
      │
      ▼
┌───────────────┐
│ OCR / Vision  │
└───────┬───────┘
        │
        ▼
┌────────────────────┐
│ Field Extraction   │
│                    │
│ • Manufacturer     │
│ • Net Quantity     │
│ • MRP              │
│ • Unit Price       │
│ • Country of Origin│
│ • Consumer Care    │
│ • PIN Code         │
└─────────┬──────────┘
          │
          ▼
┌─────────────────────┐
│ Deterministic Rules │
│ Engine              │
└──────────┬──────────┘
           │
           ▼
     ┌───────────────┐
     │ Finding       │
     │ Pass / Warn   │
     │ / Fail        │
     └───────┬───────┘
             │
             ▼
┌──────────────────────┐
│ Regulatory RAG       │
│                      │
│ • Gazette clause     │
│ • Amendment          │
│ • Metadata           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ LLM Confirmation     │
│ Pass                 │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Compliance Report    │
│ + Evidence           │
│ + Statutory Clause   │
└──────────────────────┘
```

---

# E-Commerce Monitoring

SatyaDrishti includes an autonomous crawler architecture for monitoring online product listings.

Currently targeted platforms include:

* Amazon India
* Flipkart
* Blinkit
* Zepto
* Meesho

The crawler can:

1. Discover product listings
2. Retrieve listing information
3. Extract compliance-relevant fields
4. Run statutory validation
5. Record violations
6. Store inspection history
7. Generate compliance findings
8. Draft legal correspondence

Crawler integrations use a resilient fallback architecture:

```text
ScraperAPI
    ↓
Jina Reader
    ↓
Stealth HTTP
```

---

# Regulatory RAG

The regulatory knowledge system is designed around a hybrid retrieval pipeline.

```text
Gazette / Regulatory Document
          │
          ▼
┌──────────────────────┐
│ Document Ingestion   │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Chunking + Metadata  │
│ + Document Hashing   │
└──────────┬───────────┘
           ▼
     ┌───────────────┐
     │ Hybrid Search │
     ├───────────────┤
     │ Vector Search │
     │ BM25          │
     │ Metadata      │
     │ Knowledge     │
     │ Graph         │
     └───────┬───────┘
             ▼
      Relevant Clause
             │
             ▼
      Compliance Finding
```

The system is designed to account for regulatory amendments and detect changes in ingested documents.

---

# Role-Based Platform

SatyaDrishti provides dedicated workflows for multiple stakeholders.

| Role                      | Primary Capabilities                                               |
| ------------------------- | ------------------------------------------------------------------ |
| 🧑‍⚖️ **Inspector**       | Product inspection, label scanning, violations, inspection reports |
| 🏭 **Manufacturer**       | Product compliance, violation tracking, corrective actions         |
| 🏛️ **Directorate Admin** | Analytics, enforcement intelligence, manufacturer monitoring       |
| 👤 **Citizen Consumer**   | Product verification, complaints, public compliance information    |

---

# Automated Legal Correspondence

The platform integrates with the Gmail API using OAuth2.

Supported workflows include:

```text
Compliance Finding
       ↓
Inspection Report / SCN
       ↓
Document Generation
       ↓
RFC 2822 MIME Message
       ↓
Gmail API
       ↓
Recipient
```

This enables inspectors to generate and dispatch compliance correspondence directly from the platform.

---

# Offline-First PWA

SatyaDrishti is designed for field environments where network connectivity may be unreliable.

The Progressive Web App architecture provides:

* Service-worker caching
* Installable application
* Mobile-first UI
* Local OCR
* Client-side rule validation
* Responsive layouts from approximately 320px to 1280px+
* Backend synchronization when connectivity becomes available

---

# Security & Compliance Philosophy

SatyaDrishti follows a **rules-first architecture** for regulatory validation.

The system separates:

```text
Extraction
    ↓
Validation
    ↓
Evidence Retrieval
    ↓
LLM Confirmation
    ↓
Human / Inspector Action
```

This separation helps prevent a generative model from independently inventing statutory requirements or compliance decisions.

---

# License

This project is released under the **MIT License**.

See [`LICENSE`](LICENSE) for details.

---

## Smart India Hackathon 2026

**Problem Statement:** SIH26034

**SatyaDrishti · सत्यदृष्टि**

*Technology for transparent, scalable and evidence-backed compliance.*
