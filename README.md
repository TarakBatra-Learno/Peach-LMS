# Peach LMS - IB Teacher Portal

A demo-ready, frontend-only teacher portal prototype for IB (International Baccalaureate) schools. Built with Next.js 15, featuring 6 integrated modules covering assessment, portfolio, reports, communication, operations, and student support.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Enter as Teacher**.

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS v4** with CSS custom properties
- **shadcn/ui** (New York style) - 30 base components
- **Zustand v5** with localStorage persistence
- **Lucide React** icons, **date-fns**, **recharts**, **sonner** toasts

## Architecture

All data lives in a single Zustand store persisted to localStorage. No backend required. Seed data generates automatically on first load with 3 IB classes (MYP + DP), ~60 students, 14 assessments, ~100 portfolio artifacts, and full cross-module relationships.

### Key Patterns

- **Single store, slices pattern** - cross-module data propagation via shared state
- **Hydration gate** - StoreInitializer prevents SSR/localStorage flash
- **Derived data** - dashboard aggregations, report auto-fill, analytics all computed from store
- **Drawer-first editing** - detail/edit flows use Sheet component (right drawer)
- **IB programme-aware** - MYP criteria (A-D, levels 1-8) and DP scale (1-7) grading modes

## Modules

| Module | Routes | Features |
|--------|--------|----------|
| **Dashboard** | `/dashboard` | Stats, today's schedule, grading tasks, attendance exceptions, support follow-ups |
| **Classes** | `/classes`, `/classes/:id` | Class cards, 7-tab class hub (overview, assessments, grades, attendance, portfolio, communication, schedule) |
| **Students** | `/students/:id` | 7-tab profile (overview, grades, portfolio, attendance, reports, support, family share) |
| **Assessments** | `/assessments`, `/assessments/:id` | CRUD, grading sheet (score/MYP criteria/DP scale), publish with auto-announcement |
| **Gradebook** | `/gradebook` | Class grid view, student view, analytics |
| **Portfolio** | `/portfolio` | Artifact cards, review queue, approval workflow, family sharing, report tagging |
| **Reports** | `/reports`, `/reports/cycles/:id`, `/reports/:id` | Report cycles, auto-fill from grades/attendance, publish flow, print preview |
| **Transcripts** | `/transcripts/:id` | Multi-year read-only view |
| **Communication** | `/communication` | Channel list, announcement feed, thread replies, compose with attachments |
| **Attendance** | `/operations/attendance` | Editable register, session history, analytics |
| **Calendar** | `/operations/calendar` | Month view, event CRUD, linked incidents |
| **Compliance** | `/operations/compliance` | Data export tables, CSV download |
| **Support** | `/support` | Incident logging, follow-up timeline, calendar linking, support plans, analytics |

## Cross-Module Flows

1. **Assessment Publish** -> Creates announcement in Communication
2. **Report Distribute** -> Creates announcement with report attachment
3. **Support Follow-up** -> Creates linked calendar event
4. **Portfolio Artifact** -> Toggle "add to report" for evidence
5. **Report Auto-fill** -> Pulls live grades and attendance from store

## Demo Controls

Click the user avatar in the top bar to access:
- **Reset demo data** - Restores seed state
- **Toggle latency** - Enable/disable simulated loading
- **Toggle error mode** - Test error states

## Project Structure

```
src/
  app/
    (portal)/         # All authenticated pages (shared layout with shell)
      dashboard/
      classes/
      students/
      assessments/
      gradebook/
      portfolio/
      reports/
      transcripts/
      communication/
      operations/
      support/
    enter/            # Entry screen
  components/
    shell/            # TopBar, Sidebar, StoreInitializer
    shared/           # PageHeader, StatCard, StatusBadge, FilterBar, etc.
    ui/               # shadcn/ui base components
  stores/             # Zustand store + types
  types/              # All entity interfaces
  data/seed/          # Seed data generators
  services/           # Mock service layer
  lib/                # Utils, hooks, constants
```
