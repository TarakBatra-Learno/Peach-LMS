# Teacher And Student Toddle-Parity Upgrade — Design Spec

## Overview

Upgrade the existing Peach LMS teacher portal so it more closely reflects Toddle's scoped teacher feature set, while preserving Peach's existing demo strengths and keeping the implementation prototype-safe.

This design also covers the required dependent student portal changes and the seed-data expansion needed to make the upgraded flows feel end-to-end and demo-ready.

The goal is not to clone Toddle literally. The goal is to build a stronger IB LMS demo that:

- matches the expected feature scope more convincingly
- reflects Toddle's product shape where it matters
- preserves Peach's current design language and demo architecture
- incorporates Peach's adjacent platform-native assessment capabilities

## Scope

### In scope

- Teacher portal planning upgrade
- Teacher portal assessment architecture upgrade
- Teacher portal submission review and AI feedback upgrade
- Teacher gradebook and standards/skills mastery integration
- Teacher report integration improvements
- Student portal changes required to support the new assessment types and released assessment reports
- Seed-data changes required to make the above flows believable

### Out of scope

- Real-time collaboration
- True multi-user comments/notifications backend
- Production-grade assessment engine architecture
- Full planner-template builder
- Fully exhaustive IB framework banks
- Full Toddle Library equivalent
- Real AI generation backend

## Product goals

1. Make planning and assessments feel like two equally important teacher workflows.
2. Preserve the ability to create and manage lessons and assessments both inside and outside unit plans.
3. Introduce platform-native assessment types without breaking the pedagogical structure of the LMS.
4. Make assessment review feel substantially more sophisticated through per-student and class-level AI-style report artifacts.
5. Improve Toddle parity in the areas most visible to teachers:
   - yearly planning
   - unit detail structure
   - lesson linkage
   - standards tagging
   - assignment distribution
   - gradebook/report integration
6. Ensure the student portal clearly reflects the new assessment types and released feedback model.
7. Use seed data deliberately so the upgraded experience works as a demo, not as disconnected UI.

## Core approved decisions

### Teacher product strategy

- Use a **dual-spine** teacher model:
  - planning is first-class
  - assessments are first-class
- Do not force all lessons or assessments to originate inside unit plans.

### IA reshaping tolerance

- Moderate reshaping is acceptable.
- A stronger top-level `Planning` route is allowed.
- Existing teacher nav and route family should remain recognizable unless a low-risk change materially improves parity.

### Assessment model

Each assessment has two independent axes:

- `type`
  - `off_platform`
  - `quiz`
  - `chat`
  - `essay`
- `intent`
  - `formative`
  - `summative`

Inside `off_platform`, submission mode options are:

- default: student digital submission
- optional: `offline_mode`
  - teacher-observed / teacher-recorded
  - no student digital submission required

### Planning fidelity

Use **focused parity**, not a full planning-product rebuild.

Must include:

- stronger yearly planning views
- top-level planning hub
- class-scoped planning authoring
- stronger unit detail structure
- lessons nested in planning flow
- standards/concepts tagging
- planning insights and curriculum-map-style read-only views
- visible collaborative planning cues

Must not require:

- live collaborative editing
- full planner-template builder
- deeply exhaustive framework-specific field banks

### Collaborative planning

Collaboration should be **visible**, not fully operational:

- collaborator avatars
- section-level comments
- activity/history signals
- reviewer/owner cues

No live presence or simultaneous editing is required.

### AI assessment feedback

Use a **hybrid** model:

- class-level assessment insights
- per-student assessment report artifacts

Per-student assessment report should include:

- strengths
- weaknesses / misconceptions
- suggestions / next steps
- rubric-aligned feedback

Teacher can review/edit before release.

### Downstream integration

Assessment reports are **partially upstream**:

- can prefill rubric comments
- can prefill evidence snippets
- can suggest narrative report language
- can support standards/skills mastery interpretation

They do not replace the gradebook or full report authoring flow.

### Gradebook direction

Do not build a completely separate deep dual-gradebook product immediately.

Instead:

- keep `Assessment gradebook` primary
- add a stronger `Standards & skills` view inside class scope
- ensure standards/skills mastery also appears in student profile and reports

### Programme strategy

Use a **shared workflow, programme-flavored** model:

