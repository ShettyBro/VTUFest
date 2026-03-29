# VTU-FEST 2026 - Comprehensive AI Project Architecture Report

## 1. Executive Summary
VTU Youth Fest 2026 is a massive, multi-tenant digital ecosystem designed to handle university-level festival registrations, events, scheduling, and volunteer management. The system is split into multiple distinct clients driven by a centralized Node.js/Express backend.
- **Backend**: Node.js, Express, Neon PostgreSQL (Serverless), Azure Blob Storage.
- **Web Frontend**: React 18, Vite, React Router v6, Vanilla CSS.
- **Mobile Client**: Android App (documented separately, targeting Volunteers and Food Management).

This document serves as the ultimate source of truth for an AI agent or developer to understand the full stack, the integrations, and the specific security mechanisms implemented.

## 2. Global System Architecture

### 2.1 Backend (Node.js / Express)
The backend is highly modularised, separating responsibilities into distinct route domains to handle differing operational roles seamlessly.
- **Initialization**: `server.js` manages DB connections and graceful shutdowns. `app.js` configures global middlewares, CORS, rate-limiting, and mounts routes.
- **Routing Modules (`routes/`)**:
  - `auth/`: Public logins and registrations.
  - `student/`, `manager/`, `principal/`: The core hierarchy of event registration. Students apply, Managers curate/pay, Principals give final approval.
  - `admin/`, `data-admin/`: System-wide overrides, analytics, and data management.
  - `vm/`, `volunteer/`: Volunteer Management systems for assignment, green rooms, and food portals.
  - `transport-manager/`: Travel logistics.

### 2.2 Web Frontend (React / Vite)
A Single Page Application (SPA) driven by React Router.
- **Role-Based Access Control (RBAC)**: Routes are strictly guarded based on tokens located in `localStorage` (e.g., `vtufest_admin_token`).
- **Context API State**: Global states are handled via React Context (e.g., `DAContext` for Data Admins).
- **UI System**: Relies heavily on parameterized, reusable modal and popup components (`GlassPopup`) rather than page navigation for destructive or review actions.

## 3. Database & Storage Architecture

### 3.1 Neon Postgres (Relational Data)
- **Configuration**: Optimized for serverless (`db/pool.js`) with min connections set to `0` and IPv4 preferred resolution.
- **Structure**: Over 7MB of schema definitions covering user hierarchies, segmented event tables (e.g., `event_classical_vocal_solo`), scheduling queues, and operational logs.
- **Idempotency**: The system prefers soft-deletes and immutable audit trails.

### 3.2 Azure Blob Storage (Unstructured Data)
- **Usage**: Used for storing student passport photos, college payment proofs, and generated ID card ZIPs.
- **Isolation**: Handled by `@azure/storage-blob`, keeping massive file bandwidth off the Node.js server itself. 

## 4. Security & Authentication

### 4.1 Stateless JWTs
Security relies predominantly on JSON Web Tokens. Different domains use different token structures and secrets to prevent privilege escalation.
- Middleware like `auth.js` and `requireRole.js` ensure users can only access their specific functional slices.
- Specialized guards (e.g., `checkCollegeLock.js`) prevent mutations on locked registrations.

### 4.2 Shared Access Signatures (SAS) Implementation
A critical architectural mechanism is the use of **Azure SAS tokens** to securely serve files (photos, documents) to the mobile app and web frontend without exposing public blob access or proxying file streams through the Node.js backend.

**How it works (`routes/volunteer/sas.js`):**
1. **The Request**: A client (like the Android App) needs to display a private student photo. It sends a `POST` request to `/api/volunteer/sas` providing the raw `blob_url`.
2. **Validation**: The backend verifies the requester's JWT (e.g., `authenticateVolunteer`), confirms the URL belongs to the authorized `student-documents` container, and parses the blob name.
3. **Generation**: The backend uses the `StorageSharedKeyCredential` and `generateBlobSASQueryParameters` to sign a temporary token restricted to **Read ('r')** permissions.
4. **Time Constraint**: The SAS token is strictly limited to a **15-minute expiration window**.
5. **The Response**: The backend returns the `sas_url` (the original blob URL appended with the SAS query signature). The client can now directly fetch the image from Azure's CDN with high throughput.

This design drastically reduces server load and bandwidth costs while maintaining zero-trust architecture for private student documents.

## 5. Core Operational Engines

### 5.1 Algorithmic Scheduler (`scheduler/`)
- Assigns time slots for thousands of participants using a Greedy Graph Allocation algorithm.
- Prevents cross-event time collisions for multi-talented students.
- Generates idempotent `college_event_slots` matrices.

### 5.2 Bulk ID Card Generation (`id-card-generation/`)
- A heavy I/O pipeline that aggregates PostgreSQL records, fetches blob references, and compiles Excel sheets using `exceljs`.
- Binds unique QR codes (`qrcode` package) to each row.
- Bundles everything per college into massive downloadable ZIP files via `archiver`.

## 6. Development & AI Interaction Guidelines
- **Modifications**: Always trace data flow starting from `app.js` (backend) or `AppRoutes.jsx` (frontend).
- **Permissions**: Never bypass RBAC middlewares. Check `requireRole.js` or frontend Guards before adding routes.
- **Media**: All image/document serving MUST evaluate if it requires a SAS token wrapper or if it is a public asset. Do not stream Azure blobs through Node.js unless resizing. 
- **Testing**: Heavy reliance on local script runners (`scripts/`) for database seeding and testing components (e.g., `testGenerateZip.js`).
