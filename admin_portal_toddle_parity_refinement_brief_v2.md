# Admin Portal — Toddle Parity Refinement Brief (V2)

## What this brief is for

This is the **real source of truth for the next Codex refinement pass**.

It is not a generic inspiration note. It explicitly translates the Toddle admin research into:
- the **changes we actually want** in Peach admin
- the **Toddle depth/shape** each in-scope feature should take on
- the **minimum existence criteria** for each scoped feature so Codex does not have to guess

This pass is intentionally narrow:
- focus on the **admin features in the spreadsheet that are high or medium priority**
- assume most of those features are **already implemented to some degree**
- **upgrade those existing surfaces** so they feel materially closer to Toddle
- do **not** waste time on low-priority items
- do **not** rebuild the admin portal from scratch

The goal is **Toddle-like product depth and structure**, inside the Peach UI system.

---

## Decision on workflow

Use **one combined refinement brief** plus a **short execution prompt**.

Do **not** split this into:
1. “first add what Toddle has and we don’t”
2. “then refine what we have”

That split is weaker because it encourages Codex to:
- overfit to Toddle literally in pass 1
- then spend pass 2 undoing that to fit Peach

The better approach is:
- give Codex the **full synthesized intent once**
- make the brief explicit enough that Codex can refine the current admin portal in one coherent direction
- tell Codex to improve **already implemented in-scope features first**, not roam into speculative expansion

### Use this structure
- **Markdown brief** = durable source of truth with all detail
- **Short prompt** = tells Codex exactly which files to read and what to do

Do not rely on a single giant prompt alone.

---

## Non-negotiables from Peach

These are fixed and override Toddle parity where needed.

### Design / UX constraints
- Warm, calm, organized, supportive
- No dense BI-dashboard feel
- Standard page skeleton: page header → utility row → main content → right drawer
- One primary action per region
- Tables should use Peach’s existing sticky-header / row-action / bulk-selection language
- Charts are supportive, not the main surface
- Progressive disclosure is preferred: summary → drawer / detail panel / secondary nav

### Product / codebase constraints
- Peach is class-first and curriculum-aware when present
- There is no real backend, auth model, or permissions system
- The class hub and student profile already exist as live seeded surfaces
- Admin should reuse those existing live surfaces where required

### Two required live exceptions
The admin portal is mostly a polished superficial mock, except:
- **Admins must be able to browse all classes and open the existing live class hub**
- **Admins must be able to browse all students and open the existing live student profile**

Everything else can remain superficial unless a real existing surface is cheap and useful to reuse.

---

## Scope for this pass

The spreadsheet source of truth is the 28 high/medium-priority admin features:

### Curriculum Oversight & QA
- School-wide curriculum view
- Curriculum analytics
- Planning insights
- Cross-class visibility
- Customizable templates

### Assessment & Performance Analytics
- School-level performance dashboards
- Individual student analytics
- Standards mastery tracking
- Report oversight
- Gradebook oversight

### Communication Governance
- Admin dashboard
- Communication analytics
- Moderation controls
- Announcement management
- Privacy & confidentiality controls

### Operations Management
- Attendance management
- Attendance compliance
- Timetable management
- Calendar management
- Custom domains & branding

### Platform Administration
- User management
- SSO integration
- Data migration
- 50+ integrations
- Open APIs
- Data export
- Rostering
- Flexible plan selection

### Important instruction for Codex
Treat these features as **already present in some form** in the admin portal unless the codebase proves otherwise.
This pass is primarily about **upgrading shape, structure, page composition, table/config realism, and Toddle-like depth**.

---

## What Toddle admin actually adds that Peach should import

This section synthesizes the useful Toddle behavior from Claude pass 1 and pass 2B.

### 1. Admin is a real operational layer, not just an overview dashboard
Toddle admin feels like a governance product with real module depth:
- directories and roster tools
- curriculum setup and oversight
- grading/reporting setup
- timetable operations
- communications governance
- permissions, integrations, logs, visibility controls

**What this means for Peach:**
Admin cannot just be KPI cards + decorative placeholders. The in-scope modules need believable list pages, config pages, secondary nav, and realistic operational tables.

### 2. Toddle is table-first and config-heavy
Toddle repeatedly uses:
- searchable/filterable tables
- row kebab menus
- bulk selection patterns
- column settings / gear controls
- status chips
- download/export affordances
- summary cards above tables
- toggle matrices and settings grids
- setup assistants / checklist pages

**What this means for Peach:**
Whenever one of our in-scope admin pages is currently too cardy, too dashboard-like, or too shallow, move it toward a Toddle-like table/config surface.

