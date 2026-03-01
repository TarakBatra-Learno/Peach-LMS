# Teacher Portal Prototype PRD (Revised for Claude Code)
**Version:** 1.1  
**Date:** 2026-02-28  
**Build type:** Frontend-only teacher portal prototype with mock data, local persistence, and simulated backend behavior  
**Primary user:** Teacher only (homeroom + subject)  

## 1) Build objective (non-negotiable)
Build a **demo-ready**, **production-feeling** teacher portal prototype that supports the full teacher workflow with shared class and student context:

**Assess -> Document -> Operate -> Report -> Communicate -> Support**

The prototype must look and behave like one coherent portal, not a collection of disconnected screens.

### Prototype promise
- Every visible action should look real.
- Every selected feature should appear on a plausible screen inside its module context.
- Cross-module links should make data feel shared.
- All state is mock-backed and persisted locally only.
- A 15-20 minute demo should run without dead ends.

## 2) Scope lock
### In scope
- Teacher portal only
- High and medium priority teacher features from these six modules only:
  - Assessment & Gradebook
  - Student Portfolio Management
  - Progress Reports & Transcripts
  - Classroom Communication
  - Classroom Operations
  - Behaviour & Well-Being Management
- Frontend UX, mock data, local persistence, simulated exports, and simulated analytics
### Explicitly out of scope
- Curriculum Planning
- Accreditation & Evaluation Support
- Student portal
- Parent / family portal beyond read-only preview states inside teacher flows
- Admin configuration, permissions, real auth, SIS integrations, live messaging infrastructure, real translation, live video integrations, or persistent server-side storage
- Low priority teacher features even if they appear adjacent to in-scope modules
### Adjacent features that must not be built
- Comment banks
- One-to-one messaging
- Voice messages
- Diverse submission format engines
- Custom grading system setup beyond fixed mock options
- Admin-only analytics or management pages
- Accreditation evidence collection, framework management, or evaluator workflows

## 3) Priority-to-fidelity rules
These rules are critical because the goal is not just coverage - it is buildability.
### High priority features (P0)
Every high priority feature must have:
- A discoverable primary UI surface
- At least one interactive flow (create, edit, publish, mark, share, or update)
- Believable response states: loading, success, validation, empty, and simple error state
- Local persistence and cross-module propagation if the feature participates in shared data
### Medium priority features (P1)
Every medium priority feature must have:
- A visible UI surface in the correct module context
- Enough interaction to feel real in demo, but not full production depth
- Either shallow edit capability, seeded read-only simulation, or precomputed outputs
- No need for advanced engines, deep settings systems, or comprehensive edge-case handling
### Excluded / adjacent features
Excluded features should not appear in navigation, routes, or mock menus unless necessary as static placeholders.

## 4) Primary users
### Subject teacher
- Creates and distributes assessments
- Grades student work
- Reviews class performance
- Adds evidence to portfolio and reports
- Posts announcements tied to assignments or events

### Homeroom teacher
- Takes attendance and manages class schedule context
- Reviews incidents and support follow-ups
- Publishes reports and transcripts
- Coordinates events, meetings, and family-facing updates

No additional persona should receive separate screens, privileges, or navigation.

## 5) Product principles
1. **Shared context first** - teachers work inside a class or a student most of the time.
2. **Fast demo movement** - common actions should take 1-3 clicks.
3. **Visible relationships** - grades, evidence, attendance, incidents, and reports should reference each other where appropriate.
4. **Front-end realism over back-end complexity** - simulate outcomes rather than implementing real services.
5. **No route sprawl** - prefer tabs, drawers, and modals before creating new pages.

## 6) Core information architecture
### Global shell
- Mock entry screen with one-click "Enter as Teacher"
- Persistent left navigation
- Top bar with class switcher, term selector, and compact status area
- Breadcrumbs and context chips for class, term, and report cycle

### Primary navigation
- Dashboard
- Classes
- Assessments
- Gradebook
- Portfolio
- Reports
- Communication
- Operations
- Student Support

### Shell items that are optional and should not consume major build time
- Search
- Notifications
- Profile menu details beyond Reset demo data

## 7) Core screen inventory
Build the prototype around these core surfaces. Everything in scope should land on one of them.

1. **Dashboard**
   - Today schedule
   - Grading and reporting tasks
   - Attendance exceptions
   - Portfolio activity
   - Unresolved support follow-ups

2. **Classes list**
   - Teacher's classes with quick stats

3. **Class hub**
   - Tabs: Overview, Assessments, Grade snapshot, Attendance, Portfolio, Communication, Schedule

