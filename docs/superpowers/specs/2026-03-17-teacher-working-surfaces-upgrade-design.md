# Teacher Working Surfaces Upgrade — Design Spec

## Overview

Refine the teacher portal so its core working surfaces feel materially closer to Toddle while staying native to Peach and preserving the prototype-safe architecture already in place.

This spec focuses on the next teacher-portal upgrade wave:

- replacing the weak review/release flow with a real student-by-student marking workspace
- adding a dedicated unit-plan route that becomes the true unit-centered working surface
- making unit performance a meaningful teacher workflow
- refreshing seed data so the upgraded surfaces are demo-credible
- applying a broader teacher visual-depth pass

This spec also includes the required downstream changes for dependent portals and release/visibility contracts.

## Goal

Make the teacher portal feel like a coherent IB LMS working environment, not a collection of adjacent pages:

- teachers can plan at the unit level with clearer structure
- teachers can review and release assessment outcomes through a stronger workflow
- unit performance is understandable at class and student level
- released outcomes propagate correctly to downstream portals
- the teacher portal looks visually mature and consistent across its major pages

## Scope

### In scope

- Teacher assessment review and release redesign
- Dedicated unit-plan route and route-level IA changes
- Unit content and unit performance surfaces
- Unit reflection surface
- Seed-data refresh for deep exemplar flows
- Teacher visual refresh across major surfaces
- Dependent student/family visibility changes required by the new release and unit-performance flows

### Out of scope

- Full production-grade analytics logic
- Live collaborative editing
- Real multi-user notifications or comment backend
- Real AI generation backend
- Admin portal rebuild for this wave
- Full redesign of the separate student portal IA

## Product principles

1. Teacher workflows should feel like real working surfaces, not mock dashboards.
2. Planning and assessment stay equally important.
3. The new surfaces should extend the existing prototype, not replace its core contracts.
4. Strong demo fidelity matters more than backend realism.
5. Route structure should reduce ambiguity, not create more hidden state.

## Approved decisions

### Assessment review flow

- `Submissions` remains the main queue surface inside assessment detail.
- The dedicated `Release` page is removed as a primary concept.
- Clicking a student row opens a dedicated student marking workspace.
- The table keeps a preview drawer for quick memory refresh.
- Bulk release remains on the submissions table.
- Individual review, grading adjustment, AI feedback customization, and per-student release happen in the dedicated marking workspace.

### Marking workspace layout

- Left pane: student submission / response / transcript / artifact
- Right pane: one integrated grading + assessment-report customization panel
- Key actions are fixed at the top of the right pane
- Next / previous student navigation is part of the workspace

### Dedicated unit route

- Unit plans get a real dedicated route shared by Planning and Classes
- Example shape: `/planning/units/[unitId]`
- Top-level Planning year-plan clicks open this route
- Class planning unit clicks also open this route

### Unit route top-level tabs

- `Strategy`
- `Unit content`
- `Performance`
- `Reflection`

### Unit content structure

`Unit content` contains internal sub-tabs:

- `Lessons`
- `Assessments`
- optional `Flow`

### Unit performance structure

`Performance` contains internal sub-tabs:

- `Overview`
- `Student matrix`
- `Gradebook`
- `Standards & skills`

### Students inside unit performance

The previous separate `Students` concept is absorbed into `Performance`.

Main surface:

- class matrix of student × unit outcomes

Interaction:

- teacher clicks a specific student name within the unit performance matrix
- drills to a teacher student profile view already filtered to that specific unit

### Reflection

Reflection remains a top-level unit tab.

Purpose:

- teacher observations
- planning notes
- student portfolio items
- contributions from collaborating teachers

### Collaboration

Collaboration is important to show during unit creation and editing, but it does not require a dedicated top-level tab in the unit route.

### Seed strategy

Optimize for a few deep exemplar flows, not broad shallow realism.

### Off-platform mode rule

Switching an `off_platform` assessment from digital submission to `offline_mode` should immediately hard-reset and clear submission-specific options such as text entry and upload.

### Visual treatment

Apply a portal-wide teacher visual refresh:

- light grey page canvas
- white cards and working surfaces
- Peach shell and interaction language preserved

## IA changes

## 1. Assessments

### Current issue

The current assessment detail splits review and release across too many surfaces, making the workflow feel artificial.

### Target state

Assessment detail becomes:

- `Overview`
- `Submissions`
- `Insights`

The dedicated review action shifts from “release page” patterns to a real marking route.

### Submissions page responsibilities

- class roster and review status table
- quick preview drawer
- bulk release controls
- filters for review state
- open marking workspace per student