### 3. Complex modules are internally structured
Toddle does not flatten complex admin modules. It gives internal structure to:
- timetable
- datasets/templates
- grading setup
- reporting setup
- notifications
- module settings
- roles & permissions
- integrations
- history / logs / bin

**What this means for Peach:**
Use sub-tabs, secondary left-nav, segmented sections, or page-level sidebars for deeper modules.

### 4. Roster is first-class
Toddle strongly centers:
- classes
- students
- staff
- family members

**What this means for Peach:**
Classes and Students must be first-class entry points in the admin IA, and Staff/Families should exist as credible supporting directories.

### 5. Toddle has school-level governance and programme-aware operations
Toddle conceptually splits:
- school/account controls
- programme-specific academic setup

**What this means for Peach:**
Do not copy Toddle’s duplicated school/programme portals literally.
Compress that idea into one coherent admin portal with:
- school-wide default views
- programme filter / tabs where useful
- no duplicate shells

### 6. Toddle uses recognizable operational metaphors
Useful examples:
- announcements behave like an inbox with folders
- timetable setup behaves like a setup assistant + config sub-pages
- report oversight behaves like a workflow monitor with status matrices
- notifications behave like trigger × channel grids
- module visibility behaves like a matrix by audience

**What this means for Peach:**
We should not just label pages after the spreadsheet. We should shape them into familiar, believable operational tools.

---

## What not to copy literally from Toddle

- Separate school-level and programme-level duplicate portals
- Heavy IB-specific internal terminology where Peach should stay more general
- Deep grading-engine configuration details beyond demo value
- Fully functional messaging systems or irreversible admin tools
- Excessively deep per-device visibility controls unless shown selectively in one illustrative matrix
- Any backend-heavy workflows that would create dead or fake interactivity

Goal: **replicate Toddle’s product shape and feature depth, not its exact implementation sprawl**.

---

## Recommended admin IA after this refinement

Top-level nav:
- Overview
- Classes
- Students
- Curriculum
- Performance
- Communications
- Operations
- Platform

Supporting directories / sub-surfaces:
- Staff
- Families

Why this IA:
- Toddle research shows Classes and Students must be first-class, not buried
- It keeps the admin portal coherent and school-wide
- It lets the two live exceptions sit in obvious places

---

# PAGE-LEVEL REFINEMENT PLAN

This is the part Codex should implement against.
Each section below says:
- which spreadsheet features it covers
- what Toddle actually does there
- what we want Peach to become
- what counts as “feature exists” after the refinement

---

## 1. Overview

### Covers these scoped features
- School-level performance dashboards
- Admin dashboard (communications)
- Communication analytics (summary layer)
- Attendance management (summary layer)
- Attendance compliance (summary layer)
- Report oversight (summary layer)
- Planning insights (summary layer)
- Platform health / integrations summary

### Toddle behavior to replicate
Toddle’s programme home acts as a launchpad into deeper modules.
The useful part is not a giant dashboard; it is the mix of:
- high-level status tiles
- module entry points
- counts and alerts
- current operational health

### Peach change we want
Refine `/admin` Overview so it feels like a **launchpad into deep modules**, not the entire admin product.

### Required surface shape
Overview should include:
- KPI strip: students, staff, active classes, attendance today, reports in progress, integrations health
- Programme snapshot cards: PYP / MYP / DP or equivalent continuum view
- Curriculum health card: completion / gaps / planning insights entry
- Performance risk card: at-risk year groups / students needing review
- Communication health card: unread / unsent / scheduled / reach summary
- Operations card: attendance marked %, timetable health, upcoming calendar exceptions
- Platform card: connected integrations, sync health, recent export / migration / API activity
- Recent activity / audit feed

### Toddle nuance to preserve
This page should **point onward**.
Every major card should lead into a real admin module page.
Do not trap everything on the overview.

### Minimum existence criteria
This feature set exists if:
- Overview clearly launches into all major admin modules
- There is a school-wide snapshot rather than a single analytics wall
- At least 5–6 cards are clickable and feel tied to deeper module pages
- Recent activity / audit feed is present

### Live vs superficial
Superficial summary surfaces only.
No need for real backend logic.

---

## 2. Classes

### Covers these scoped features
- Cross-class visibility

### Toddle behavior to replicate
Toddle’s Classes roster is a true operational table with:
- class name
- staff count
- grades
- student count
- subject
- search / filters / download / bulk selection / settings gear / row actions

Toddle class detail also has admin-facing tabs such as:
- Students
- Family members
- Staff members
- Portfolio settings
- Timetable configuration

### Peach change we want
Upgrade the current admin Classes surface into a **Toddle-like school-wide classes directory**.
This is one of the two required live exceptions.

