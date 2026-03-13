# Teacher Dashboard Recommendation Engine — Design Spec

## Overview

Redesign the teacher portal dashboard (`/dashboard`) around a recommendation engine that generates a prioritized, time-aware action list for teachers. The engine derives recommendations purely from existing store data and the current time, presenting them in a "Command Center" layout with an interactive timetable sidebar.

## Audience & Scope

- **For**: Teachers using the teacher portal
- **Where**: `src/app/(portal)/dashboard/page.tsx` — full rewrite
- **Isolation**: No changes to student, family, or admin portals. No store schema changes. No new data entities.

## Layout: Command Center

### Structure

```
┌─────────────────────────────────────────────────────┐
│  Greeting          Class Filter ▾          13 Mar   │
├───────────────────────────────────┬─────────────────┤
│  [To Mark] [Due Today] [Release] [Reports Due]      │
│  ─────────────────────────────────┤                 │
│  ⚡ RIGHT NOW                     │  TODAY'S        │
│  ┌─────────────────────────────┐  │  SCHEDULE       │
│  │ Take attendance — MYP Sci   │  │  08:00 Homeroom │
│  │ Assessment due — DP English │  │  09:00 Sciences●│
│  └─────────────────────────────┘  │  10:15 English  │
│                                   │  11:00 Lunch    │
│  📋 TO DO                         │  ───────────────│
│  ┌─────────────────────────────┐  │  REPORT CYCLE 2 │
│  │ Mark 8 — Sciences   Due tmrw│  │  ████░░ 8/20    │
│  │ Release 4 — English  3 days │  │  ───────────────│
│  │ Finalize 6 reports  Closes F│  │  ATTENTION      │
│  │ Review portfolio    5d wait │  │  ⚠ 3 below 50%  │
│  └─────────────────────────────┘  │  📋 2 incidents  │
├───────────────────────────────────┴─────────────────┤
```

- **Main area (~75%)**: Stat cards → Right Now → To Do
- **Sidebar (~25%)**: Interactive timetable rail → compact reference panels

### Header Bar

- **Left**: Time-aware greeting ("Good morning, Ms. Smith")
- **Centre**: Class filter dropdown (defaults to "All Classes"), cascades into recommendations
- **Right**: Current date

### Stat Cards Row

Four compact counter cards across the top of the main area:

