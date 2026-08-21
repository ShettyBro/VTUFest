<div align="center">

<img src="https://img.shields.io/badge/VTU%20Youth%20Fest-2026-d4af37?style=for-the-badge&labelColor=0f172a&color=d4af37" />
<img src="https://img.shields.io/badge/Built%20With-AI%20Tools-blueviolet?style=for-the-badge&labelColor=0f172a" />
<img src="https://img.shields.io/badge/Status-Live-10b981?style=for-the-badge&labelColor=0f172a" />
<img src="https://img.shields.io/badge/License-Private-ef5350?style=for-the-badge&labelColor=0f172a" />

</div>

---

<div align="center">

# 🎭 VTU Youth Fest 2026
### A Full-Stack, AI-Assisted Digital Ecosystem for University-Scale Cultural Fest Management

> Engineered end-to-end with **AI-assisted tooling** — from database schema to UI components.
> Handling **registrations, scheduling, volunteer ops, payments, ID cards, and live event management** for thousands of participants across hundreds of colleges.

</div>

---

## 📦 Monorepo Overview

This project spans **three private repositories** forming a single, cohesive platform:

| Repository | Tech Stack | Role |
|---|---|---|
| [`VTUFest`](#-vtufest--web-frontend) *(this repo)* | React 18 + Vite | Web SPA — All role dashboards |
| [`VTU-FEST_SERVER`](#-vtu-fest_server--backend-api) *(private)* | Node.js 20 + Express + PostgreSQL | REST API Backend |
| [`Acharya-VTU-Habba-app`](#-acharya-vtu-habba-app--android) *(private)* | Kotlin + Jetpack Compose | Android App — Volunteers & Food |

---

## 🧠 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     VTU YOUTH FEST 2026 — PLATFORM                  │
├──────────────────┬──────────────────────┬───────────────────────────┤
│   Web Frontend   │    Backend API        │     Android App           │
│   (React/Vite)   │  (Node.js/Express)   │   (Kotlin/Compose)        │
│   Vercel CDN     │   Neon PostgreSQL     │   ML Kit · CameraX        │
│                  │   Azure Blob Storage  │   Retrofit · Coil         │
└──────────────────┴──────────────────────┴───────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         JWT Auth      SAS Tokens    RBAC Guards
         (Stateless)  (15-min TTL)  (Per-role MW)
```

### Data Flow

```
Student → Registers → Manager Curates → Principal Approves
        → Admin Reviews → Scheduler Assigns Slots
        → ID Cards Generated → Volunteers Scan QR on Event Day
```

---

## 🌐 VTUFest — Web Frontend

> **Authors:** Rohith Reddy B · SudeepBro &nbsp;|&nbsp; **Deploy:** Vercel

### Tech Stack

| Package | Version | Purpose |
|---|---|---|
| `react` + `react-dom` | 18.2 | Core UI framework |
| `vite` | 7.x | Dev server & bundler |
| `react-router-dom` | 6.22 | Client-side routing + route guards |
| `lucide-react` | 0.575 | UI iconography |
| `recharts` | 3.7 | Analytics dashboards & charts |
| `jspdf` + `jspdf-autotable` | 3.x / 5.x | PDF report generation |
| `@azure/storage-blob` | 12.31 | File upload/download (photos, proofs) |
| `react-qr-code` | 2.0 | QR code generation for ID cards |
| `react-joyride` | 2.9 | Onboarding tours |
| `@zxing/browser` + `@zxing/library` | 0.1 / 0.21 | In-browser QR/barcode scanning |

### Design System — Academic Dark + Glassmorphism

| Token | Value |
|---|---|
| **Base Background** | `#0f172a` (Navy Slate-900) |
| **Surface** | `#1e293b` (Slate-800) |
| **Royal Blue** | `#1e3a8a` (Blue-900) |
| **Primary Accent** | `linear-gradient(135deg, #d4af37, #f5d76e)` — Academic Gold |
| **Glass Background** | `rgba(255,255,255,0.06)` + `backdrop-blur: 14px` |
| **Glass Border** | `1px solid rgba(255,255,255,0.15)` |
| **Glass Shadow** | `0 8px 32px rgba(0,0,0,0.3)` |
| **Primary Font** | `Outfit` |
| **Auth Font** | `Poppins` |
| **Success** | `#10b981` |
| **Info** | `#60a5fa` |
| **Warning** | `#f59e0b` |
| **Error** | `#ef5350` |

### Animations

| Animation | Details |
|---|---|
| `academicGradient` | 28s slow navy gradient pan — base page background |
| `floatSlow` | 20s floating radial orb — atmospheric depth effect |
| `gradientBG` | 15s 4-color auth page gradient (`#ee7752 → #e73c7e → #23a6d5 → #23d5ab`) |
| `SparkleEffect` | Gold shimmer wipe (0.85s) + ember-rise glyphs (✨ ⋆ ✦) for premium notifications |
| `glowPulse` | Infinite cyan box-shadow pulse on focus elements |
| `fadeInMessage` | `translateY(-10px) → 0` ticker text fade-in (0.5s) |

### Role-Based Access Control (RBAC)

The app enforces **9 distinct role tiers**, each guarded by JWT tokens stored in `localStorage`:

```
🔓 Public           /  · /register-student · /forgot-password · /assign-events
🎓 Student          /dashboard · /student-register · /student-application · /student/feedback
🧑‍💼 Manager         /manager-dashboard · /approvals · /manager/transport · /green-room
🏛️  Principal        /principal-dashboard · /approvals · /fee-payment · /rules
👑 Super Admin      /ad-dashboard · /ad-colleges · /ad-notifications · /ad-payments
🛡️ Data Admin (DA)  /da-students · /da-managers · /da-principals · /da-audit · /da-college-unlock
🎪 Event Manager    /em/* · /accounts/* · Accommodation + Green Room modules
🚌 Transport Mgr    /transport/*
🪪 Media / ID Card  /media/editor · /media/team
```

### Project Structure

```
VTUFest/
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── assets/          # Static media, brand assets
    ├── components/      # Reusable UI
    │   ├── GlassPopup.jsx
    │   ├── GlassConfirm.jsx
    │   ├── SparkleEffect.jsx
    │   ├── SessionTimerBadge.jsx
    │   ├── HelpButton.jsx
    │   ├── MobileBlockScreen.jsx
    │   ├── PasswordStrength.jsx
    │   ├── EventsCalendar.jsx
    │   ├── CampusMap.jsx
    │   ├── scanner/         # QR scanner components
    │   ├── dashboard/       # Shared dashboard widgets
    │   ├── layout/          # Shell, nav, sidebar
    │   ├── onboarding/      # Joyride tour steps
    │   └── feedback/        # Student feedback UI
    ├── context/         # DAContext · PopupContext · OnboardingContext
    ├── hooks/           # Custom React hooks
    ├── pages/
    │   ├── admin/       # Super Admin & Sub Admin suite
    │   ├── da/          # Data Admin management
    │   ├── em/          # Event Manager modules
    │   ├── student/     # Student portal
    │   ├── manager/     # Team Manager workspace
    │   ├── principal/   # Principal approval dashboard
    │   ├── transport/   # Transport logistics
    │   ├── idcard/      # ID card editor & team
    │   ├── food/        # Food portal
    │   ├── volunteer/   # Volunteer ops
    │   ├── vm/          # Volunteer Management
    │   └── companion/   # Accompanist management
    ├── routes/          # AppRoutes.jsx + all Route Guards
    ├── styles/          # Global and modular CSS
    └── utils/           # Helpers & business logic
```

### Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server with HMR
npm run dev

# Production build
npm run build

# Preview production bundle
npm run preview
```

---

## ⚙️ VTU-FEST_SERVER — Backend API

> **Repo:** `VTU-FEST_SERVER` *(private)* &nbsp;|&nbsp; **Runtime:** Node.js 20.x &nbsp;|&nbsp; **Entry:** `src/server.js`

### Tech Stack

| Package | Purpose |
|---|---|
| `express` 4.x | HTTP server & routing |
| `pg` | PostgreSQL client (Neon Serverless pool) |
| `jsonwebtoken` | Stateless JWT auth |
| `bcrypt` / `bcryptjs` | Password hashing |
| `multer` | Multipart file upload handling |
| `archiver` | ZIP bundle generation |
| `exceljs` | Excel ID card templates |
| `qrcode` | Per-student QR code image generation |
| `sharp` | Image processing & optimization |
| `nodemailer` + `mjml` | Transactional + HTML email dispatch |
| `@aws-sdk/client-ses` | AWS SES mass email fallback |
| `@azure/storage-blob` | Azure Blob Storage integration |
| `express-rate-limit` | DDoS protection |
| `googleapis` | Google API integrations |
| `pdfkit` | PDF generation |
| `axios` | Internal HTTP calls |

### Entry Points

| File | Responsibility |
|---|---|
| `src/server.js` | DB connection health check (`SELECT NOW()`) → bind HTTP → graceful shutdown (`SIGTERM`, `SIGINT`, `uncaughtException`) |
| `src/app.js` | CORS policies · Rate limiting · 10 MB JSON parser · Route mounting · Global 404 + error sink |
| `db/pool.js` | Neon serverless pool: min-conn=0 · IPv4-first DNS · cold-start tuned idle timeouts |

### Route Domains

```
POST /api/auth/           Public logins · registrations · OTP · forgot-password
GET  /api/student/        Student dashboard reads · assigned events
ANY  /api/manager/        Event pairing · accompanists · payments → Principal lock
ANY  /api/principal/      Final approval commit · registration lock
ANY  /api/admin/          System overrides · analytics · broadcast emails
ANY  /api/data-admin/     Data corrections · college unlock · audit trail
ANY  /api/vm/             Volunteer registration · assignments · green room
ANY  /api/volunteer/      Volunteer ops + Azure SAS token proxy
ANY  /api/transport-manager/ Vehicle · arrival/departure logistics
ANY  /api/em/             Event Manager specific routes
ANY  /api/food/           Food portal management
GET  /api/shared/         Common dropdowns · aggregators
```

### Security Middleware Stack

```
Authorization: Bearer <JWT>
        │
        ▼
  auth.js ──────────────► Decrypt token → bind req.user
        │
        ▼
  requireRole.js ────────► AUTHORIZE('SUPER_ADMIN', 'DATA_ADMIN', ...)
        │
        ├── vmAuth.js       Volunteer & VM hierarchy
        ├── grAuth.js       Green Room access
        ├── transportAuth.js Transport Manager only
        └── checkCollegeLock.js  Block mutations on locked colleges
```

### Azure SAS Token Architecture

Serves **private student documents** (photos, payment proofs) directly from Azure CDN — **zero Node.js bandwidth**:

```
Client                        Backend                        Azure CDN
  │                              │                              │
  │  POST /api/volunteer/sas     │                              │
  │  { blob_url }                │                              │
  ├─────────────────────────────►│                              │
  │                              │  Validate JWT                │
  │                              │  Verify container ownership  │
  │                              │  generateBlobSASQueryParams() │
  │                              │  Permission: Read (r)        │
  │                              │  TTL: 15 minutes             │
  │◄─────────────────────────────┤                              │
  │  { sas_url }                 │                              │
  │                              │                              │
  │  GET sas_url ────────────────┼─────────────────────────────►│
  │◄─────────────────────────────┼──────────────────────────────┤
  │  Image/Document bytes        │                              │
```

### Core Subsystems

#### 🗓️ Algorithmic Scheduler (`scheduler/`)

- **Algorithm:** Greedy Graph Allocation
- Loads participant counts and event duration constraints per college
- Assigns conflict-free time slots — prevents same-student multi-event collisions
- Idempotent: unique `run_id` per execution → overwrites `college_event_slots` safely
- Executed asynchronously via `run_scheduler.js`

#### 🪪 Bulk ID Card Generator (`id-card-generation/`)

- Extracts bulk PostgreSQL records per college
- `qrcode` generates per-student QR image blobs bound into `exceljs` spreadsheet templates
- `archiver` packages each college's output into a **downloadable ZIP**

#### 📧 Communication Services (`src/services/`)

| Provider | Use Case |
|---|---|
| Gmail SMTP (`gmail.js`) | OTP dispatch, developer alerts |
| Zoho Mail (`zohoMail.js`) | Transactional emails |
| AWS SES | Mass broadcast to managers / principals |
| MJML templates | Rich HTML email rendering |

#### 🔧 Developer Scripts (`scripts/`)

```bash
node scripts/exportAnalyticsSummary.js   # Analytics export
node scripts/seed-qr-pool.js             # Seed QR code pool
node scripts/testGenerateZip.js          # Test ID card ZIP pipeline
```

### Database

- **Engine:** PostgreSQL on Neon Serverless (serverless-optimized pool)
- **Schema size:** 7 MB+ covering: users · colleges · students · accompanists · events · scheduling · accommodation · audit logs · ID-card pools · broadcast logs
- **Segmented event tables:** e.g. `event_classical_vocal_solo`, `event_clay_modelling`, `event_folk_dance_group`
- **Philosophy:** Soft-deletes · immutable audit trails · idempotent upserts

```bash
# Dev server (nodemon)
npm run dev

# Production
npm start
```

---

## 📱 Acharya-VTU-Habba-app — Android

> **Repo:** `Acharya-VTU-Habba-app` *(private)* &nbsp;|&nbsp; **App:** `com.acharyahabba.vtufest2026` &nbsp;|&nbsp; **Name:** Acharya VTU Habba

### Build Specs

| Property | Value |
|---|---|
| Language | Kotlin |
| UI Framework | Jetpack Compose + Material 3 |
| Min SDK | 24 (Android 7.0 Nougat) |
| Target SDK | 36 |
| Build System | Gradle (Kotlin DSL) |
| Minification | ProGuard enabled on release |
| Permissions | `INTERNET` · `CAMERA` |

### Key Dependencies

| Library | Purpose |
|---|---|
| `Jetpack Compose BOM` | Declarative UI framework |
| `Retrofit2` + `OkHttp` + `Gson` | REST API calls to backend |
| `Coil Compose` (2.5) | Async image loading (Azure SAS URLs) |
| `CameraX` (1.3) | Camera feed for QR scanner |
| `ML Kit Barcode Scanning` (17.2) | Real-time QR code decode |
| `EncryptedSharedPreferences` | Secure JWT token storage |
| `RootBeer` | Root/jailbreak device detection |
| `Coroutines` + `ViewModel KTX` | Async & lifecycle-aware state |
| `Material Icons Extended` | Extended icon set (QR, Logout, etc.) |

### Features

- **🔐 Secure Login** — JWT auth with `EncryptedSharedPreferences` vault; root-detected devices blocked on launch
- **📷 QR Code Scanner** — CameraX preview + ML Kit barcode decoding for event-day participant check-in
- **👤 Volunteer Dashboard** — Assignment views, event schedule, shift management
- **🍽️ Food Portal** — Meal tracking, coupon validation, distribution management
- **🖼️ Participant Photo Viewer** — Coil async loading from Azure SAS-signed URLs

### App Architecture

```
MainActivity (Compose Entry)
└── NavHost
    ├── LoginScreen ──────────────► RetrofitClient → /api/auth/
    ├── DashboardScreen
    ├── QRScannerScreen ──────────► CameraX Preview
    │                               ML Kit BarcodeScanner
    │                               POST /api/volunteer/scan
    ├── VolunteerScreen ──────────► GET /api/vm/
    └── FoodPortalScreen ─────────► GET /api/food/

Security Layer
├── EncryptedSharedPreferences ──► JWT token vault
├── RootBeer ─────────────────────► Root check on app start
└── OkHttp Logging Interceptor ───► Debug API inspection
```

### Build

```bash
# Clone repo
git clone https://github.com/[org]/Acharya-VTU-Habba-app.git

# Debug APK
./gradlew assembleDebug

# Release APK (ProGuard minified)
./gradlew assembleRelease
```

---

## 🤖 Built Fully with AI Tools

> This entire platform — spanning **3 repositories**, a **7 MB+ PostgreSQL schema**, **9 role-based dashboards**, a **custom Greedy Graph scheduling engine**, and a **Kotlin Jetpack Compose Android app** — was designed, architected, and implemented end-to-end with **AI-assisted development tools**.

| Layer | AI Contribution |
|---|---|
| **Database Schema** | Full relational model — tables, constraints, indexes, segmented event tables |
| **Backend API** | Express route scaffolding, middleware chains, JWT auth flows |
| **Scheduling Engine** | Greedy Graph Allocation algorithm design + implementation |
| **Frontend SPA** | React components, glassmorphism CSS system, RBAC route guards |
| **Android App** | Jetpack Compose UI, Retrofit API layer, ML Kit QR scanner |
| **ID Card Pipeline** | ExcelJS template logic, QR binding, per-college ZIP packaging |
| **Email Templates** | MJML HTML transactional email templates |
| **Azure Integration** | SAS token generation flow, blob upload/download architecture |
| **Documentation** | Architecture reports, UI/UX specs, API references, this README |

---

## 👥 Authors

| Name | Role |
|---|---|
| **Rohith Reddy B** | Co-Author · Full Stack Development |
| **SudeepBro** | Co-Author · Full Stack Development |

---

## 🔗 Related Repositories

| Repo | Visibility | Description |
|---|---|---|
| `VTUFest` | Private | React 18 + Vite Web SPA (this repo) |
| `VTU-FEST_SERVER` | Private | Node.js + Express + PostgreSQL Backend |
| `Acharya-VTU-Habba-app` | Private | Kotlin + Jetpack Compose Android App |

---

## 🔒 License

All three repositories are **private and proprietary**.  
The codebase is intended exclusively for use within the **VTU Youth Fest 2026** event infrastructure at Acharya Institute of Technology, Bengaluru.

---

<div align="center">

**VTU Youth Fest 2026** &nbsp;·&nbsp; Built with ❤️ and 🤖 AI &nbsp;·&nbsp; Acharya Institute of Technology, Bengaluru

</div>