### Required surface shape
Main page:
- School-wide table, not cards
- Columns:
  - Class name
  - Programme
  - Grade / Year group
  - Subject
  - Staff count
  - Student count
  - Status
- Utility row:
  - Search
  - Programme filter
  - Grade filter
  - Subject filter
  - Status filter
- Table affordances:
  - bulk selection
  - column settings gear
  - download/export button
  - row kebab menu
  - row hover actions

Optional preview / wrapper:
- Right drawer or wrapper tabs with:
  - Students
  - Families
  - Staff
  - Portfolio settings
  - Timetable

### Toddle nuance to preserve
The table should feel operational and sortable, not decorative.
The row itself should feel like the entry point to a real class context.

### Critical drill-in rule
Primary row click or “Inspect class” must open the **existing live class hub**.
Do not build a fake admin-only class detail that replaces the real surface.

### Minimum existence criteria
This feature exists if:
- There is one school-wide classes table
- It supports search + multiple filters + row actions
- It shows meaningful counts and context like Toddle
- Clicking a class opens the real class hub
- If a preview drawer exists, it includes at least 3 Toddle-like tabs

### Live vs superficial
Hybrid:
- directory / preview = superficial admin layer
- final inspect destination = live class surface

---

## 3. Students

### Covers these scoped features
- Individual student analytics (entry path)
- School-level performance dashboards (student drill-down path)

### Toddle behavior to replicate
Toddle’s Students roster is a real operational directory with:
- student name / email
- class count
- family members
- filters by year group / class / status
- row actions such as edit, sign-in code, block, archive, logout, portfolio download

Toddle’s performance area also allows drill-down to student-level grade views.

### Peach change we want
Upgrade the current admin Students surface into a **Toddle-like school-wide student directory** with strong drill-in behavior.
This is the second required live exception.

### Required surface shape
Main page:
- Table, not cards
- Columns:
  - Student name
  - Programme
  - Grade / Year group
  - Classes or primary class
  - Family connection state
  - Support / flag state
  - Status
- Utility row:
  - Search
  - Programme filter
  - Grade filter
  - Class filter
  - Status filter
- Table affordances:
  - bulk selection
  - download/export
  - row kebab menu
  - column settings

Optional row actions (demo-only):
- View profile
- Download portfolio
- View family connections
- Print sign-in / access code
- Block / archive (non-functional)
- Logout all devices (non-functional)

### Toddle nuance to preserve
The roster should communicate family relationship state and student account state, not just academic identity.

### Critical drill-in rule
Primary row click or “Inspect student” must open the **existing live student profile**.

### Minimum existence criteria
This feature exists if:
- There is a master students directory with school-wide filters
- Family / support / status context is visible in the table
- There is a clear drill path to the live student profile
- The page feels like a true operational directory rather than a list of profile cards

### Live vs superficial
Hybrid:
- directory = superficial admin layer
- final inspect destination = live student profile

---

## 4. Curriculum

### Covers these scoped features
- School-wide curriculum view
- Curriculum analytics
- Planning insights
- Customizable templates

### Toddle behavior to replicate
Toddle’s curriculum/admin setup uses several distinct surfaces:
- **Subjects** page grouped by subject group, showing mapped grades and associated units/classes
- **Planning insights** landing + drill-down with vertical/horizontal overviews and coverage matrices
- **Standards / datasets / templates** as categorized sub-portals with sidebar nav and filters
- **Policies and resources** as searchable, shareable document tables

### Peach change we want
Curriculum should stop feeling like a generic overview and instead feel like a **real oversight + setup module**.

### Recommended internal structure
Sub-nav or top tabs:
- Overview
- Subjects
- Insights
- Standards
- Templates
- Policies

### 4A. School-wide curriculum view

#### Toddle shape
- subject-group-grouped list
- mapped grades
- associated units/classes counts
- search + grade/status filters

#### Peach refinement
Create a Subjects / Curriculum Overview page with:
- grouped rows by subject group
- columns:
  - Subject
  - Programme / Grade scope
  - Units count
  - Classes count
  - Status
- clickable unit/class counts that open filtered drawers or linked views
- search + grade/programme filter

#### Minimum existence criteria
Exists if:
- subjects are grouped by subject group
- each row shows mapped grades and unit/class breadth
- admin can scan school-wide curriculum spread quickly

### 4B. Curriculum analytics

#### Toddle shape
Toddle shows matrix views where:
- rows = curriculum elements
- columns = grade levels
- cells = unit counts / coverage counts
- subject filter available

#### Peach refinement
Add a read-only analytics view with:
- one coverage matrix
- summary stat cards above it
- subject/programme filter
- optional download action