### Preview drawer responsibilities

- fast read-only reminder
- current submission snapshot
- recent status / timestamp / key notes
- not the main grading surface

## 2. Dedicated student marking workspace

### Route role

This is the primary teacher review workspace for one student on one assessment.

### Layout

#### Left pane

- submission content
- transcript / artifact preview
- assessment-type-specific rendering
- student context and submission metadata

#### Right pane

Single integrated panel with:

- fixed action rail/header
  - save/update grading
  - mark ready
  - release
  - next student
  - previous student
- grading controls
- AI assessment report editing
- rubric-aligned feedback
- strengths / weaknesses / suggestions
- source attribution

### Behaviors

- teachers can move student by student without returning to the queue
- per-student release is available here
- bulk release remains on the submissions table

## 3. Dedicated unit-plan route

### Current issue

Unit planning is spread across Planning Hub, class planning tabs, and selection state that is too easy to misread.

### Target state

The dedicated unit route becomes the main unit-centered working surface.

It should feel large enough to justify its own route and stable enough that both Planning and Classes can launch into it without ambiguity.

## 4. Unit route tabs

### Strategy

Purpose:

- unit framing
- inquiry structure
- concepts / ATL / objectives / standards
- collaboration visibility
- planning narrative

Collaboration should appear here through:

- collaborator avatars
- section comments
- change/history cues
- owner/reviewer markers

### Unit content

#### Lessons

- unit-linked lesson list
- create/edit lesson
- lesson metadata and readiness
- clear relationship back to unit strategy

#### Assessments

- unit-linked assessment list
- create linked assessment
- show type and intent clearly
- show release and review state

#### Flow

Optional.

If implemented, it should show the ordered flow of lessons and assessments inside the unit. If it adds noise or risk, it can remain secondary.

### Performance

#### Overview

- overall class insights for the unit
- completion / release / readiness summary
- average performance signals
- standards/skills signals

#### Student matrix

- primary surface for scanning students across the unit
- rows: students
- columns: key unit outcomes / assessments / summary indicators
- clicking a student drills to the teacher student profile filtered to the unit

#### Gradebook

- dedicated unit gradebook
- only assessments linked to the unit
- unit-scoped aggregate story

#### Standards & skills

- unit-scoped standards and skill tracking
- evidence that those standards are touched through planning + assessment + outcomes

### Reflection

- teacher notes
- unit-level observations
- portfolio-worthy moments
- teacher team contributions over time

This should feel like a place where teachers capture what happened, not just another planning form.

## Data and seed requirements

## 1. Deep exemplar flows

Seed around a few high-quality teacher stories:

- one strong MYP unit
- one strong DP unit
- one lighter but real PYP unit

These should be sufficient to power:

- unit planning
- linked lessons
- linked assessments
- marking workflow
- AI-style assessment report editing
- unit performance
- report contribution

## 2. Assessment types

Across the seeded exemplars, include:

- `off_platform` with digital submission
- `off_platform` with `offline_mode`
- `quiz`
- `chat`
- `essay`

## 3. Assessment report data

Seed both:

- class-level assessment insight summaries
- per-student assessment reports

Per-student reports should vary credibly by student:

- strengths
- misconceptions
- suggestions
- rubric feedback

## 4. Unit performance data

Seed:

- student × unit matrix states
- unit-gradebook signals
- unit-level standards/skills signals
- filtered student profile relevance to that unit

## 5. Reflection and collaboration data

Seed visible collaboration and reflection content:

- collaborator lists
- section comments
- teacher notes
- portfolio-worthy observation snippets

## Dependent portal changes

## 1. Teacher portal dependent surfaces

The teacher student profile already supports unit filtering and should be reused as the drill-in target from unit performance.

No duplicate teacher-side student detail surface should be created for this wave.

## 2. Student portal

Student portal changes should include:

- released assessment report visibility for the new marking workflow
- clear unit-linked academic context where released outcomes belong to a unit story
- no teacher-style performance surfaces

The student-facing goal is continuity of released outcomes, not a unit-performance rebuild.

## 3. Family portal

Family portal changes should include only:

- released and family-safe downstream visibility
- unit-linked academic context where appropriate
- no leakage of teacher-only planning or performance surfaces

## Release and visibility rules

The updated spec must preserve these contracts:

1. Unreleased grades and assessment reports remain hidden downstream.
2. Student assessment report visibility depends on teacher release.
3. Family visibility remains family-safe and only reflects intentionally released information.
4. Unit performance views remain teacher-only.

## Acceptance scenarios

The implementation should support these end-to-end demo moments:

1. Teacher opens an assessment, uses the Submissions table, previews a student quickly, then opens the dedicated marking workspace.
2. Teacher grades and customizes AI feedback in the marking workspace, then releases the outcome for that student.
3. Teacher uses bulk release from the submissions table for students already ready for release.
4. Teacher opens a unit from top-level Planning and lands in the dedicated unit route.
5. Teacher opens the same unit from class context and lands in the same dedicated unit route.
6. Teacher uses `Unit content` to review unit-linked lessons and assessments.
7. Teacher opens `Performance`, scans the student matrix, and clicks a specific student name within the unit performance matrix to drill into the teacher student profile filtered to that unit.
8. Teacher uses `Reflection` to review or add unit observations and portfolio-worthy items.
9. Student sees the released assessment report only after teacher release.
10. Family sees only the allowed downstream academic visibility.

## Detailed success criteria

Implementation is not complete until each feature below satisfies its success criteria. These are the feature-level verification gates for the build, not optional quality notes.

## 1. Assessment Submissions queue

Build is successful when:

- the assessment detail route no longer depends on a separate release page to complete teacher review
- the `Submissions` tab is the obvious primary queue for review and release work
- each student row has a clear primary action that opens the dedicated marking workspace
- each student row still offers a quick preview action that does not replace the full marking flow
- bulk release remains available from the queue and only targets eligible students
- the queue state updates immediately after marking or release actions without requiring a refresh

## 2. Submission preview drawer

Build is successful when:

- the preview drawer opens from the submissions table without navigating away
- it is clearly read-only and positioned as a quick memory refresh, not the main grading tool
- it shows enough context to decide whether the teacher wants to open the full marking workspace
- closing the drawer returns the teacher to the same queue state and filters they were using

## 3. Dedicated student marking workspace

Build is successful when:

- clicking the primary row action from the submissions queue opens a dedicated student-specific marking route or equivalent full workspace
- the left side renders the student response correctly for all seeded assessment types in scope
- the right side contains one integrated review panel rather than fragmented grading/report/release surfaces
- key actions stay fixed at the top and remain visible while the teacher scrolls the grading/report content
- the teacher can save grading edits, mark ready, and release from this workspace
- the teacher can move to next and previous students without returning to the queue
- when the teacher exits back to the queue, table filters and context are preserved

## 4. Assessment report customization inside marking

Build is successful when:

- the teacher can edit strengths, weaknesses or misconceptions, suggestions, and rubric-aligned feedback in the same workspace used for grading
- the assessment report is visibly tied to the student submission being reviewed
- per-student release from the marking workspace makes that released report visible downstream
- if the teacher has not released the outcome, the report remains teacher-only
- report source attribution is visible enough that the generated content does not feel detached from the assessment evidence

## 5. Bulk release behavior

Build is successful when:

- bulk release is initiated from the submissions queue, not from a dedicated release page
- students who are not ready are not accidentally released
- bulk release updates both outcome visibility and downstream report visibility correctly
- previewing a student from the queue remains possible before bulk release

## 6. Dedicated unit-plan route

Build is successful when:

- clicking a unit from top-level Planning opens the dedicated unit route
- clicking the same unit from class context opens the same dedicated unit route
- the unit route feels like the stable home for unit work rather than a thin wrapper around class tabs
- route entry does not depend on hidden selection state from another page
- the header context makes it obvious which class and unit the teacher is currently in

## 7. Strategy tab

Build is successful when:

- the strategy surface clearly presents the unit framing and planning structure
- standards, concepts, ATL, objectives, and planning narrative are visible in a coherent layout
- collaboration is visible here through non-primary but believable surfaces like avatars, comments, history, or ownership markers
- the strategy surface feels like the authoritative planning view for the unit rather than a summary card expanded into a page

## 8. Unit content: Lessons

Build is successful when:

- the `Lessons` sub-tab shows only lessons linked to the current unit
- teachers can create or open lessons from this tab without losing unit context
- lessons display enough metadata to understand readiness and their role in the unit
- lesson creation/editing does not trap the user in an uncloseable drawer or ambiguous route state

## 9. Unit content: Assessments

Build is successful when:

- the `Assessments` sub-tab shows only assessments linked to the current unit
- assessment type and intent are visible in the list without opening each item
- teachers can create a new unit-linked assessment from this surface
- linked assessment states such as draft, review-ready, and released are legible at a glance

## 10. Unit content: Flow

If implemented, build is successful when:

- `Flow` clearly communicates sequence across lessons and assessments
- it adds ordering value beyond what the lessons and assessments lists already provide
- it does not become the only understandable way to navigate unit content