- one common teacher workflow
- programme-specific labels, metadata, and panels where appropriate
- avoid fully separate PYP/MYP/DP teacher products

## Target IA

### Teacher top-level nav

- Dashboard
- Planning
- Classes
- Assessments
- Portfolio
- Reports
- Communication
- Operations
- Student Support

### Teacher spine split

#### Planning

Top-level planning route for:

- yearly plans
- planning insights
- curriculum maps
- cross-class planning visibility
- cross-class create flows for unit/lesson creation

#### Classes

Class hub remains the main place for:

- day-to-day class teaching context
- class-scoped planning
- unit detail authoring
- linked lessons
- linked assessments

#### Assessments

Top-level assessments route remains first-class for:

- standalone assessment creation
- cross-class management
- status filtering
- scheduling and release workflows

## Implementation units and boundaries

The upgrade should be implemented as a set of focused read/write units rather than one large teacher-portal refactor.

### 1. Planning hub module

Owns:

- top-level `Planning` route
- yearly plans views
- planning insights landing and detail views
- curriculum maps read models
- create flow for unit plan and lesson plan

Interface responsibilities:

- reads class-, unit-, and lesson-level summary metadata
- launches into class-scoped planning detail
- does not own deep unit authoring state

### 2. Class planning module

Owns:

- class-scoped yearly plan
- unit detail tabs
- unit flow
- class lesson list/week views
- class planning insights

Interface responsibilities:

- writes unit and lesson planning data
- links assessments into units and lessons
- exposes planning metadata upward to the planning hub

### 3. Typed assessment module

Owns:

- teacher assessment creation/editing
- type-specific configuration for `off_platform`, `quiz`, `chat`, and `essay`
- intent, distribution, and release configuration
- standalone and linked assessment creation paths

Interface responsibilities:

- emits normalized assessment metadata used by class views, student views, gradebook, and reports
- must not require a unit link in order to function

### 4. Student assessment runner module

Owns:

- student completion surfaces for each assessment type
- submission capture
- released assessment-report display

Interface responsibilities:

- consumes typed assessment configuration
- enforces submission-mode rules
- does not own teacher grading or report authoring

### 5. Assessment review and AI-report module

Owns:

- teacher split-pane review experience
- per-student AI assessment report artifact
- class-level assessment insights

Interface responsibilities:

- reads submissions and grading setup
- outputs teacher-editable report artifacts
- exposes structured feedback summaries to gradebook/report consumers

### 6. Mastery aggregation module

Owns:

- class `Standards & skills` view
- student-profile mastery summaries
- report mastery sections

Interface responsibilities:

- aggregates tagged unit, lesson, assessment, and outcome data
- remains read-model driven
- does not become a separate authoring workflow

### 7. Report prefill adapter

Owns:

- pulling gradebook outcomes, standards mastery, evidence, and AI snippets into reports

Interface responsibilities:

- provides suggestions and references only
- never bypasses teacher editing or release review

### 8. Demo seed layer

Owns:

- typed assessment exemplars
- programme-flavored planning examples
- AI assessment report examples
- mastery/report linkage examples

Interface responsibilities:

- make every key route believable on first load
- support the required end-to-end demo scenarios without introducing production complexity

## Planning design

### Top-level Planning route

Recommended tabs:

- `Yearly plans`
- `Planning insights`
- `Curriculum maps`

#### Yearly plans

Purpose:

- cross-class planning overview for teachers
- read/write launchpad into unit and lesson work

Views:

- card view
- timeline view

Each unit card should show:

- unit title
- linked class
- duration
- lesson count
- assessment count
- standards/skills coverage signal
- collaborator avatars
- status

Creation from Planning hub:

- teacher can create `Unit plan` or `Lesson plan`
- class linkage is required as the first step
- lessons may optionally attach to an existing unit
- created items appear both in the planning hub and in the linked class planning view

#### Planning insights

Purpose:

- read-only cross-cutting analytics over planning data

Recommended insight types for MVP:

- standards / skills coverage
- concept / inquiry coverage
- timeline / pacing

UX:

- insight card landing page
- each card opens a read-only matrix/table view
- export/download affordance

#### Curriculum maps

Purpose:

- read-only cross-grade curriculum view

UX:

- grouped table / map view
- left filter/navigation
- no editing