#### Minimum existence criteria
Exists if:
- at least one real-looking coverage matrix is present
- rows and columns are meaningful and labelled
- the page feels like oversight, not decoration

### 4C. Planning insights

#### Toddle shape
Toddle has:
- 2–3 insight cards on the landing page
- drill-down with vertical / horizontal overview
- subject group sidebar navigation
- include-units / similar filter behavior

#### Peach refinement
Add a Planning Insights surface with:
- 2–3 clickable insight cards
- detail state with a simple matrix or grouped table
- vertical vs horizontal segmented control or tabs
- subject / programme filter

#### Minimum existence criteria
Exists if:
- there is a small landing summary
- there is a drill-down state
- vertical vs horizontal perspective is represented clearly

### 4D. Customizable templates

#### Toddle shape
Toddle’s datasets/templates area uses categories like:
- datasets
- assessment tool templates
- other templates
with search, grade filters, subject filters, and clear empty states.

#### Peach refinement
Build a Templates surface with category sidebar or tabs:
- Planning templates
- Assessment templates
- Reporting templates
- Optional reference datasets

For each category, show:
- template name
- subject scope
- grade scope
- type badge
- creator / updated metadata
- create CTA (can be non-functional)

#### Minimum existence criteria
Exists if:
- templates are categorized
- filters exist
- seeded templates look reusable and school-wide
- empty-state patterns are used where relevant

### Live vs superficial
Curriculum module is fully superficial for this pass.
No need to wire real curriculum analytics.

---

## 5. Performance

### Covers these scoped features
- School-level performance dashboards
- Individual student analytics
- Standards mastery tracking
- Report oversight
- Gradebook oversight

### Toddle behavior to replicate
Toddle’s performance stack is deeper than a dashboard:
- Gradebook starts at year group level
- then allows Class view / Student view toggles
- student drill-down shows score matrices with academic year / grading period filters
- reporting oversight tracks active cycles and workflow states
- grading setup is organized as a config area with sidebar sections

### Peach change we want
Performance should feel like a **school-wide academic oversight module**, not just charts.

### Recommended internal structure
Sub-nav or top tabs:
- Overview
- Gradebook
- Standards
- Reports
- Students

### 5A. School-level performance dashboards

#### Toddle shape
Toddle gradebook begins with year-group-level summaries and drill-down choices.

#### Peach refinement
Performance Overview should include:
- year group / grade summary cards
- class performance summary table
- flagged students / classes panel
- filters for programme, academic year, reporting period
- links to Gradebook / Reports / Student drill-ins

#### Minimum existence criteria
Exists if:
- admins can scan performance at year-group and class level
- the page leads to deeper views instead of ending in charts

### 5B. Individual student analytics

#### Toddle shape
Toddle student drill-down includes:
- student header
- section sidebar or sub-sections
- subjects × criteria / score matrix
- academic year and grading-period filters
- previous/next student navigation

#### Peach refinement
Do **not** rebuild a duplicate student analytics page if the live student profile already covers the depth.
Instead:
- make the Performance module link strongly into the live student profile
- add admin-context framing if useful (breadcrumb / return link / “opened from admin” state)
- ensure the student directory and performance lists can both reach that profile

#### Minimum existence criteria
Exists if:
- performance lists can open the live student profile
- the route feels intentionally connected to admin oversight
- there is no dead-end fake analytics page replacing the real student profile

### 5C. Standards mastery tracking

#### Toddle shape
Toddle shows standard sets grouped by subject group with status, item count, and update metadata.
Student-level standards views sit deeper in gradebook.

#### Peach refinement
Add a Standards page with:
- grouped standard/framework cards or table rows by subject group
- columns / fields:
  - Standard set name
  - Subject group
  - Item count
  - Last updated
  - Status
- optional mastery preview strip per framework
- row click opens a read-only preview drawer, not authoring

#### Minimum existence criteria
Exists if:
- standards are grouped and countable
- the page feels like framework oversight, not a decorative list

### 5D. Report oversight

#### Toddle shape
Toddle’s report oversight uses:
- ongoing / previous split
- report cycle cards or rows
- deadline badges
- drill-in status matrix by grade and workflow state (pending, locked, shared, excluded)

#### Peach refinement
Add a Reports page with:
- Ongoing and Previous sections
- each report cycle showing:
  - title
  - reporting period
  - deadline
  - grades / programmes involved
  - status badge
- drill-in or expanded detail with grade-level workflow counts

#### Minimum existence criteria
Exists if:
- report cycles are separated into ongoing vs previous
- there is deadline/status visibility
- a grade-level workflow breakdown is visible somewhere

### 5E. Gradebook oversight

#### Toddle shape
Toddle combines a year-group entry layer with class/student drill paths and a separate grading setup/config area.