If `Flow` remains out of scope for this wave, success means it is omitted cleanly rather than included as a weak placeholder.

## 11. Unit performance: Overview

Build is successful when:

- the overview gives the teacher a usable summary of class performance in the unit
- completion, release, grading, and standards signals are understandable without reading every underlying record
- the overview feels unit-specific rather than like a copy of class-wide analytics with a unit title added

## 12. Unit performance: Student matrix

Build is successful when:

- the main student-performance surface is a class matrix of student × unit outcomes
- the matrix supports real scanning across students rather than showing only one selected student at a time
- clicking a specific student name opens the existing teacher student profile already filtered to the current unit
- the drill-in target preserves the unit context clearly enough that the teacher understands why they are seeing filtered information

## 13. Unit performance: Gradebook

Build is successful when:

- the unit gradebook only reflects assessments linked to the current unit
- it provides a clearer unit-level academic story than the broader class gradebook
- the teacher can understand which assessments are contributing to the displayed outcomes
- the gradebook updates coherently when linked assessment states change

## 14. Unit performance: Standards & skills

Build is successful when:

- standards and skills shown in the unit are traceable back to planning, linked assessments, or released outcomes
- the surface communicates mastery or coverage in a way that is distinct from the raw gradebook
- it does not duplicate the same exact table or copy as another planning/performance view

## 15. Reflection

Build is successful when:

- reflection is a meaningful top-level tab, not an empty note field
- teachers can see and add observations, planning notes, and portfolio-worthy items
- contributions from collaborating teachers are visible enough to demonstrate shared teaching practice
- the tab supports the sense of “what happened in this unit” rather than repeating strategy content

## 16. Planning Hub to unit-route coherence

Build is successful when:

- the planning hub remains useful for yearly scanning and route entry
- clicking a unit from planning feels like entering the proper unit workspace, not changing hidden selection inside another page
- planning entry points do not produce stale query-state bugs or sticky drawers

## 17. Seed data: exemplar units

Build is successful when:

- the seed includes one strong MYP unit, one strong DP unit, and one lighter but still credible PYP unit
- each exemplar is deep enough to power planning, linked content, performance, and release flows
- the demo does not rely on generic placeholder records that make all units feel interchangeable

## 18. Seed data: assessment types and reports

Build is successful when:

- seeded data includes meaningful examples of `off_platform`, `off_platform` with `offline_mode`, `quiz`, `chat`, and `essay`
- class-level assessment insight summaries exist for the upgraded review surfaces
- per-student assessment reports are varied enough to feel curated rather than cloned
- release states across seeded students create believable review and bulk-release scenarios

## 19. Off-platform mode reset behavior

Build is successful when:

- switching an `off_platform` assessment into `offline_mode` immediately clears and disables text-entry and upload-specific settings
- the UI does not leave behind misleading checked states for options that no longer apply
- switching modes does not create contradictory submission settings in saved demo state

## 20. Student portal downstream behavior

Build is successful when:

- students only see the released assessment report after teacher release
- unreleased grading and unreleased report content do not leak into student-facing views
- released assessment reports still feel clearly tied to the assessment and, where relevant, the unit context

## 21. Family portal downstream behavior

Build is successful when:

- families only see intentionally released and family-safe downstream information
- no teacher-only planning, grading controls, or unit-performance surfaces leak into the family experience
- family-facing visibility feels like a child learning update, not a copy of the teacher workspace

## 22. Teacher visual refresh

Build is successful when:

- major teacher surfaces use a soft grey page canvas with white working cards or panels on top
- the refresh is broad enough that the teacher portal feels consistently more mature, not like one redesigned page inside an older shell
- the visual treatment stays native to Peach and does not drift into a different design language

## 23. Completion gate

This update wave is only considered complete when:

- all required success criteria above are satisfied
- smoke coverage is updated for the critical route-entry, review, release, and downstream visibility flows
- manual review confirms that the new unit route, marking workspace, and downstream release behavior are understandable without explanation
- no replaced surface leaves behind a broken or redundant primary path, especially around release and unit planning

## Recommended workstreams

1. Assessment review redesign
2. Dedicated unit route
3. Unit performance and teacher student-profile drill-ins
4. Seed-data deepening
5. Teacher visual refresh

Seed work should begin in parallel with workstreams 1 and 2 so the new surfaces are believable as soon as they land.

## Non-goals

This wave should not attempt:

- true analytics logic beyond seeded demo credibility
- a full new student-portal unit-performance product
- admin expansion driven by this work
- a real collaboration backend
- a full-platform visual redesign outside the teacher portal