4. **Student profile**
   - Tabs: Overview, Grades, Portfolio, Attendance, Reports, Support, Family share history

5. **Assessments workspace**
   - List, builder, detail, grading drawer/panel

6. **Gradebook workspace**
   - Grid view, student view, standards view, analytics summary

7. **Portfolio workspace**
   - Feed, review queue, artifact detail, add artifact modal

8. **Reports workspace**
   - Report cycle center, template picker, builder, preview, transcript

9. **Communication workspace**
   - Channel list, announcement feed, composer, thread view, channel settings

10. **Operations workspace**
   - Attendance register, attendance analytics, calendar, event detail, compliance export view

11. **Student Support workspace**
   - Incident list, incident detail, support analytics, taxonomy settings, student support panel

## 8) Canonical routes
Use a compact route model. Do not create routes for features that can live as tabs, panels, or modals.

- `/enter`
- `/dashboard`
- `/classes`
- `/classes/:classId`
- `/students/:studentId`
- `/assessments`
- `/assessments/:assessmentId`
- `/gradebook`
- `/portfolio`
- `/reports`
- `/reports/cycles/:cycleId`
- `/reports/:reportId`
- `/transcripts/:studentId`
- `/communication`
- `/operations/attendance`
- `/operations/calendar`
- `/operations/compliance`
- `/support`

## 9) Shared object model and relationship rules
These are the single sources of truth that make the portal feel unified.

- **Class** -> roster, timetable, attendance sessions, channels, assessments, events, report-cycle progress
- **Student** -> grades, portfolio artifacts, attendance history, incidents/support plans, reports, transcripts, family share history
- **Assessment** -> distribution state, due date, grading outputs, learning goals, report inputs, communication attachments
- **Portfolio artifact** -> student, class, learning goals, reflection state, share state, report eligibility
- **Attendance session** -> class/date records, student exceptions, analytics inputs, report summary inputs
- **Incident** -> student, optional class, collaborators, follow-ups, support notes, dashboard follow-up status
- **Report cycle / report** -> template, auto-filled content, publish state, preview state, family-facing distribution state
- **Calendar event** -> timetable item, class event, meeting, video call, deadline, optional links to assessment or report cycle

### Required cross-module propagation
- Grade changes update gradebook, student profile, report draft, and analytics cards
- Portfolio approval and tagging update student profile and report evidence picker
- Attendance exceptions update dashboard, student profile, and report attendance summary
- Incident follow-ups create or update calendar events and dashboard reminders
- Assessment publish and report publish can prefill announcement drafts

## 10) Feature coverage matrix
This is the definitive scope reference for Claude Code. Every row below must be represented in the prototype.

### Assessment & Gradebook
| Feature | Priority | Required depth | Primary UI surfaces |
|---|---|---|---|
| Assessment creation | High / P0 | Full create/edit flow | Assessments list; Assessment builder |
| Assignment distribution | High / P0 | Publish modal + state change | Assessment detail; Publish modal; Announcement draft |
| Checklists | High / P0 | Builder + grading interaction | Assessment builder; Grading panel |
| Gradebook | High / P0 | Editable core screen | Gradebook grid; Student grade view |
| Gradebook → reports integration | High / P0 | Auto-fill + visible linkage | Report builder; Report preview; Student profile |
| Rubrics | High / P0 | Builder + grading interaction | Assessment builder; Grading panel |
| Score-based grading | High / P0 | Editable scoring flow | Grading panel; Gradebook cells |
| Standards-based grading | High / P0 | Editable mastery flow | Grading panel; Standards view |
| Class-level analytics | Medium / P1 | Read-only simulated analytics | Assessment detail analytics; Dashboard widget |
| Multimodal feedback | Medium / P1 | Mock attach/select flow | Grading drawer |
| Performance analytics | Medium / P1 | Read-only simulated analytics | Gradebook analytics tab; Student profile trend |

### Student Portfolio
| Feature | Priority | Required depth | Primary UI surfaces |
|---|---|---|---|
| Continuous portfolio | High / P0 | Core browse/detail flow | Portfolio feed; Student timeline |
| Learning goal tagging | High / P0 | Editable tagging | Artifact composer; Artifact detail |
| One-click family sharing | High / P0 | Share modal + preview | Artifact detail; Family preview |
| Reflection tools | High / P0 | View/approve/edit reflection | Artifact detail; Review queue |
| Student-led portfolio creation | High / P0 | Seeded submissions + approval flow | Review queue; Artifact detail |
| Multimodal evidence capture | Medium / P1 | Mock upload flow | Add artifact modal |
| Portfolio → reports integration | Medium / P1 | Add-to-report linkage | Artifact detail; Report builder evidence picker |