#### Peach refinement
Add a Gradebook page with:
- year-group summary cards or rows
- Class view / Student view toggle
- class grouped list below
- read-only grading configuration summary panel or secondary tab
  - grading scale
  - assessment categories
  - release / calculation summary

#### Minimum existence criteria
Exists if:
- admin can read gradebook oversight from year-group downwards
- there is a class/student perspective toggle
- grading config is represented somewhere as a read-only admin reference

### Live vs superficial
Performance is mostly superficial, except that student drill-down should use the live student profile.

---

## 6. Communications

### Covers these scoped features
- Admin dashboard
- Communication analytics
- Moderation controls
- Announcement management
- Privacy & confidentiality controls

### Toddle behavior to replicate
Toddle contributes three useful patterns here:
- Announcements as an inbox-like management surface with folders and split detail view
- Messaging/communications separated by audience tabs
- Notifications / visibility as admin matrices and toggle grids

### Peach change we want
Communications should feel like a **governance layer**, not a mini chat app.

### Recommended internal structure
Sub-nav or top tabs:
- Dashboard
- Announcements
- Analytics
- Moderation
- Privacy

### 6A. Communication admin dashboard

#### Toddle shape
Toddle surfaces announcement counts, inbox/sent/scheduled states, and audience-scoped messaging lists.

#### Peach refinement
Create a dashboard page with:
- recent announcements list
- scheduled / sent / drafts / unread summary cards
- audience activity cards (students / families / staff)
- recent moderation or privacy exceptions if relevant

#### Minimum existence criteria
Exists if:
- admins can quickly understand communication volume and state
- there is a clear launch path to Announcements / Analytics / Moderation

### 6B. Communication analytics

#### Toddle shape
Toddle does not expose a full analytics dashboard directly, but its counts and read indicators imply one.

#### Peach refinement
Create a lightweight analytics page with:
- stat cards:
  - announcements this term
  - read rate
  - active conversations
  - messages this week
- one simple trend chart or bar strip
- date range and audience filter

#### Minimum existence criteria
Exists if:
- there is a clearly legible analytics summary
- filters make it feel admin-grade rather than decorative

### 6C. Moderation controls

#### Toddle shape
Toddle’s Notifications Manager is one of its clearest admin patterns:
- audience tabs (Staff / Students / Family)
- master toggle per audience
- trigger × channel grid
- grouped trigger categories

#### Peach refinement
Build a Moderation page with:
- audience tabs: Staff / Students / Families
- master enable toggle per audience
- grouped trigger rows by category
- channels as columns (In-app / Email / Push)
- toggles per cell

Use 8–12 representative triggers only; do not create fake exhaustive depth.

#### Minimum existence criteria
Exists if:
- there is one audience-tabbed notification matrix
- trigger rows are grouped by category
- channels are represented as real-looking toggle columns

### 6D. Announcement management

#### Toddle shape
Toddle’s announcement management uses:
- Inbox / Drafts / Scheduled / Sent / Trash folders
- list/detail split pane
- search / filter / sort
- create announcement CTA
- author/date/read state in list rows

#### Peach refinement
Upgrade announcement management to a **foldered inbox-like page**, not a plain table.

Required shape:
- left sidebar or segmented folders:
  - Inbox
  - Drafts
  - Scheduled
  - Sent
  - Trash
- middle list:
  - title
  - preview
  - audience
  - date
  - author
  - unread indicator / status chip
- right detail panel or split-pane detail
- create CTA (can lead to a superficial composer)

#### Minimum existence criteria
Exists if:
- announcements use folder-based organization
- there is a list/detail interaction model
- seeded content feels recent and real

### 6E. Privacy & confidentiality controls

#### Toddle shape
Toddle uses:
- module visibility matrices (programme / students / family)
- roles & permissions tiers (account / programme / class)

#### Peach refinement
Build a Privacy page with two parts:
1. Module visibility matrix
2. Roles / access summary

Keep it simpler than Toddle, but show:
- module name
- enabled / visible to students / visible to families
- role names and member counts

#### Minimum existence criteria
Exists if:
- there is a multi-column visibility matrix
- there is a read-only role/access summary
- it clearly communicates who can see what

### Live vs superficial
Communications is superficial for this pass.
Do not build a true messaging backend.

---

## 7. Operations

### Covers these scoped features
- Attendance management
- Attendance compliance
- Timetable management
- Calendar management
- Custom domains & branding

### Toddle behavior to replicate
Toddle’s operations/admin surfaces are notably structured:
- Attendance has both a dashboard view and a setup/settings layer
- Timetable is a true sub-portal with checklist + config pages + multiple timetable perspectives
- Calendar defaults to an admin-friendly scannable agenda with filters
- Branding / school info is a real configuration form