### Class-scoped planning

Inside class hub, planning becomes a stronger working surface.

Recommended subviews:

- `Year plan`
- `Unit detail`
- `Lessons`
- `Insights`

#### Year plan

- class-only yearly planning view
- card / timeline toggle
- unit cards show:
  - status
  - lesson count
  - assessment count
  - key tags
  - collaborators

#### Unit detail

Recommended top tabs:

- `Inquiry & action`
- `Unit flow`
- `Evidence`
- `Reflection`

Recommended supporting structure:

- left outline sidebar with section navigation
- right-side comments/activity area

`Inquiry & action` should include:

- unit basics
- inquiry framing
- concepts / standards / ATL / learner profile tags
- learning focus
- summative intent
- differentiation / resources / community links

`Unit flow` should include:

- lessons and assessments organized in week-grouped containers
- create lesson
- create formative assessment
- create summative assessment

`Evidence` should include:

- linked assessments
- evidence/portfolio signals
- standards/skills touched by evidence

`Reflection` should include:

- structured prompts
- teacher notes
- collaboration comments/history

#### Lessons

Lessons should remain usable independently of units.

Teachers must be able to:

- create standalone lessons
- link lessons into a unit later
- open/edit lessons from class scope without passing through unit detail

#### Insights

- lighter class-scoped planning health/readiness view
- complements the top-level Planning insights route

### Collaborative planning cues

Required visible collaboration surface:

- collaborator avatars on unit cards
- section-level comments
- activity/history snippets
- owner / reviewer labels
- optional `needs review` markers

Not required:

- live editing
- true notifications backend
- synchronous co-authoring

## Assessment design

### Assessment architecture

Each assessment should have:

- class linkage
- optional unit linkage
- optional lesson linkage
- type
- intent
- grading configuration
- distribution state
- release state

### Teacher creation entry points

Teachers can create assessments from:

- top-level `Assessments`
- `Unit flow`
- lesson detail / lesson list

### Assessment types

#### `off_platform`

Baseline Toddle-style task.

Configuration:

- instructions
- attachments/resources
- due date
- grading tool configuration
- optional standards/skills tags

Submission modes:

- default: student digital submission
- optional: `offline_mode`
  - teacher-observed / teacher-recorded
  - no student submission required

#### `quiz`

Configuration:

- question builder
- sections
- answer key logic
- scoring model

#### `chat`

Configuration:

- prompt / scenario
- success criteria
- rubric / standards tags
- expected response style

Student output:

- conversation transcript

#### `essay`

Configuration:

- prompt
- writing guidance
- resource attachments
- rubric / standards tags

Student output:

- long-form written response

### Assessment detail for teachers

Recommended tabs:

- `Overview`
- `Submissions`
- `Insights`
- `Release`

#### Overview

- metadata
- linked class/unit/lesson
- type + intent badges
- grading summary
- distribution summary

#### Submissions

- roster and per-student states
- split-pane review
- selected student work preview/transcript/response
- grading controls
- AI assessment report preview/edit

#### Insights

- class-level strengths
- class-level weaknesses
- common misconceptions
- standards/rubric distribution
- submission and completion trends

#### Release

- unreleased vs released state
- teacher review before release
- student/family visibility controls

## AI assessment report design

### Per-student assessment report

For each reviewed student submission, generate a teacher-reviewable report artifact containing:

- strengths
- weaknesses / misconceptions
- suggestions / next steps
- rubric-aligned feedback
- score/checklist/standards context where relevant

Teacher can:

- review
- edit
- release

### Class-level assessment insights

For each assessment, generate a class-level summary containing:

- common strengths
- common issues
- reteaching suggestions
- standards or rubric trends

### Integration rules

Assessment AI reports should:

- prefill rubric/criterion comment suggestions
- inform standards/skills interpretation
- contribute report evidence snippets
- contribute narrative suggestions

They should not:

- replace grade calculation
- replace the report template model
- bypass teacher review

## Gradebook and mastery design

### Gradebook shape

Class-scoped gradebook should expose:

- `Assessment gradebook`
- `Standards & skills`

#### Assessment gradebook

- remains primary
- can filter/group by:
  - term
  - class
  - unit
  - assessment type
  - assessment intent

Should support:

- criteria/rubric columns
- score/checklist views
- release state visibility

#### Standards & skills

Secondary mastery view sourced from:

- tagged units
- tagged lessons
- tagged assessments
- assessment outcomes
- evidence/portfolio links where relevant

Should show:

- subject standards
- ATL / skills
- learner-profile-like dimensions where the programme flavor requires it

### Other mastery surfaces

Standards/skills mastery should also appear in:

- teacher student profile
- reports

It should not be isolated only in planning or only in reports.

## Report integration design

### Reports as downstream output

Reports should visibly pull from:

- gradebook outcomes
- rubric outcomes
- standards/skills mastery
- linked evidence and portfolio
- AI assessment report snippets

### Prefill behavior

Prefill should support:

- rubric/criterion summaries
- strengths/growth area suggestions
- linked evidence references
- covered units and assessed areas
- narrative comment suggestions

Teacher remains the final editor.

### Teacher report structure

Recommended editing surfaces:

- `Overview`
- `Academic performance`
- `Standards & skills`
- `Evidence & portfolio`
- `Narrative`
- `Preview`

### Assessment-to-report visibility

Teacher should be able to see:

- which assessments feed the report
- which standards/skills those assessments touched
- which AI snippets were reused or suggested

## Student portal changes

The student portal must change in the areas required to support the new assessment model.

### Typed completion experiences

Each assessment type should have a clearly distinct completion surface.

#### `off_platform`

- instructions
- resource attachments
- submit flow if digital-submission mode is enabled
- teacher-only visibility if `offline_mode`

#### `quiz`

- question-answer interface
- progress and submit state

#### `chat`

- conversational interface
- transcript captured as submission

#### `essay`

- long-form editor
- structured prompt and submit state

### Shared shell, distinct work area

All assessment types should still live inside a common student LMS shell, but the work area should be clearly differentiated so the assessment type reads instantly.

### Student assessment detail

Every assessment detail should show:

- type
- intent
- linked class/unit/lesson
- due state
- submission state
- release state

### Student-facing released assessment report

When released, students should see:

- strengths
- weaknesses / misconceptions
- suggestions / next steps
- rubric/criteria feedback
- outcome summary

This should feel like a first-class result surface, not just free-text teacher feedback.

### Progress/profile implications

Student progress surfaces should reflect:

- typed assessment outcomes
- standards/skills mastery changes
- released assessment report context

## State rules and fallback behavior

These rules should hold across the prototype so the demo stays coherent.

### Assessment visibility and release

- teachers can always see draft and unreleased assessment artifacts
- students only see released assessment-report content
- family surfaces should only ever see the subset already allowed by the existing release/visibility contract
- unreleased AI summaries must not leak into student or family views

### Submission-mode behavior

- `off_platform` defaults to student digital submission
- when `offline_mode` is enabled:
  - student sees instructions and due/release context
  - student does not see a submission composer
  - teacher can still record evidence, grading, and feedback

### Planning linkage behavior

- units, lessons, and assessments can be linked, but linkage is not mandatory for creation
- standalone lessons and standalone assessments must still appear in their top-level and class-level lists
- linking an assessment to a unit later should update planning counts and insight projections

### Type fallback behavior

- if a typed assessment is missing specialized configuration, the route should still render a safe generic detail state rather than failing
- student views should always show the assessment type, intent, and current state even when richer type-specific content is sparse

### Demo-state expectations

- every major teacher and student route should open into meaningful seeded content
- each type must have at least one clearly different student-facing example
- AI feedback should read curated and plausible, not random or placeholder-heavy

## Seed-data design

This upgrade requires intentional seed-data expansion.

### Assessment-type coverage

Seed all four top-level types:

- `off_platform`
- `quiz`
- `chat`
- `essay`

### Intent coverage

Seed both:

- formative
- summative

### State coverage

Seed believable examples of:

- draft
- scheduled / live
- submitted
- reviewed
- released
- graded but unreleased
- overdue / missing
- `off_platform` with `offline_mode`

### Planning linkage coverage

Include examples of:

- assessments linked to units
- assessments linked to lessons
- standalone assessments not linked to a unit
- standalone lessons that can later be linked

### Differentiation coverage

Include:

- whole-class assignment
- privately assigned subset
- different outcomes across students

