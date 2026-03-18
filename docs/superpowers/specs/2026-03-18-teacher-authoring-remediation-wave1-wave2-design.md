# Teacher Authoring Remediation — Wave 1 + Wave 2 Design Spec

## Overview

This spec documents the remediation plan for the teacher portal after a hands-on UX audit of the live prototype from the perspective of an IB teacher creating a new unit with lessons and assessments.

The audit confirmed that the current portal is stronger at showing seeded activity than supporting a trustworthy planning and authoring flow. The central continuity problem is:

`planning context -> unit creation -> lesson authoring -> assessment creation -> unit-linked teaching workflow`

The current build breaks that continuity in several places:

- class and unit context do not inherit reliably across create flows
- unit-native assessment creation is missing
- lesson authoring does not feel trustworthy after save
- the dedicated unit route still contains nested and competing navigation patterns
- planning entry surfaces do not behave consistently enough to build teacher trust

This spec addresses that through two waves:

- `Wave 1`: fix the broken teacher authoring spine and trust-critical planning issues
- `Wave 2`: improve deeper planning IA, guidance, and analytical surfaces

## Goal

Make the teacher portal feel like a coherent IB teaching workspace where a teacher can start a new unit, build lessons, create unit-linked assessments, and see that work represented back in the unit without losing context or confidence.

## Product Principles

1. Teachers should feel like they are authoring real school work, not moving records between modules.
2. Class and unit context should be inherited strongly, not repeatedly re-entered.
3. Unit planning should be the natural home for unit-linked lesson and assessment authoring.
4. Save, link, ready, and publish states should always feel trustworthy.
5. Surface depth should support calm teacher work, not create nested navigation overload.

## Current UX Findings Summary

### Core workflow breaks

- Planning class context does not prefill create flows reliably.
- New unit breadcrumbs and route labels can expose raw generated IDs.
- Unit content allows `Link assessment` but not `Create assessment`, forcing a teacher out of the unit workflow.
- Global assessment creation does not clearly reconnect to unit planning.

### Trust issues

- Planning counts and filters do not behave consistently enough when class-scoped.
- Lesson save behavior is ambiguous.
- Objectives and activities do not render with enough saved-state clarity.
- Teacher-facing copy still leaks prototype/internal language.

### IA issues

- The dedicated unit route still has too many nested navigation layers inside `Strategy`.
- `Flow` and `Unit flow` language competes across different surfaces.
- Empty unit states do not guide the teacher through the next real action.

## Scope

### In scope

- Teacher planning-hub trust fixes that directly affect authoring
- Dedicated unit-route remediation
- Lesson authoring trust improvements
- Unit-native assessment creation and unit linkage continuity
- Global assessment creation continuity improvements
- Wave 1 success criteria and verification gates
- Wave 2 roadmap for deeper IA and planning intelligence

### Out of scope

- Full planning-insights and curriculum-maps redesign in Wave 1
- Deep lesson-builder wizard redesign in Wave 1
- Full analytics overhaul
- Real collaborative editing
- Admin-facing redesign work in this pass

## Approved Remediation Structure

### Wave 1

Wave 1 guarantees one trustworthy teacher workflow:

`create unit -> add lessons -> create unit-linked assessments -> see them reflected back in the unit route`

Wave 1 focuses on fixing broken continuity and trust.

### Wave 2

Wave 2 improves deeper planning structure, guidance, and analytical purpose once the authoring spine is stable.

## Wave 1

## 1. Planning Hub Responsibilities

### Intent

Planning should act as a reliable entry point into authoring, not as a separate planning overview that loses the teacher’s working context.

### Required behavior

- When the teacher shell has an active class selected, Planning inherits that class by default.
- Planning counts, visible list content, and create defaults must reflect the active class scope.
- `Create unit` from Planning should preselect the active class.
- If the teacher intentionally changes class in the create flow, that change is respected.
- Planning should never show raw internal unit identifiers in breadcrumbs or visible titles.

### Success criteria

- A teacher with `MYP 5 Sciences` selected sees Planning content scoped to that class by default.
- Planning summary counts change when class scope changes.
- `Create unit` opens with `MYP 5 Sciences` already selected when launched from that scoped state.
- A newly created unit displays a readable title immediately in route-level navigation and breadcrumbs.

## 2. Create Unit Flow

### Intent

`Create unit` should be a lightweight setup step that launches the real unit workspace.

### Required behavior