### Peach change we want
Operations should feel like a serious operational console, but still calm and Peach-native.

### Recommended internal structure
Sub-nav or top tabs:
- Attendance
- Compliance
- Timetable
- Calendar
- Branding

### 7A. Attendance management

#### Toddle shape
Toddle attendance uses:
- summary counts bar (marked / present / excused / absent / tardy)
- Daily and Students views
- class/date/view filters
- settings area with setup assistant cards

#### Peach refinement
Attendance page should include:
- summary bar across top
- Daily / Students tabs
- date navigation
- class filter
- optional view range control
- student list or class list with status badges
- secondary settings panel or sub-tab for configuration

#### Minimum existence criteria
Exists if:
- daily operational attendance can be scanned quickly
- the page includes a summary bar and at least two views
- there is a visible path to configuration / setup

### 7B. Attendance compliance

#### Toddle shape
Toddle does not have a dedicated compliance page in the audit, but its attendance dashboard + calculation settings imply threshold monitoring.

#### Peach refinement
Build a Compliance page with:
- threshold summary card (e.g. below 85%)
- flagged students table
- attendance percentage column
- risk badge / streak / absences count
- date range + class/programme filters

#### Minimum existence criteria
Exists if:
- flagged students are easy to identify
- thresholds and risk logic are visible in the UI
- the page feels operational, not just analytical

### 7C. Timetable management

#### Toddle shape
Toddle’s timetable is one of the clearest parity targets.
It is not one page. It has:
- Checklist
- Periods
- Bell schedules
- Routines
- Schedule calendar
- Class timetable
- Student timetable
- Teacher timetable
- Import log

#### Peach refinement
Timetable must become a **deeper structured module**.

Use secondary nav with these sections:
- Setup checklist
- Periods
- Bell schedules
- Routines
- Schedule calendar
- Class view
- Student view
- Teacher view
- Import history

Key page expectations:
- Setup checklist uses completion cards or checklist rows
- Periods is a table of named periods/breaks
- Bell schedules is a list/table of named schedules
- Routines shows cycle/day structures
- Schedule calendar shows a monthly mapped calendar
- Class/Student/Teacher views each show weekly timetable grids with selector controls
- Import history shows previous uploads with timestamp and actor

#### Minimum existence criteria
Exists if:
- timetable is clearly a multi-page or deeply tabbed module
- setup/config and schedule views are both represented
- class/student/teacher timetable perspectives exist
- there is an import/history surface

### 7D. Calendar management

#### Toddle shape
Toddle calendar uses:
- Agenda / Week / Month
- filter sidebar
- event-type filters with checkboxes
- class filter
- color-coded events

#### Peach refinement
Upgrade Calendar to:
- agenda default
- view switcher: Agenda / Week / Month
- filter sidebar for classes and event types
- event list rows with context (class / audience / type / participant count)
- create CTA can remain superficial

#### Minimum existence criteria
Exists if:
- agenda view is present and readable
- filters exist in a left sidebar or strong utility section
- event types are color-coded consistently

### 7E. Custom domains & branding

#### Toddle shape
Toddle’s school information page includes:
- school logo
- display name
- report display name
- school code
- address and contact information

#### Peach refinement
Build Branding / School Information as a real settings form with:
- logo upload area
- school name
- display name for reports
- custom domain / subdomain status card
- school code / ID
- address + contact form
- optional theme preview or domain health card

#### Minimum existence criteria
Exists if:
- this feels like a real school identity/config page
- logo, names, contact details, and domain status are all visible

### Live vs superficial
Operations is superficial for this pass.
No need for functional schedule math or attendance calculation logic.

---

## 8. Platform

### Covers these scoped features
- User management
- SSO integration
- Data migration
- 50+ integrations
- Open APIs
- Data export
- Rostering
- Flexible plan selection

### Important caveat
This is the module where Toddle evidence is **most mixed**.

Strongly observed in the audit:
- staff / students / family directories
- roles & permissions
- integration settings (LTI apps, Turnitin)
- user activity logs
- module toggles
- user name settings
- student flag settings

Less directly observed in the audit, but consistent with Toddle’s public integrations surface:
- SSO
- SIS / rostering sync
- schedule/attendance/grade sync
- Google / Microsoft integrations
- broader integrations catalog

Not directly verified in the audit:
- open APIs
- data migration tooling
- flexible plan selection / billing

So for this pass:
- make Platform feel **Toddle-like in shape and seriousness**
- do **not** invent overly specific Toddle behavior where the audit did not verify it
- use Toddle’s observed patterns: settings cards, status chips, logs, history tables, read-only config panels, setup assistants

