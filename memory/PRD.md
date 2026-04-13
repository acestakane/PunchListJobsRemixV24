# PunchListJobs PRD

## Overview
Blue-collar workforce marketplace connecting contractors with skilled trade crew members.
Imported from: https://github.com/acestakane/PunchListJobsRemixV20.git

## Stack
- **Backend**: FastAPI + MongoDB (Motor) + JWT Auth + APScheduler + WebSockets
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui + React Router v7 + craco

## User Roles
- **SuperAdmin** - full platform control
- **Admin** - user/job/settings management  
- **SubAdmin** - read-only analytics + limited moderation
- **Contractor** - post jobs, search/hire crew
- **Crew** - find & accept jobs, build profile

## Core Features Implemented
- JWT-based auth with register/login/forgot-reset password
- Role-based dashboards (SuperAdmin, Admin, SubAdmin, Contractor, Crew)
- Job posting, application, approval/decline workflow
- Job lifecycle: open → fulfilled → in_progress → completed → verified
- Emergency jobs (atomic race-claim)
- Real-time WebSocket notifications (alerts in Navbar bell dropdown)
- Crew search with geo-filtering and smart match scoring
- Profile completion tracking + bonus points
- Subscription system (daily/weekly/monthly/annual)
- Payment: Square (demo mode), CashApp (manual), PayPal (client-side), Points redeem
- Referral/Points system
- Admin analytics dashboard with charts
- CMS pages (terms, privacy, about, FAQs, guidelines)
- Coupon system with percent/fixed discounts
- Activity audit logs
- Trade categories management
- Direct messaging (threads/channels)
- Concerns/support ticket system
- Job archive, boost, emergency flag
- Alert Card moved to Navbar bell dropdown notification (2026-04-12)
- Crew Dashboard pending/approval state + duplicate application blocking (2026-04-12)
- /pay-history shows Expenses for Crew/Contractor roles (2026-04-12)
- Crew Transportation Type feature-flag: Admin toggle + Crew Profile field + Contractor card badge (2026-04-12)
- Centralized alerts: read/unread state, markRead/markAllRead/clearAlert, WS events from CrewDashboard routed to Navbar alerts (2026-04-12)
- Contractor contact info hidden when crew application is PENDING (2026-04-12)
- Paid Reveal: crew can unlock contractor contact for $2.99 (demo) while pending+job not full; persists after purchase (2026-04-12)
- Share Approved Jobs: crew can share job link (/j/:jobId) only when accepted; public page shows sanitized data (city/state only, no address/coords) with sign-in CTA for guests (2026-04-12)
- Open Graph meta tags: /api/j/{id} serves OG+Twitter Card HTML for crawlers (Slack, Twitter, iMessage) + react-helmet-async for Discord/WhatsApp; real browsers redirect to /j/:jobId SPA (2026-04-12)
- Job form enhancements: description required (server-side), PunchList tasks (dynamic list), image upload max 4 (2026-04-12)
- Job itinerary: PunchList checklist with per-user task toggle, crew Submit Complete, contractor Set Complete (2026-04-12)
- Ratings system: post-completion rating modal with 1-5 stars (crew rates contractor) (2026-04-12)
- Dispute/support: flag button → dispute modal → stored in disputes collection for admin review (2026-04-12)
- Time-based job automation: idle open jobs → suspended@24h → cancelled@48h → archived@72h (hourly cron) (2026-04-12)

## Mocked APIs (Demo Mode)
- Square payment (no real token - auto-succeeds in demo)
- Email sending (logs only, no RESEND_API_KEY)
- CashApp (manual pending approval)

## Environment
- Backend: /app/backend (port 8001)
- Frontend: /app/frontend (port 3000)
- DB: MongoDB punchlistjobs database

## Implementation Date
2026-04-12: Initial import and setup complete

## Backlog / P1 Features
- Add real Square payment keys for live payments
- Add RESEND_API_KEY for real email notifications
- Configure RECAPTCHA_SECRET_KEY for bot protection
- Add GOOGLE_MAPS_API_KEY for better geocoding
- Profile photo upload (works, stored locally)

## Component Refactoring (2026-04-12)
- ContractorDashboard.jsx: 1261 → 746 lines (-41%). Extracted: RatingModal, CrewProfileModal, CrewCard, CrewRequestModal, ConfirmArchiveModal to `components/contractor/`
- CrewDashboard.jsx: 900 → 522 lines (-42%). Extracted: JobDetailModal, CrewSidebar to `components/crew/`
- Shared: ProfileCompletionPopup to `components/` (used by both dashboards)
- JobFormModal.jsx updated: now includes PunchList Tasks, Job Images (max 4), required Description, normalizeTrade, and address autocomplete (fully self-contained)

## Bug Fixes & Quality (2026-04-12 continued)
- Fixed React "Objects are not valid as a React child" crash: Created `/app/frontend/src/utils/errorUtils.js` with `getErr()` helper that safely extracts string messages from FastAPI error responses (including 422 validation array detail). Updated 14 files including AuthPage, ContractorDashboard, CrewDashboard, AdminDashboard, JobsItinerary, ProfilePage, SubscriptionPage, ArchivePage, ReportConcern, and 6 admin components.
- Added custom zoom +/- controls to `JobMap.jsx`: Disabled Leaflet's rotating built-in zoom control (`zoomControl={false}`), added `ZoomController` component (useMap ref), added custom zoom-in/zoom-out buttons to the non-rotating overlay alongside existing controls.
- Auth token migrated from `localStorage` → `sessionStorage` in `AuthContext.jsx` (token clears on tab/browser close; reduces risk on shared devices). `ONBOARDING_KEY` remains in localStorage (not sensitive, intentionally persistent).
- PWA "Save Job to Phone" install banner: Added `public/manifest.json`, `public/sw.js` (minimal service worker), SVG app icons (192/512px). `PWAInstallBanner` component shows only for crew role — listens for `beforeinstallprompt`, iOS fallback tip, dismiss stored in sessionStorage. Registered via `App.js`.

## Backend Logic Fix (2026-04-12)
- `approve_applicant` in `job_routes.py`: added approval guard (denies immediately if `crew_accepted >= crew_needed`) + auto-deny logic (when approval fills the quota, all remaining `crew_pending` are auto-denied with notifications)
- Fixed missing React hook dependencies: `fetchMe` wrapped in `useCallback([logout])` in AuthContext; `useEffect` deps updated to `[token, fetchMe]`
- Fixed `MessagesPage.jsx` initial load `useEffect` stale closure: uses `initialThreadRef` + proper deps `[fetchThreads, openThread]`
- Fixed `WebSocketContext.jsx` empty catch block: added `console.error`
- Fixed 10+ empty catch blocks across `ContractorDashboard.jsx`, `CrewDashboard.jsx`, `ProfilePage.jsx`, `TradesTab.jsx`, `CmsPage.jsx` — all now log via `console.error` or `console.warn`
- Fixed array index as React key in `ContractorDashboard.jsx` task list and `AuthPage.jsx` address suggestions
- Fixed `__cat__:` prefix display bug: `normalizeTrade()` helper strips prefix before job submission and in Preview; `JobCard.jsx`, `ProfilePage.jsx`, `SharedJobPage.jsx` all sanitize trade display