- `Create unit` remains available from Planning and class context.
- The flow collects only minimal fields:
  - class
  - unit title
  - dates or duration
  - optional programme framing already supported by the model
- After create, the teacher lands directly in the dedicated unit route on `Strategy`.
- The created unit appears immediately in:
  - top-level Planning yearly views
  - class planning lists

### Success criteria

- Creating a unit from Planning lands on `/planning/units/[unitId]`.
- The teacher lands on `Strategy`, not on an indirect class-tab state.
- The new unit can be reopened from Planning and class context without ambiguity.
- Canceling the create flow does not leave behind partial or orphaned unit records.

## 3. Dedicated Unit Route

### Intent

The dedicated unit route remains the unit home, but becomes less confusing and more operational.

### Top-level tabs

- `Strategy`
- `Unit content`
- `Performance`
- `Reflection`

### Wave 1 remediation

The route should keep the same high-level structure, but simplify the `Strategy` experience:

- remove duplicate or competing “flow” concepts
- reduce nested navigation weight
- use teacher-readable section labels
- make the first next-step clearer for new units

### Success criteria

- The route does not show raw generated IDs in teacher-facing breadcrumbs.
- `Strategy` no longer feels like multiple stacked navigation systems.
- A teacher can understand where to define the unit, where to add content, and where to reflect without explanation.

## 4. Strategy Tab

### Intent

`Strategy` should remain the planning-definition surface, but it should not feel like a meta-workspace.

### Required behavior

- Use one clear internal section navigation model only.
- Remove or rename duplicate “flow” terminology that conflicts with `Unit content > Flow`.
- Keep collaboration visible-only inside Strategy sections where relevant.
- Improve the empty-state and setup language for newly created units.

### Success criteria

- A teacher entering a new unit understands what to do first.
- Section labels read like planning sections, not implementation or workspace labels.
- Collaboration cues are visible without becoming a separate navigation burden.

## 5. Unit Content

### Intent

`Unit content` becomes the operational center of the unit in Wave 1.

### Internal tabs

- `Lessons`
- `Assessments`
- optional `Flow`

### Required behavior

- `Lessons` is the primary surface for building unit lessons.
- `Assessments` is the primary surface for creating and linking unit-linked assessments.
- `Flow` can remain secondary, but it must not compete conceptually with Strategy.

### Success criteria

- Teachers can remain inside the unit while authoring its content.
- `Unit content` feels like the working surface for delivery, not an afterthought.

## 6. Lesson Authoring

### Intent

Wave 1 does not need a new lesson-builder concept. It needs a trustworthy lesson authoring loop.

### Required behavior

- Teachers can create a lesson from the unit route.
- Lesson save behavior gives clear confirmation.
- Reopening a saved lesson shows persisted data reliably.
- Lesson summaries in the unit list show enough metadata to prove the lesson is real.
- `Mark as ready` should not overpower the authoring flow before the lesson has real content.
- Objectives should render as saved content, not feel like transient form input.
- Standards and goals should be scoped more intelligently to class/programme context.

### Minimum lesson summary after save

- title
- status
- objective count
- activity count
- standards count or visible tags
- assignment state, if scheduled

### Success criteria

- A teacher can create a lesson, save it, close it, reopen it, and trust the stored content.
- The lesson row/card is materially more informative than `Lesson · draft`.
- Teachers do not need to inspect raw form fields again to know the lesson exists meaningfully.
- Lesson helper text does not reference surfaces that do not exist in the unit route.

## 7. Unit-Native Assessment Creation

### Intent

Inside a unit, the primary teacher action should be to create the assessment for that unit, not go hunting for an external draft.

### Required behavior

Inside `Unit content > Assessments`:

- primary action: `Create assessment`
- secondary action: `Link existing`

`Create assessment` should:

- prefill the current class
- prelink the current unit
- optionally support lesson linkage
- open the builder with those links visible

After save or publish:

- the assessment appears in the unit’s assessment list immediately

### Success criteria

- A teacher can create a new assessment without leaving the unit route.
- The builder clearly shows the linked unit.
- Returning to the unit route shows the new assessment in the unit context.
- Reopening the assessment from the unit route preserves the same unit linkage without re-selection.

## 8. Link Existing Assessment

### Intent

Linking an existing assessment remains useful, but should be secondary to creation in unit context.

### Required behavior

- `Link existing` remains available from `Unit content > Assessments`
- linked items appear immediately in the unit list
- linking should not be the only viable way to populate a new unit