### Recommended internal structure
Sub-nav or top tabs:
- Users
- Roles & Permissions
- Integrations
- Data & Rostering
- Exports & Logs
- Plan

### 8A. User management

#### Toddle shape
Toddle exposes roster-style admin directories for:
- Staff
- Students
- Family members
- External staff
with operational row actions and account/context metadata.

#### Peach refinement
Create a Users module with tabs:
- Staff
- Students
- Families
- External

Each tab should use a Toddle-like operational table with:
- name
- email / ID
- role / relationship
- programme or class context
- status
- row actions
- search / filters / bulk selection / export

#### Minimum existence criteria
Exists if:
- Users feels like a real directory module, not profile cards
- Staff/Students/Families are each represented in table form
- role / status / context columns are present

### 8B. Roles & permissions

#### Toddle shape
Toddle uses a three-level role model:
- account roles
- programme roles
- class roles
plus member counts and custom-role capabilities.

#### Peach refinement
Build Roles & Permissions with:
- Setup assistant / intro panel
- Account roles tab
- Programme roles tab
- Class roles tab
- read-only permission matrix or summary drawer

#### Minimum existence criteria
Exists if:
- role tiers are visible
- role counts or assigned users are visible
- there is at least one permission summary surface

### 8C. SSO integration + 50+ integrations

#### Toddle shape
Observed Toddle admin includes integration settings such as LTI apps and Turnitin.
Public Toddle materials also emphasize SSO, SIS integration, rostering, and Google/Microsoft workflows.

#### Peach refinement
Integrations page should combine:
- Connected integrations section
- Available integrations catalog
- connection status chips
- provider cards / rows
- last sync / last connected metadata
- setup CTA or read-only details drawer

Suggested categories:
- SIS / Rostering
- SSO
- Classroom / Productivity
- Assessment / Anti-plagiarism
- Communication

Suggested seeded examples:
- Google Workspace
- Microsoft 365
- Turnitin
- Veracross
- Blackbaud
- iSAMS / similar
- LTI Apps

#### Minimum existence criteria
Exists if:
- integrations are grouped and statused
- at least one SSO / SIS / LTI / productivity example exists
- the page feels like a serious platform settings page

### 8D. Data migration

#### Toddle-adjacent shape to use
Not directly verified as a Toddle page in the audit.
Use Toddle-like patterns instead:
- setup assistant cards
- import history table
- mapping summary cards
- status chips / progress states

#### Peach refinement
Add a Data Migration page with:
- checklist / setup assistant across top
- seeded migration jobs table
- source system column
- status / updated / owner columns
- import log drawer or detail panel

#### Minimum existence criteria
Exists if:
- data migration feels like a real admin workflow with history and status
- the page uses Toddle-like checklist + history patterns

### 8E. Open APIs

#### Toddle-adjacent shape to use
Not directly verified in the audit.
Treat this as a read-only technical settings surface.

#### Peach refinement
Create an Open APIs page with:
- API access overview card
- environment / endpoint summary
- key/token rows (masked)
- recent API activity or usage table
- docs / webhook / export endpoint cards

#### Minimum existence criteria
Exists if:
- APIs are represented as an operational settings surface, not a blank placeholder
- there is visible status / access / usage information

### 8F. Data export

#### Toddle shape to borrow
Toddle strongly uses export / download affordances, logs, and operational tables across admin.

#### Peach refinement
Create an Export Center with:
- export cards by data domain
- recent export jobs/history table
- columns:
  - export type
  - format
  - requested by
  - requested at
  - status
- download buttons can be superficial

#### Minimum existence criteria
Exists if:
- exports look like repeatable admin operations with history
- multiple data domains are represented

### 8G. Rostering

#### Toddle shape
This aligns best with Toddle’s observed member directories plus public SIS/rostering integration positioning.

#### Peach refinement
Create a Rostering page with:
- source system summary card
- roster sync status
- counts for students / staff / classes / enrollments synced
- schedule type / sync cadence
- recent sync log table
- mapping summary or exceptions panel

#### Minimum existence criteria
Exists if:
- rostering is visible as an operational sync/config surface
- counts, status, and recent jobs are all present

### 8H. Flexible plan selection

#### Toddle-adjacent shape to use
Not directly verified in the audit.
Treat as a subscription / plan-management settings page.

#### Peach refinement
Create a Plan page with:
- current plan card
- modules enabled summary
- seat counts / storage / usage summary
- billing cycle or renewal summary
- upgrade / contact CTA
- comparison cards for alternative plan tiers

#### Minimum existence criteria
Exists if:
- this looks like a real plan/settings page with clear current-state and options
- enabled modules / limits / upgrade path are visible