### AI-report realism coverage

Seed assessment reports with:

- distinct strengths by student
- distinct weaknesses by student
- distinct next-step suggestions
- class-level common insight summaries

### Standards/skills coverage

Seed enough metadata that:

- units carry standards/skills tags
- lessons carry standards/skills tags
- assessments carry standards/skills tags
- gradebook mastery views have meaningful content
- reports have mastery content to display

## Recommended exemplar scenarios

Build the demo around a small number of strong end-to-end exemplars.

### 1. MYP science unit

Primary showcase scenario.

Should include:

- unit planning
- linked lessons
- formative + summative assessments
- standards/skills linkage
- AI assessment reports
- report prefill evidence

### 2. DP essay assessment

Should showcase:

- essay creation
- richer rubric-aligned writing feedback
- narrative/report integration

### 3. PYP off-platform example

Should showcase:

- shared workflow with lighter programme flavor
- off-platform task with either digital submission or offline-mode variant

### 4. Chat assessment exemplar

Should showcase:

- conversational student completion
- transcript-based teacher review
- AI feedback summary

### 5. Quiz exemplar

Should showcase:

- structured quiz completion
- result interpretation
- release/report linkage

## Acceptance scenarios

The implementation should be considered demo-ready only when these scenarios read coherently from start to finish.

### Scenario 1: Teacher planning flow

- teacher opens top-level `Planning`
- reviews yearly plans and planning insights
- creates a unit plan linked to a class
- adds or links lessons from the planning flow
- opens the same unit from class scope and sees consistent data

### Scenario 2: Teacher assessment flow

- teacher creates a typed assessment with a selected intent
- links it to a unit or leaves it standalone
- distributes it
- reviews submissions
- edits per-student AI assessment reports
- releases outcomes

### Scenario 3: Student completion flow

- student opens an assigned `quiz`, `chat`, `essay`, or `off_platform` task
- completes or views the correct type-specific work surface
- submits or sees `offline_mode` expectations
- later sees the released assessment report

### Scenario 4: Gradebook and mastery flow

- teacher sees assessment outcomes in the main gradebook
- teacher sees related standards/skills movement in the secondary mastery view
- student profile reflects the updated performance picture

### Scenario 5: Reporting flow

- teacher opens a report
- sees prefill from assessment outcomes, mastery, and AI snippets
- edits the final narrative
- preview reflects the linked source material clearly

## Recommended build slices

### Slice 1: Planning spine

Build:

- top-level `Planning`
- planning hub create flow
- class yearly view upgrade
- focused unit detail tabs
- visible collaboration cues

### Slice 2: Typed assessments

Build:

- new type model
- intent model
- creation entry points
- `off_platform` + `offline_mode`
- quiz/chat/essay setup

### Slice 3: Submission review and AI assessment reports

Build:

- stronger assessment detail
- split-pane submission review
- per-student AI report
- class-level assessment insights

### Slice 4: Gradebook and standards mastery

Build:

- stronger assessment gradebook
- `Standards & skills` subview
- stronger student-profile and report visibility

### Slice 5: Reports integration

Build:

- stronger prefill behavior
- better source visibility from assessments and standards

### Slice 6: Planning insights and curriculum maps

Build:

- planning insight card landing
- 2-3 read-only insight views
- curriculum-map read models

## Risks and guardrails

### Main risks

- overbuilding planning forms beyond demo value
- creating a second parallel assessment product instead of one coherent model
- introducing too many typed student experiences at once without enough seed data
- making standards mastery visible in too many places without a clear source model

### Guardrails

- preserve standalone lesson and assessment creation
- keep student assessment types visually distinct but shell-consistent
- keep collaboration visible, not truly live
- keep AI feedback editable and obviously demo-generated
- prefer a few strong end-to-end seeded exemplars over many shallow scenarios

## Summary

The recommended upgrade path is:

- dual-spine teacher workspace
- top-level planning plus class-scoped planning
- typed assessments with intent preserved separately
- stronger review and AI assessment reporting
- partial downstream integration into gradebook and reports
- student portal updates that make those new assessment types credible
- seed data deliberately designed around a few strong IB exemplars

This is the strongest path to a demo-ready IB LMS that more closely reflects Toddle's feature scope without requiring production-grade backend complexity.
