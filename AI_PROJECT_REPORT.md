# VTUFest 2026 - AI Project Overview Report

## 1. Project High-Level Architecture
This project is a Single Page Application (SPA) built for managing the **VTU Youth Fest 2026**. 
- **Tech Stack**: React 18, Vite, React Router v6.
- **Styling**: Vanilla CSS (`index.css`) with standard React component structuring.
- **State Management**: React Context (`DAContext`, `PopupContext`, `OnboardingContext`).
- **Database / Backend**: Interaction indicated through direct REST API endpoints and an Azure Blob Storage integration. A `schema_dump.sql` file exists in the root, suggesting a relational database (likely PostgreSQL/MySQL) backend.

## 2. Core Dependencies
Key dependencies identified in `package.json`:
- `react`, `react-dom` (v18.2.0)
- `react-router-dom` (v6.22.3) - For comprehensive role-based routing
- `lucide-react` - For standardized UI iconography
- `recharts` - For rendering data dashboards and metrics (used in Admin/DA/Manager dashboards)
- `jspdf`, `jspdf-autotable` - For generating downloadable PDF reports
- `@azure/storage-blob` - For handling file uploads/downloads (e.g., student ID photos, payment proofs)
- `react-qr-code` - For generating QR codes (likely for event IDs or ID cards)
- `react-joyride` - For onboarding tours and tutorials

## 3. Directory Structure Breakdown
```text
/a:/GitHub/VTUFest/
├── .github/                 # Git configurations (if applicable)
├── dist/                    # Production build output
├── public/                  # Public static assets
├── src/                     # Main source code directory
│   ├── assets/              # Static media, images, and brand assets
│   ├── components/          # Reusable UI components (Modals, Popups, Blocks)
│   ├── context/             # Global states (DAProvider, PopupProvider, Onboarding)
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Role-separated application views (See section 4)
│   ├── routes/              # Routing logic / Protected route components
│   ├── styles/              # Global/Modular CSS rules
│   └── utils/               # Helper functions and business logic utilities
├── schema_dump.sql          # Relational database schema exact replica
├── UI_UX_Documentation.md   # Design specifications and UX guidelines
├── SEO_SETUP_GUIDE.md       # SEO implementation guidelines
├── package.json             # NPM dependencies & scripts
└── vite.config.js           # Vite bundler configuration
```

## 4. Routing & Role-Based Access Control (RBAC)
The application has a highly granular, role-based architecture defined in `src/routes/AppRoutes.jsx`. Access is verified via localized auth tokens stored in `localStorage` and mapped through specific Route Guards.

### Defined Roles & Route Guards:
1. **Public/Auth**: `/`, `/register-student`, `/forgot-password`, `/assign-events`
2. **Student (`allowedRoles: ["student"]`)**: `/dashboard`, `/student-register`, `/student-application`, `/student/feedback`
3. **Manager (`allowedRoles: ["manager"]`)**: `/manager-dashboard`, `/approvals`, `/manager/transport`, `/green-room`
4. **Principal (`allowedRoles: ["principal"]`)**: `/principal-dashboard`, `/approvals`, Shared routes with Manager (Accommodation, rules, fee-payment)
5. **Super Admin / Sub Admin (`<AdminRoute>`)**: `/ad-dashboard`, `/ad-colleges`, `/ad-notifications`, `/ad-payments`, etc. Requires `SUPER_ADMIN` or `SUB_ADMIN` role variables.
6. **Data Admin / DA (`<DARoute>`)**: `/da-students`, `/da-managers`, `/da-principals`, `/da-audit`, `/da-college-unlock`. Uses Context (`useDA()`) instead of raw token checking.
7. **Event Manager / EM (`<EMRoute>, <GRRoute>, <AccountsRoute>`)**: Specialized event roles for accommodation, accounts, and green room management.
8. **Transport Manager (`<TransportRoute>`)**: Transport module routing.
9. **Media / ID Card Team**: Editors for photos and id card management (`/media/editor`, `/media/team`).

## 5. Summary For Future AI Interventions
- **Entry Point**: Start from `src/App.jsx` and `src/routes/AppRoutes.jsx`.
- **UI Modifications**: Check `src/components/` first before creating new components. UI alerts typically use customized popup wrappers (e.g., `GlassPopup`, `ApprovalOverlay`).
- **Data Flow**: Pay attention to the role tokens in `localStorage` (e.g., `vtufest_admin_token`, `vtufest_em_token`). State is often encapsulated within Contexts or stored persistently via token matching.
- **Reporting/Export**: Whenever dealing with reports, trace logic leveraging `jspdf` and `recharts` for visual layouts.

*(Generated automatically through static project analysis)*