### Live vs superficial
Platform is fully superficial for this pass.
Use strong settings realism, not fake deep functionality.

---

# FEATURE COVERAGE MATRIX

This section maps every scoped spreadsheet feature to its refined Peach destination.

| Scoped feature | Peach destination after refinement | Toddle pattern we are intentionally replicating |
|---|---|---|
| School-wide curriculum view | Curriculum > Subjects / Overview | Subject-group grouped table with mapped grades and unit/class counts |
| Curriculum analytics | Curriculum > Insights detail | Coverage matrix with rows × grade columns + filters |
| Planning insights | Curriculum > Insights landing | 2–3 insight cards + vertical/horizontal drill-down |
| Cross-class visibility | Classes | School-wide operational class roster table with deep link to live class hub |
| Customizable templates | Curriculum > Templates | Categorized template library with sidebar/tabs and filters |
| School-level performance dashboards | Performance > Overview | Year-group / class-level overview with drill-down pathways |
| Individual student analytics | Students + Performance drill-ins | Student directory + deep link to live student profile |
| Standards mastery tracking | Performance > Standards | Grouped standards/framework list with counts and preview |
| Report oversight | Performance > Reports | Ongoing/Previous report cycles + status matrix + deadline badges |
| Gradebook oversight | Performance > Gradebook | Year-group entry layer + class/student toggle + config summary |
| Admin dashboard | Communications > Dashboard | Overview of communication activity and launch points |
| Communication analytics | Communications > Analytics | Stat cards + trend view |
| Moderation controls | Communications > Moderation | Audience tabs + trigger × channel grid |
| Announcement management | Communications > Announcements | Foldered inbox-like list/detail split pane |
| Privacy & confidentiality controls | Communications > Privacy + Platform > Roles | Visibility matrix + role/access summary |
| Attendance management | Operations > Attendance | Summary bar + Daily/Students tabs + config entry |
| Attendance compliance | Operations > Compliance | Threshold / flagged-students operational table |
| Timetable management | Operations > Timetable | Multi-section module: checklist, periods, schedules, routines, views, history |
| Calendar management | Operations > Calendar | Agenda-default calendar with left filters and event tags |
| Custom domains & branding | Operations > Branding | School info/settings form with logo, names, contact, domain status |
| User management | Platform > Users | Roster-style operational directories by person type |
| SSO integration | Platform > Integrations | Connected provider cards/rows with status and setup details |
| Data migration | Platform > Data & Rostering | Checklist + migration history/log patterns |
| 50+ integrations | Platform > Integrations | Grouped catalog of available and connected integrations |
| Open APIs | Platform > APIs / Exports | Read-only technical settings surface |
| Data export | Platform > Exports & Logs | Export center with job history |
| Rostering | Platform > Data & Rostering | Sync status, counts, mapping summary, job history |
| Flexible plan selection | Platform > Plan | Current-plan summary + alternative tiers |

---

# REFINEMENT PRIORITY ORDER FOR CODEX

Codex should implement this in the following order:

## Priority 1 — Fix structure and navigation
- Ensure top-level IA matches this brief
- Promote Classes and Students to first-class nav items
- Add internal structure to Curriculum / Performance / Communications / Operations / Platform

## Priority 2 — Upgrade shallow surfaces into Toddle-shaped pages
The biggest gains will come from turning shallow pages into:
- real directories
- operational tables
- foldered list/detail pages
- status matrices
- checklist/setup pages
- read-only settings/config surfaces

## Priority 3 — Strengthen the two live drill-ins
- Classes directory → live class hub
- Students directory → live student profile

## Priority 4 — Expand only the seed data needed to support the new page shapes
Do not bloat the whole LMS.
Add breadth mainly to the admin read model.

## Priority 5 — Polish consistency
- align filters / row actions / drawers / chips / empty states / audit metadata
- keep the portal calm and cohesive with Peach

---

# WHAT TO AVOID IN THIS PASS

- Rebuilding the admin shell from zero
- Creating backend-heavy fake workflows
- Duplicating existing class or student surfaces
- Over-indexing on pretty dashboards instead of operational credibility
- Copying Toddle’s school/programme duplication literally
- Spending too much time on low-priority features or speculative net-new areas

---

# SHORT IMPLEMENTATION TEST

Codex’s output is on the right track if, after the pass:
- admin feels like a real governance portal rather than a dashboard demo
- Classes and Students feel central and drill into real live LMS surfaces
- Curriculum / Performance / Communications / Operations / Platform all have clear internal structure
- table/config realism is materially stronger
- announcement, timetable, moderation, report oversight, and integrations pages each have recognizably Toddle-like shapes
- the portal remains unmistakably Peach in tone and interaction style