### Reports & Transcripts
| Feature | Priority | Required depth | Primary UI surfaces |
|---|---|---|---|
| Data integration | High / P0 | Auto-fill from shared data | Report builder; Student profile |
| Multi-year view | High / P0 | Read-only historical navigation | Transcript view |
| One-click distribution | High / P0 | Publish/send modal + status | Report cycle center; Report preview |
| Print-ready reports | High / P0 | Preview + mock export | Report preview |
| Transcripts | High / P0 | Read-only transcript screen | Transcript view |
| Custom report building | Medium / P1 | Section add/reorder/remove | Report builder |
| Media-rich reports | Medium / P1 | Embed media evidence | Report builder; Report preview |
| Pre-built report templates | Medium / P1 | Template select flow | Report cycle center; Template picker |

### Communication
| Feature | Priority | Required depth | Primary UI surfaces |
|---|---|---|---|
| Announcements | High / P0 | Compose/send/schedule | Communication home; Composer |
| Attachments | High / P0 | Attach existing records/files | Composer attach-from modal |
| Channels | Medium / P1 | Browse/switch channels | Communication home |
| Conversation context | Medium / P1 | Pinned linked context | Thread view |
| Notification controls | Medium / P1 | Settings toggles | Communication settings |
| Translation | Medium / P1 | Preview alternate body | Composer translation toggle |

### Operations
| Feature | Priority | Required depth | Primary UI surfaces |
|---|---|---|---|
| Attendance tracking | High / P0 | Editable attendance register | Attendance register |
| Calendar | High / P0 | Month/week/day browse + event open | Calendar |
| Compliance reports | High / P0 | Operational CSV export only | Compliance export view |
| Student timetables | High / P0 | Read-only schedule surfaces | Class hub schedule; Calendar |
| Video call scheduling | High / P0 | Event type + mock join link | Event create/edit modal |
| Attendance analytics | Medium / P1 | Read-only analytics | Attendance analytics |
| Event management | Medium / P1 | Create/edit event details | Calendar; Event detail |

### Student Support
| Feature | Priority | Required depth | Primary UI surfaces |
|---|---|---|---|
| Incident logging | High / P0 | Create/update incident flow | Incident form; Student support panel |
| Sharing & collaboration | High / P0 | Assign/share collaborators | Incident detail |
| Customizable taxonomy | Medium / P1 | Simple editable categories/tags | Support taxonomy settings |
| Incident analytics | Medium / P1 | Read-only analytics | Support analytics |
| Well-being support | Medium / P1 | Support plan summary + follow-up | Student support panel |

## 11) Module implementation notes and simplifications
### 11.1 Assessment & Gradebook
- Grading by student is mandatory.
- Grade-by-question is not required.
- Support three fixed grading modes only: score, rubric, standards.
- Keep rubric and checklist structures simple and deterministic.
- Medium analytics can be seeded or computed client-side; no analytics engine needed.

### 11.2 Student Portfolio
- Use placeholder media assets rather than real uploads.
- Student-led creation can be represented by seeded pending artifacts in a review queue.
- Family sharing is a teacher-side preview and status simulation only.

### 11.3 Reports & Transcripts
- Pre-built templates and custom report building are both in scope, but custom report building should be constrained to adding, removing, and reordering a fixed set of section types.
- Media-rich reports should only embed existing portfolio artifacts or placeholder media blocks.
- Transcript is read-only historical data.

### 11.4 Communication
- Channels are class-scoped only.
- No one-to-one messaging.
- Translation is a seeded alternate-language preview, not a translation engine.
- Conversation context is a pinned context chip linking back to class, student, event, assessment, or report.

### 11.5 Operations
- Attendance register is a true editable P0 flow.
- Calendar supports event create/edit/open and linked deadlines.
- Video call scheduling is an event type with a fake join link.
- Compliance reports are **classroom operational exports only** such as attendance/export snapshots and report-distribution CSVs. They are not accreditation or evaluation features.

### 11.6 Student Support
- Incident logging and collaboration are P0 and should feel real.
- Taxonomy is medium priority and should stay lightweight: simple categories and tags, not a full governance system.
- Support plans can be a compact card with next check-in and notes.

## 12) Mock data and state architecture
### 12.1 Architecture constraints
- Front-end only
- No real server routes required for feature behavior
- Use local fixtures plus a deterministic mock service layer
- Persist state locally (for example, browser storage)
- Include a single "Reset demo data" action