| Card | Source | Colour |
|------|--------|--------|
| To Mark | Computed via `getToMarkCount(studentIds, grades, assessment)` from `grade-helpers.ts` for each live assessment. This calls `getTeacherReviewStatus(grade, assessment)` internally — there is no stored `teacherReviewStatus` field. | Red (#c24e3f) |
| Due Today | Assessments with `dueDate` matching today (compared via `getDemoNow()`) | Blue (#2563eb) |
| Ready to Release | Grades where `gradingStatus === "ready"` (optional field, may be `undefined`/`"none"` on older records — treat those as not ready) and no `releasedAt` | Green (#16a34a) |
| Reports Due | Unpublished report drafts (`publishState === "draft"` or `"ready"`) in open/closing cycles | Amber (#b45309) |

### Interactive Timetable Sidebar

- Vertical time rail showing today's schedule period-by-period
- Time rows derived using the same `deriveTimeRows()` algorithm currently in `student-timetable-view.tsx`. **Prep step**: extract `deriveTimeRows()` and `timeToMinutes()` from `src/components/student/student-timetable-view.tsx` into a shared `src/lib/timetable-utils.ts` module, then import from both the student view and the dashboard sidebar.
- Includes breaks and lunch rows (derived from gaps between class periods)
- Current period determined by comparing `getDemoNow()` time against each row's start/end times
- Current period: brand red left border + subtle pulse animation
- Past periods: muted/faded styling
- Future periods: normal styling
- Click any period → opens existing timetable slot sheet / class detail
- Below the timetable, stacked mini reference panels:
  - **Report Cycle**: Progress bar + "X/Y published · Closes [date]"
  - **Attention**: "N students below 50%" + "N open incidents" — clickable deep-links
  - **Recent Activity**: Last 3 items, sorted by timestamp descending. Sources: portfolio artifacts (by `createdAt`), announcement thread replies (by reply `createdAt`), incidents (by `reportedAt`). Each item shows an icon, short description, and relative time ("2h ago").

## Recommendation Engine

### Architecture

A single pure module: `src/lib/recommendation-engine.ts`

- `generateRecommendations(state, now, classFilter?)` — master function, returns sorted `Recommendation[]`. The `now` parameter should be sourced from `getDemoNow()` (from `src/lib/demo-time.ts`) since this is a demo app with a configurable clock.
- One generator per category
- `scoreAndSort()` — applies priority algorithm
- `filterByClass()` — handles class scoping

No store changes. No new types file — recommendation types are co-located in the engine module.

### Recommendation Item Shape

```typescript
interface Recommendation {
  id: string;               // deterministic, e.g. "mark-{assessmentId}"
  section: "now" | "todo";
  category: "marking" | "reports" | "attention" | "release" | "portfolio" | "incidents";
  title: string;            // "Mark 8 submissions"
  subtitle: string;         // "MYP Sciences — Lab Report"
  urgency: "overdue" | "today" | "soon" | "normal";
  deadline?: string;        // "Due tomorrow", "Closes Friday"
  count?: number;
  href: string;             // deep-link target
  classId: string;
  className: string;
}
```

### Priority Scoring Algorithm

Two factors combined — deadline proximity is the dominant signal.

**Urgency multiplier** (primary):
| Urgency | Condition | Multiplier |
|---------|-----------|------------|
| Overdue | Past deadline | ×4 |
| Today | Deadline is today | ×3 |
| Soon | Deadline within 3 days | ×2 |
| Normal | No imminent deadline | ×1 |

**Category base weight** (secondary):
| Category | Weight |
|----------|--------|
| Marking | 6 |
| Reports | 5 |
| Attention | 4 |
| Release | 3 |
| Portfolio | 2 |
| Incidents | 1 |

**Final score** = urgency multiplier × category weight

Items sorted by score descending. Ties broken by absolute deadline proximity (sooner first). Items without deadlines sort after items with deadlines at the same score.

### Recommendation Generators

#### 1. Marking Backlog (weight: 6)

- **Scan**: Each live assessment → compute to_mark count via `getToMarkCount(studentIds, grades, assessment)` from `grade-helpers.ts`. This derives `teacherReviewStatus` per student — it is not a stored field.
- **Item**: "Mark N submissions — {assessmentTitle}" / class name
- **Deadline**: Assessment `dueDate`
- **"Right Now" promotion**: Due date passed within last 24h
- **Deep-link**: `/assessments/{id}`

#### 2. Report Cycle Progress (weight: 5)

- **Scan**: Each open/closing report cycle → count reports with `publishState` of `"draft"` or `"ready"`
- **Item (drafts)**: "Finalize N report drafts — {cycleName}"
- **Item (distribution)**: "Distribute N published reports — {cycleName}" — identified by `publishState === "published"` AND `distributionStatus !== "completed"` (the `distributionStatus` field on the `Report` type tracks distribution separately from publish state)
- **Deadline**: Cycle `endDate`
- **Deep-link**: `/reports/cycles/{id}`

#### 3. Student Attention Flags (weight: 4)

- **Scan**: `computeAttentionStudents(grades, students, assessments, learningGoals)` from `grade-selectors.ts` — requires `state.learningGoals` from the store as a parameter. Returns students averaging below 50% or beginning mastery.
- **Item**: "N students need attention — {className}"
- **Deadline**: None by default (normal urgency)
- **Urgency bump**: If student dropped below threshold within last 7 days → "soon"
- **Deep-link**: `/classes/{id}`

#### 4. Grade Release (weight: 3)

- **Scan**: Each assessment → count grades with `gradingStatus === "ready"` and no `releasedAt`
- **Item**: "Release N ready grades — {assessmentTitle}" / class name
- **Deadline**: No hard deadline
- **Urgency bump**: If ALL students graded and none released → "soon" (likely forgot)
- **Deep-link**: `/assessments/{id}`

#### 5. Portfolio Reviews (weight: 2)

- **Scan**: Artifacts with `approvalStatus === "pending"`, grouped by class
- **Item**: "Review N portfolio submissions — {className}"
- **Revision resubmissions**: Artifacts back to "pending" after teacher sent `needs_revision` → separate item with "soon" urgency
- **Deadline**: Days since submission (shown as "Nd waiting")
- **Deep-link**: `/portfolio`

#### 6. Incident Follow-ups (weight: 1)

- **Scan**: Incidents with `status === "open"` or `"in_progress"`
- **Item**: "N open incidents need follow-up"
- **Urgency bump**: High severity → "soon"; older than 7 days with no follow-up → "today"
- **Deep-link**: `/student-support`

### "Right Now" Time-Aware Triggers

These produce items with `section: "now"`:

| Trigger | Condition | Item |
|---------|-----------|------|
| Attendance | Current time within a class period or 15 min before start | "Take attendance — {className} (Period N, HH:MM)" |
| Lesson prep | Lesson plan assigned to next upcoming period — looked up via `state.lessonSlotAssignments` (matches `classId + date + slotStartTime` to a `LessonSlotAssignment`), then resolves to `state.lessonPlans` for the title | "Review lesson plan — {lessonTitle} ({className})" |
| Due today | Assessment `dueDate` is today | "Assessment due today — N haven't submitted ({className})" |
| Due date passed | Assessment `dueDate` was yesterday/today + has to_mark submissions | "Due date passed — N submissions ready to mark ({assessmentTitle})" |
| End-of-day | After last scheduled period + class had no attendance session | "Attendance not taken for {className} today" |

## UI Components

### New Files

| File | Purpose |
|------|---------|
| `src/lib/recommendation-engine.ts` | Pure function engine — generators, scoring, sorting, filtering |
| `src/components/dashboard/recommendation-list.tsx` | "Right Now" + "To Do" sections container |
| `src/components/dashboard/recommendation-item.tsx` | Single recommendation card |
| `src/components/dashboard/dashboard-sidebar.tsx` | Timetable rail + reference panels |
| `src/components/dashboard/stat-cards.tsx` | 4 stat counter cards |

### Modified Files

| File | Change |
|------|--------|
| `src/app/(portal)/dashboard/page.tsx` | Full rewrite — replace all 8 existing widgets with Command Center layout |
| `src/components/student/student-timetable-view.tsx` | Minor — extract `deriveTimeRows()` and `timeToMinutes()` to shared module, replace with import |

### New Shared Utility

| File | Purpose |
|------|---------|
| `src/lib/timetable-utils.ts` | Extracted `deriveTimeRows()` and `timeToMinutes()` — shared between student timetable view and dashboard sidebar |

### Not Modified

- No store changes (`src/stores/index.ts` untouched)
- No type changes (recommendation types are local to the engine module)
- No changes to other portals (student, family, admin) — the student timetable change is a pure extraction refactor with no behaviour change
- Existing selectors reused as-is (`grade-selectors.ts`, `grade-helpers.ts`, `student-selectors.ts`)

### Recommendation Item Component

- **Left edge**: Colour-coded urgency bar (red = overdue, amber = today, blue = soon, grey = normal)
- **Left icon**: Category icon (clipboard = marking, file-text = reports, alert-triangle = attention, check-circle = release, image = portfolio, shield = incidents)
- **Body**: Title (bold, 13px) + subtitle (muted, 12px, includes class name)
- **Right side**: Deadline badge + action buttons
- **Action buttons** (appear on hover): Arrow-right (deep-link), clock (snooze), x (dismiss)

### Section Behaviour

**"Right Now":**
- Warm background tint (`#fff2f0`)
- Header: "⚡ Right Now" in brand red, uppercase
- Larger padding per item, prominent urgency bar
- Max 3 visible — "+N more" expands
- Hidden entirely when empty

**"To Do":**
- Neutral background
- Header: "To Do" in slate grey, uppercase, with item count
- Compact list-style items
- Top 8 visible — "Show all (N)" expands
- Class filter pill: "All classes ▾" toggle to override macro filter
- Empty state: "You're all caught up!" celebration

**Both empty:**
- Full empty state with illustration

### Dismiss/Snooze (Session-Only)

- Dashboard page holds `dismissedIds: Set<string>` and `snoozedIds: Set<string>` in React state
- Engine generates the full list; component filters out dismissed/snoozed before rendering
- Resets on page refresh — no persistence

### Class Filter Interaction

- Dashboard page holds `recommendationClassFilter` state (defaults to `null` = all classes)
- `useEffect` syncs `recommendationClassFilter` to store's `activeClassId` when the macro filter (header dropdown) changes — this is a one-way cascade
- Small "All classes ▾" pill in the recommendation section header allows the teacher to override back to "All" even when a specific class is selected in the header. Changing the header dropdown again resets this override.
- Engine receives `recommendationClassFilter` and scopes output accordingly: `null` = all classes, string = specific classId
- The header dropdown and the section pill are two controls but one effective filter — the section pill is a local override of the header's cascade

## Component Hierarchy

```
dashboard/page.tsx
├── Header (greeting, class filter, date)
├── Main area (flex, ~75%)
│   ├── StatCards
│   │   ├── ToMarkCard
│   │   ├── DueTodayCard
│   │   ├── ReadyToReleaseCard
│   │   └── ReportsDueCard
│   └── RecommendationList
│       ├── "Right Now" section
│       │   └── RecommendationItem × N
│       └── "To Do" section
│           └── RecommendationItem × N
└── Sidebar (flex, ~25%)
    └── DashboardSidebar
        ├── TimetableRail
        │   ├── PeriodSlot × N (clickable)
        │   └── BreakRow × N
        ├── ReportCycleMiniPanel
        ├── AttentionMiniPanel
        └── RecentActivityMiniPanel
```

## Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Pure derived engine, no store changes | Avoids store bloat; recommendations are a view concern, not persisted state |
| Deadline proximity > volume | Teacher said "upcoming deadline more important than number of incidents" |
| Session-only dismiss/snooze | Prototype scope — avoids persistence complexity |
| Class filter cascades but is overridable | Respects macro filter UX while letting teacher see cross-class priorities |
| "Right Now" hidden when empty | Avoids an empty section taking up space during off-hours |
| Max 3 Right Now + 8 To Do visible | Prevents overwhelming; expandable for full view |
| Timetable as interactive sidebar, not a widget | It's the time-awareness backbone of the engine, deserves permanent presence |
| Existing selectors reused | `computeAttentionStudents()`, `getToMarkCount()`, etc. already exist and are tested |

## Out of Scope (Future)

- **Contextual insight nudges** (trend analysis, engagement metrics) — deferred to v2
- **Persisted dismiss/snooze** — would require store changes; deferred
- **Quick-action inline buttons** (release all, take attendance from dashboard) — possible v2 enhancement
- **Notification integration** — push notifications for high-urgency items
- **Teacher-customizable priority weights** — settings panel for personal preference tuning
