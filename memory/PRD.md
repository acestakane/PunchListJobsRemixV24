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