### 12.2 Mock service layer
The mock layer should support:
- Stable IDs
- Seeded lists and detail records
- Filtering and sorting for list screens
- Mutations that update local state and return consistent payload shapes
- Simulated latency (roughly 200-600 ms)
- Predictable optimistic UI success states

### 12.3 Shared state behavior
- Mutations should update all connected views immediately
- Derived values should be computed from shared state, not copied into separate stores
- Analytics can be precomputed from the seed set or derived client-side

## 13) Golden demo dataset
Seed data should support both breadth and storytelling. Use a dataset that is realistic but not so large that it slows the build.

### Recommended volume
- 3 active classes: 1 homeroom, 2 subject classes
- 48-72 active students shared across those classes
- 12-16 assessments across score, rubric, and standards modes
- 80-120 portfolio artifacts
- 12-20 announcements / threads
- 6-8 weeks of attendance sessions
- 8-12 incidents plus 3-5 support plans
- 2 report cycles and 2-3 years of transcript history
- 12-18 calendar events including a few meetings and video calls

### Golden records to seed deliberately
1. A student with excellent portfolio evidence and report-ready data
2. A student with missing work and falling grade trend
3. A student with repeated lateness that triggers attention in dashboard and attendance analytics
4. A student with an open incident and follow-up meeting
5. A class with a scheduled assessment and linked announcement draft
6. A report cycle close to release with mixed readiness states across students
7. At least one family contact with alternate language preference to support translation preview

## 14) End-to-end demo journeys
These journeys must work without dead ends.

### Journey 1: Assessment -> communication -> grading -> report
- Create or duplicate an assessment
- Publish it and launch a prefilled announcement draft
- Enter grades and feedback, including missing work for at least one student
- See gradebook and student profile update
- Open a report draft and verify the grade section auto-fills

### Journey 2: Portfolio -> reflection approval -> tagging -> report -> family preview
- Open a pending student artifact
- Approve or edit the reflection
- Tag learning goals
- Add the artifact to a report
- Open family-share preview and status state

### Journey 3: Attendance -> exception -> student profile -> incident -> follow-up meeting
- Take attendance from the register
- Surface an absence or lateness exception on dashboard or analytics
- Open the student profile
- Log an incident and assign collaborators
- Create a follow-up meeting in calendar with optional channel share

### Journey 4: Report cycle -> template -> auto-fill -> publish -> print/export
- Open a report cycle
- Pick a template
- Auto-fill grades, attendance, and evidence
- Add a teacher comment and optional media section
- Publish or schedule distribution
- Open print-ready preview and transcript

## 15) Acceptance criteria
The build is done only when all of the following are true:

### Scope adherence
- All 44 selected high and medium priority teacher features in Section 10 are represented
- Curriculum Planning does not appear anywhere in nav or routes
- Accreditation & Evaluation Support does not appear anywhere in nav or routes
- No extra persona surfaces are introduced beyond Teacher

### Interaction depth
- Every P0 feature has at least one interactive, stateful flow
- Every P1 feature is visible in the correct module and feels credible in demo
- Every primary workspace has loading, success, empty, validation, and simple error states

### Cross-module coherence
- Grade changes propagate to reports and student context
- Portfolio evidence can be pulled into reports
- Attendance data feeds dashboard and reports
- Incident follow-ups can surface in calendar and dashboard
- Announcements can attach assessments, events, and reports

### Demo readiness
- A 15-20 minute walkthrough can be completed without dead ends
- Seed data is varied enough to show positive, negative, and in-progress states
- Reset demo data returns the prototype to a known state

## 16) Suggested build order
### Wave 1
- App shell, navigation, shared data store, mock service layer, reset action
- Dashboard, classes list, class hub, student profile

### Wave 2
- Assessments workspace
- Gradebook workspace
- Portfolio workspace

### Wave 3
- Reports workspace including preview and transcript
- Communication workspace

### Wave 4
- Operations workspace
- Student Support workspace
- Analytics summaries and final demo polish

### Wave 5
- Empty states, validation, toasts, consistency pass, responsive cleanup

## 17) Final instruction to the build agent
When trade-offs appear, prefer:
1. Correct scope over more screens
2. Shared state realism over deeper but isolated interactions
3. Full P0 coverage over polish on P1 features
4. Believable demo behavior over technical completeness

If time is limited, do **not** cut cross-module links or P0 teacher flows. Cut secondary shell details and advanced P1 polish first.