### Success criteria

- Teachers can link an older class assessment when they intentionally want reuse.
- The unit does not feel dependent on backlog-linking to become usable.

## 9. Global Assessments Creation

### Intent

The global Assessments page remains the cross-class work queue, but global creation should support continuity rather than breaking it.

### Required behavior

Teachers can still create from global Assessments, but the create flow and builder must make one choice explicit:

- `Link to unit now`
- `Leave standalone`

If linked:

- unit linkage is visible in the builder and queue

If standalone:

- the assessment remains valid, but that state is clearly intentional

### Success criteria

- Global creation supports both queue-first and planning-first teachers.
- A teacher does not have to infer whether an assessment belongs to a unit.
- The builder makes the linked-vs-standalone choice visible before the teacher finishes setup.

## 10. Unit/Assessment Continuity

### Intent

The relationship between unit and assessment must be visible at every point where a teacher expects it.

### Required behavior

- unit route shows linked assessments
- assessment builder shows linked unit
- assessment queue cards show unit when present
- lesson linkage, if present, is visible in the builder

### Success criteria

- A teacher never has to guess whether the assessment they created belongs to the unit they were working on.

## 11. Teacher-Facing Trust And Copy Cleanup

### Intent

Wave 1 should remove the prototype seams that break teacher trust during authoring.

### Required behavior

- Raw internal IDs are never shown in breadcrumbs, headers, or unit labels.
- Prototype/internal product language is removed from teacher-facing create and edit surfaces.
- Empty states and helper copy describe the real next teacher action.
- Lesson and assessment authoring surfaces do not reference missing tabs or unavailable destinations.

### Success criteria

- A teacher never sees generated identifiers such as `unit_...` in the visible authoring path.
- Teacher-facing UI does not include implementation notes such as “next slice” or similar placeholder language.
- Helper text always points to real routes or controls that exist in the current IA.

## Wave 1 Completion Gate

Wave 1 is only complete when all of the following are true:

1. Planning context inherits correctly from the teacher shell.
2. `Create unit` lands in a readable dedicated unit route.
3. Lesson save/reopen behavior is trustworthy.
4. `Unit content > Assessments` supports unit-native assessment creation.
5. The assessment builder visibly retains unit linkage.
6. New unit-linked assessments appear back in the unit route.
7. Global assessment creation makes unit linkage or standalone state explicit.
8. Raw IDs and prototype/internal copy are removed from the teacher-facing authoring path.
9. Lesson and assessment helper text only references real destinations and controls.

## Wave 2 Roadmap

Wave 2 should begin only after Wave 1 is stable.

## 1. Planning Intelligence And Page Purpose

- make `Planning insights` and `Curriculum maps` more distinct and useful
- improve yearly planning communication of pacing and coverage
- ensure each planning surface answers a clear teacher question

## 2. Deeper Strategy Improvement

- better programme-aware prompts
- clearer progression through unit setup
- less visual and conceptual nesting

## 3. Better Lesson Builder Ergonomics

- more guided authoring
- smarter defaults
- clearer objective, activity, and resource modeling

## 4. Better Assessment Pedagogy

- richer typed assessment authoring
- clearer relationship among unit, lesson, intent, and grading setup
- stronger curricular framing inside the builder

## 5. Stronger Unit Performance Coherence

- improve how authored unit content relates to downstream performance interpretation
- make unit performance feel like a natural consequence of planning, not just a reporting view

## Wave 2 Success Outcomes

Wave 2 should be considered successful when:

- Planning surfaces have clearly differentiated purpose.
- Strategy feels materially lighter and more teacher-readable.
- Lesson and assessment authoring feel more guided and programme-aware.
- Unit performance feels like a natural consequence of unit teaching, not a separate report layer.

## Verification Guidance

Before implementation stops, the team should validate the Wave 1 spine manually and through smoke coverage using this sequence:

1. select a class in the teacher shell
2. enter Planning
3. create a new unit
4. land in the dedicated unit route
5. add a lesson and verify saved persistence on reopen
6. create a unit-linked assessment from inside the unit
7. verify the builder visibly shows the unit link
8. return to the unit and verify the assessment appears there
9. create a second assessment from the global Assessments page and explicitly choose unit-linked vs standalone behavior
10. cancel a new unit create flow and verify that no orphaned unit appears in Planning or class views

If any of those steps break continuity or teacher trust, Wave 1 is not complete.
