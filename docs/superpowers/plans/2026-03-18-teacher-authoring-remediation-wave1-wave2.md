# Teacher Authoring Remediation (Wave 1 + Wave 2) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the teacher authoring experience so a teacher can create a unit, add trustworthy lessons, create unit-linked assessments, and see the unit context persist cleanly across Planning and Assessments before moving on to deeper IA improvements.

**Architecture:** Keep the current teacher portal and dedicated unit route, but use Wave 1 to fix context inheritance, route trust, lesson save clarity, and unit-native assessment creation. Treat Wave 2 as a gated follow-on that improves planning purpose, deeper strategy ergonomics, and more guided lesson and assessment pedagogy only after the core authoring spine is stable.

**Tech Stack:** Next.js App Router, React, TypeScript, Zustand, shadcn/ui, Tailwind CSS, Lucide, Playwright, ESLint, `pnpm exec tsc --noEmit`

**Spec:** `docs/superpowers/specs/2026-03-18-teacher-authoring-remediation-wave1-wave2-design.md`

**Execution notes:** Use `@superpowers/test-driven-development` at the start of every implementation task, `@superpowers/systematic-debugging` whenever current behavior differs from the approved spec, and `@superpowers/verification-before-completion` before any completion claim. Execute in the parity worktree at `/Users/tarakbatra/.config/superpowers/worktrees/peach-lms/codex-teacher-student-toddle-parity`, not in the main workspace.

---

## Scope Check

This plan stays coupled around one teacher workflow, so it should remain one plan:

`teacher shell class context -> Planning -> create unit -> dedicated unit route -> lesson authoring -> unit-native assessment creation -> global assessment continuity`

Wave 1 is the implementation priority and stop condition for the current remediation pass. Wave 2 is included as a gated roadmap chunk so the next round of work can continue from the same document without losing the approved direction.

Implementation should proceed in five chunks:

1. Chunk 1: planning-context inheritance and create-unit trust
2. Chunk 2: dedicated unit route and lesson-authoring trust loop
3. Chunk 3: unit-native assessment creation and global assessment continuity
4. Chunk 4: Wave 1 copy cleanup, verification, and success-criteria gate
5. Chunk 5: Wave 2 roadmap tasks, to start only after Wave 1 signoff

Each of Chunks 1-4 must leave the prototype in a working, demo-reviewable state before moving on.

---

## File Structure

| File | Responsibility | New/Modified |
|------|---------------|--------------|
| `src/app/(portal)/planning/page.tsx` | Planning route entry, inherited class context, create-unit launch behavior | Modified |
| `src/components/planning/planning-hub.tsx` | Class-scoped planning lists, filtered summary counts, yearly view actions | Modified |
| `src/components/planning/planning-create-dialog.tsx` | Minimal create-unit flow with strong class inheritance and cancel safety | Modified |
| `src/lib/planning-selectors.ts` | Planning read models for filtered counts, unit summaries, lesson metadata, and route labels | Modified |
| `src/lib/demo-time.ts` | Shared demo clock for planning and assessment create defaults where needed | Modified |
| `src/app/(portal)/planning/units/[unitId]/page.tsx` | Dedicated unit route loader and readable route state | Modified |
| `src/components/planning/unit-route-shell.tsx` | Unit-level tabs and route framing | Modified |
| `src/components/planning/unit-detail-workspace.tsx` | `Strategy` tab content, simplified section navigation, collaboration cues | Modified |
| `src/components/planning/strategy-section-nav.tsx` | Focused internal navigation model for `Strategy` | Create |
| `src/components/planning/unit-content-panel.tsx` | `Lessons / Assessments / Flow` surface inside the unit route | Modified |
| `src/components/planning/unit-assessment-actions.tsx` | `Create assessment` and `Link existing` controls for unit content | Create |
| `src/components/unit-planning/lesson-plan-drawer.tsx` | Lesson create/edit flow, save feedback, objective rendering, corrected helper copy | Modified |
| `src/components/planning/lesson-summary-card.tsx` | Rich lesson summary row/card with counts and status cues | Create |
| `src/lib/unit-planning-utils.ts` | Shared lesson summary/count helpers and create defaults | Modified |
| `src/types/unit-planning.ts` | Lesson metadata and unit-route summary fields if required by the new summaries | Modified |
| `src/app/(portal)/assessments/page.tsx` | Global queue and explicit `link to unit now / leave standalone` creation entry | Modified |
| `src/app/(portal)/assessments/[assessmentId]/page.tsx` | Assessment builder context visibility for class/unit/lesson linkage | Modified |
| `src/components/assessments/assessment-context-fields.tsx` | Shared linkage controls reused by global and unit-native assessment create flows | Create |
| `src/components/assessment-types/off-platform-fields.tsx` | Preserve off-platform context and hard-reset submission options when switching to `offline_mode` | Modified |
| `src/components/shared/assessment-list-item.tsx` | Show linked unit context in list cards/queue rows | Modified |
| `src/components/unit-planning/link-assessment-dialog.tsx` | Secondary reuse path for existing assessments within a unit | Modified |
| `src/components/class-tabs/unit-plans-tab.tsx` | Class planning entry into dedicated unit routes without hidden selection state | Modified |
| `src/components/shell/top-bar.tsx` | Teacher shell class filter source of truth for inherited context | Modified |
| `src/components/shell/breadcrumb-nav.tsx` | Readable breadcrumb labels for unit routes | Modified |
| `src/stores/index.ts` | Create-unit, create-lesson, and assessment linkage state updates without orphan records | Modified |
| `src/stores/types.ts` | Shared action contracts for create and linkage flows | Modified |
| `src/data/seed/unit-planning-seed.ts` | Seeded units, lessons, and linked assessments that support the Wave 1 trust checks | Modified |
| `src/data/seed/index.ts` | Seed reset behavior, create defaults, and unit-linked assessment exemplars | Modified |
| `tests/smoke/teacher-planning-parity.spec.ts` | Planning context, create-unit, dedicated unit route, and lesson trust coverage | Modified |
| `tests/smoke/typed-assessments.spec.ts` | Unit-native assessment creation and global create continuity coverage | Modified |
| `tests/smoke/demo-contracts.spec.ts` | Shared route/seed reset expectations after create-flow changes | Modified |

Use new helper components only when they reduce the size and ambiguity of the current route files. Do not create a large new abstraction layer for Wave 1.

---

## Chunk 1: Planning Context Inheritance And Create-Unit Trust

### Task 1: Lock failing smoke coverage for planning context and create-unit routing

**Files:**
- Modify: `tests/smoke/teacher-planning-parity.spec.ts`
- Modify: `tests/smoke/demo-contracts.spec.ts`

- [ ] **Step 1: Add or strengthen smoke coverage for the approved planning-context contract**

Cover these scenarios:
- teacher selects a class in the shell and Planning inherits it
- Planning summary counts and list content change with class scope
- `Create unit` opens with the active class already selected
- creating a unit lands on `/planning/units/[unitId]`
- canceling the dialog does not create a visible orphan unit

- [ ] **Step 2: Run the targeted planning smoke before implementation**

Run: `pnpm exec playwright test tests/smoke/teacher-planning-parity.spec.ts`

Expected:
- FAIL because planning counts do not fully inherit class scope
- FAIL because create-unit trust behavior is not yet fully enforced

- [ ] **Step 3: Commit the failing planning-context tests**

```bash
git add tests/smoke/teacher-planning-parity.spec.ts tests/smoke/demo-contracts.spec.ts
git commit -m "test: lock planning context inheritance coverage"
```

---

### Task 2: Make Planning inherit the teacher shell context strongly

**Files:**
- Modify: `src/app/(portal)/planning/page.tsx`
- Modify: `src/components/planning/planning-hub.tsx`
- Modify: `src/components/planning/planning-create-dialog.tsx`
- Modify: `src/components/shell/top-bar.tsx`
- Modify: `src/lib/planning-selectors.ts`

- [ ] **Step 1: Trace the current active-class state from the teacher shell into Planning**

Use the existing shell filter as the single source of truth.

Document in code comments only where needed:
- how Planning receives the active class
- how the create dialog gets its default class

- [ ] **Step 2: Update Planning read models so counts and visible lists are class-scoped by default**

The page should not show globally aggregated totals when the shell is scoped to one class.

- [ ] **Step 3: Prefill `Create unit` from that active class context**

If the teacher changes class intentionally in the dialog, preserve that change for the submit action.

- [ ] **Step 4: Keep create-unit cancel behavior side-effect free**

No partial units should be created before confirm.

- [ ] **Step 5: Run the targeted planning smoke again**

Run: `pnpm exec playwright test tests/smoke/teacher-planning-parity.spec.ts`

Expected:
- PASS for inherited class scope and create-dialog defaults
- still FAIL on dedicated-unit-route trust if Task 3 is not complete yet

- [ ] **Step 6: Commit the planning context inheritance changes**

```bash
git add src/app/(portal)/planning/page.tsx src/components/planning/planning-hub.tsx src/components/planning/planning-create-dialog.tsx src/components/shell/top-bar.tsx src/lib/planning-selectors.ts
git commit -m "feat: inherit teacher shell context in planning"
```

---

### Task 3: Make create-unit land in a readable dedicated unit route

**Files:**
- Modify: `src/app/(portal)/planning/units/[unitId]/page.tsx`
- Modify: `src/components/planning/unit-route-shell.tsx`
- Modify: `src/components/shell/breadcrumb-nav.tsx`
- Modify: `src/components/class-tabs/unit-plans-tab.tsx`
- Modify: `src/stores/index.ts`
- Modify: `src/stores/types.ts`

- [ ] **Step 1: Verify the current create-unit store action only writes confirmed units**

If it creates data too early, move record creation to the confirm path.

- [ ] **Step 2: Make create-unit land directly on the dedicated unit route**

Do not rely on class-tab selection state or sticky query params.

- [ ] **Step 3: Replace raw route labels and breadcrumb fallback IDs with readable unit titles**

If a title is missing, use a teacher-readable placeholder like `Untitled unit`, not the raw identifier.

- [ ] **Step 4: Ensure the same unit route is opened from class context**

Class planning clicks should route to the same unit page the Planning hub uses.

- [ ] **Step 5: Run the targeted planning smoke and type-check**

Run:
- `pnpm exec playwright test tests/smoke/teacher-planning-parity.spec.ts`
- `pnpm exec tsc --noEmit --pretty false`

Expected:
- PASS

- [ ] **Step 6: Commit the create-unit route-trust changes**

```bash
git add src/app/(portal)/planning/units/[unitId]/page.tsx src/components/planning/unit-route-shell.tsx src/components/shell/breadcrumb-nav.tsx src/components/class-tabs/unit-plans-tab.tsx src/stores/index.ts src/stores/types.ts
git commit -m "feat: make create unit land in readable unit routes"
```

---

## Chunk 2: Dedicated Unit Route And Lesson-Authoring Trust Loop

### Task 4: Lock failing coverage for lesson save trust

**Files:**
- Modify: `tests/smoke/teacher-planning-parity.spec.ts`

- [ ] **Step 1: Add or tighten coverage for the lesson-authoring trust loop**

Cover:
- teacher creates a lesson from the unit route
- save confirmation is visible
- reopening the lesson shows persisted content
- lesson summary row/card reflects objective/activity metadata
- helper text does not reference a missing `Timetable` tab

- [ ] **Step 2: Run the targeted planning smoke before implementation**

Run: `pnpm exec playwright test tests/smoke/teacher-planning-parity.spec.ts`

Expected:
- FAIL because lesson save and summary behavior are still ambiguous

- [ ] **Step 3: Commit the failing lesson-authoring test updates**

```bash
git add tests/smoke/teacher-planning-parity.spec.ts
git commit -m "test: lock lesson authoring trust coverage"
```

---

### Task 5: Simplify Strategy navigation and remove duplicate flow language

**Files:**
- Modify: `src/components/planning/unit-detail-workspace.tsx`
- Create: `src/components/planning/strategy-section-nav.tsx`
- Modify: `src/components/planning/unit-route-shell.tsx`

- [ ] **Step 1: Map the current nested Strategy navigation layers**

Identify which navigation controls are redundant and which one should remain.

- [ ] **Step 2: Extract a single internal navigation model into `strategy-section-nav.tsx`**

Keep it focused on:
- unit basics
- inquiry and goals
- collaboration cues
- whatever existing sections remain relevant

- [ ] **Step 3: Remove or rename duplicate `Flow` or `Unit flow` labels that compete with `Unit content > Flow`**

Do not leave two different concepts with the same name in the unit route.

- [ ] **Step 4: Improve the new-unit empty-state guidance inside Strategy**

The first next step should be obvious: define the unit, then move to content.

- [ ] **Step 5: Run the targeted planning smoke**

Run: `pnpm exec playwright test tests/smoke/teacher-planning-parity.spec.ts`

Expected:
- PASS on Strategy clarity expectations that are machine-testable
- remaining failures should be limited to lesson-save details if Task 6 is not complete

- [ ] **Step 6: Commit the Strategy simplification**

```bash
git add src/components/planning/unit-detail-workspace.tsx src/components/planning/strategy-section-nav.tsx src/components/planning/unit-route-shell.tsx
git commit -m "feat: simplify unit strategy navigation"
```

---

### Task 6: Make lesson authoring feel saved, visible, and trustworthy

**Files:**
- Modify: `src/components/unit-planning/lesson-plan-drawer.tsx`
- Create: `src/components/planning/lesson-summary-card.tsx`
- Modify: `src/components/planning/unit-content-panel.tsx`
- Modify: `src/lib/unit-planning-utils.ts`
- Modify: `src/types/unit-planning.ts`
- Modify: `src/lib/planning-selectors.ts`

- [ ] **Step 1: Refactor the lesson drawer so saved objectives and activities render as saved content**

The teacher should not have to infer whether the content was stored.

- [ ] **Step 2: Add explicit save-state feedback that remains visible long enough to build trust**

Use clear saved-state cues, not only ephemeral toasts if the current UI relies on them.

- [ ] **Step 3: Correct or remove helper text that references missing destinations**

The `Timetable` reference should be fixed if that tab does not exist.

- [ ] **Step 4: Add a richer lesson summary component for the unit route**

At minimum include:
- title
- status
- objective count
- activity count
- standards count or tags
- assignment state if scheduled

- [ ] **Step 5: Scope standards and goals more intelligently to the current class/programme**

Prefer the most relevant set first. Avoid presenting obviously noisy cross-programme standards in the primary selection path.

- [ ] **Step 6: Run targeted smoke, type-check, and targeted lint**

Run:
- `pnpm exec playwright test tests/smoke/teacher-planning-parity.spec.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm exec eslint src/components/unit-planning/lesson-plan-drawer.tsx src/components/planning/unit-content-panel.tsx src/components/planning/lesson-summary-card.tsx src/lib/unit-planning-utils.ts src/lib/planning-selectors.ts`

Expected:
- PASS

- [ ] **Step 7: Commit the lesson-authoring trust fixes**

```bash
git add src/components/unit-planning/lesson-plan-drawer.tsx src/components/planning/lesson-summary-card.tsx src/components/planning/unit-content-panel.tsx src/lib/unit-planning-utils.ts src/types/unit-planning.ts src/lib/planning-selectors.ts
git commit -m "feat: make lesson authoring trustworthy in unit routes"
```

---

## Chunk 3: Unit-Native Assessment Creation And Global Assessment Continuity

### Task 7: Lock failing coverage for unit-native assessment creation

**Files:**
- Modify: `tests/smoke/typed-assessments.spec.ts`
- Modify: `tests/smoke/demo-contracts.spec.ts`

- [ ] **Step 1: Add or strengthen smoke coverage for assessment continuity**

Cover:
- unit route shows `Create assessment` as the primary assessment action
- creating an assessment inside a unit prelinks class and unit
- the builder visibly shows the unit link
- saving returns the assessment to the unit list
- global create makes `Link to unit now` vs `Leave standalone` explicit

- [ ] **Step 2: Run the targeted typed-assessment smoke before implementation**

Run: `pnpm exec playwright test tests/smoke/typed-assessments.spec.ts`

Expected:
- FAIL because unit-native creation and explicit global linkage choice are not both implemented

- [ ] **Step 3: Commit the failing assessment-continuity tests**

```bash
git add tests/smoke/typed-assessments.spec.ts tests/smoke/demo-contracts.spec.ts
git commit -m "test: lock unit-native assessment continuity coverage"
```

---

### Task 8: Make unit content assessment actions create-first and link-second

**Files:**
- Modify: `src/components/planning/unit-content-panel.tsx`
- Create: `src/components/planning/unit-assessment-actions.tsx`
- Modify: `src/components/unit-planning/link-assessment-dialog.tsx`

- [ ] **Step 1: Extract unit assessment actions into a focused control component**

This component should make the hierarchy explicit:
- primary: `Create assessment`
- secondary: `Link existing`

- [ ] **Step 2: Launch unit-native create with class and unit prefilled**

The current unit context should be the default, not an optional hidden follow-up step.

- [ ] **Step 3: Keep `Link existing` available for intentional reuse**

Do not remove reuse; only demote it from the primary workflow.

- [ ] **Step 4: Ensure saved or linked assessments appear back in the unit list immediately**

Use reactive store updates so the teacher does not need a refresh.

- [ ] **Step 5: Run the targeted typed-assessment smoke**

Run: `pnpm exec playwright test tests/smoke/typed-assessments.spec.ts`

Expected:
- PASS on unit-native create and return-to-unit assertions
- remaining failures, if any, should be limited to global create continuity

- [ ] **Step 6: Commit the unit-content assessment action changes**

```bash
git add src/components/planning/unit-content-panel.tsx src/components/planning/unit-assessment-actions.tsx src/components/unit-planning/link-assessment-dialog.tsx
git commit -m "feat: make unit assessment creation the primary workflow"
```

---

### Task 9: Make assessment creation explicitly unit-linked or standalone

**Files:**
- Modify: `src/app/(portal)/assessments/page.tsx`
- Modify: `src/app/(portal)/assessments/[assessmentId]/page.tsx`
- Create: `src/components/assessments/assessment-context-fields.tsx`
- Modify: `src/components/shared/assessment-list-item.tsx`
- Modify: `src/components/assessment-types/off-platform-fields.tsx`
- Modify: `src/stores/index.ts`
- Modify: `src/stores/types.ts`

- [ ] **Step 1: Extract shared linkage controls into `assessment-context-fields.tsx`**

This component should visibly own:
- class
- unit
- optional lesson
- explicit standalone choice when launched globally

- [ ] **Step 2: Update the global Assessments create flow to force an explicit continuity choice**

The teacher should decide:
- `Link to unit now`
- `Leave standalone`

- [ ] **Step 3: Make the assessment builder show the linked unit clearly above the fold**

The teacher should not need to inspect hidden fields to know what this assessment belongs to.

- [ ] **Step 4: Preserve linkage when reopening the assessment from the unit route or queue**

The teacher should not have to re-select the same unit later.

- [ ] **Step 5: Enforce the approved off-platform behavior**

When switching from digital submission to `offline_mode`, immediately clear and disable text-entry and upload sub-settings.

- [ ] **Step 6: Surface unit context in queue/list cards**

If an assessment belongs to a unit, it should be visible in the relevant teacher-facing list rows or cards.

- [ ] **Step 7: Run smoke, type-check, and targeted lint**

Run:
- `pnpm exec playwright test tests/smoke/typed-assessments.spec.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm exec eslint src/app/(portal)/assessments/page.tsx src/app/(portal)/assessments/[assessmentId]/page.tsx src/components/assessments/assessment-context-fields.tsx src/components/shared/assessment-list-item.tsx src/components/assessment-types/off-platform-fields.tsx`

Expected:
- PASS

- [ ] **Step 8: Commit the assessment continuity fixes**

```bash
git add src/app/(portal)/assessments/page.tsx src/app/(portal)/assessments/[assessmentId]/page.tsx src/components/assessments/assessment-context-fields.tsx src/components/shared/assessment-list-item.tsx src/components/assessment-types/off-platform-fields.tsx src/stores/index.ts src/stores/types.ts
git commit -m "feat: make assessment creation explicitly unit-aware"
```

---

## Chunk 4: Wave 1 Copy Cleanup, Seed Trust, And Final Verification

### Task 10: Remove trust-breaking teacher copy and seed inconsistencies

**Files:**
- Modify: `src/components/unit-planning/lesson-plan-drawer.tsx`
- Modify: `src/app/(portal)/assessments/page.tsx`
- Modify: `src/app/(portal)/assessments/[assessmentId]/page.tsx`
- Modify: `src/app/(portal)/planning/units/[unitId]/page.tsx`
- Modify: `src/components/shell/breadcrumb-nav.tsx`
- Modify: `src/data/seed/unit-planning-seed.ts`
- Modify: `src/data/seed/index.ts`

- [ ] **Step 1: Remove prototype/internal phrasing from teacher-facing create and edit surfaces**

Examples to eliminate:
- implementation notes
- “next slice” language
- generated IDs in breadcrumbs or headers

- [ ] **Step 2: Make seeded unit/lesson/assessment data support the Wave 1 trust checks**

Ensure there are believable:
- unit titles
- lesson objectives and activities
- unit-linked assessments
- class-scoped examples that match the smoke scenarios

- [ ] **Step 3: Run the Wave 1 smoke suite and type-check**

Run:
- `pnpm exec playwright test tests/smoke/teacher-planning-parity.spec.ts tests/smoke/typed-assessments.spec.ts tests/smoke/demo-contracts.spec.ts`
- `pnpm exec tsc --noEmit --pretty false`

Expected:
- PASS

- [ ] **Step 4: Commit the trust and seed cleanup**

```bash
git add src/components/unit-planning/lesson-plan-drawer.tsx src/app/(portal)/assessments/page.tsx src/app/(portal)/assessments/[assessmentId]/page.tsx src/app/(portal)/planning/units/[unitId]/page.tsx src/components/shell/breadcrumb-nav.tsx src/data/seed/unit-planning-seed.ts src/data/seed/index.ts
git commit -m "chore: clean teacher authoring copy and seeds"
```

---

### Task 11: Run the Wave 1 completion gate from the spec

**Files:**
- Review only: changed files from Tasks 1-10
- Test: `tests/smoke/teacher-planning-parity.spec.ts`
- Test: `tests/smoke/typed-assessments.spec.ts`
- Test: `tests/smoke/demo-contracts.spec.ts`

- [ ] **Step 1: Manually walk the approved Wave 1 verification sequence**

Verify in the browser:
1. select a class in the teacher shell
2. enter Planning
3. create a new unit
4. land in the dedicated unit route
5. add a lesson and verify saved persistence on reopen
6. create a unit-linked assessment from inside the unit
7. verify the builder visibly shows the unit link
8. return to the unit and verify the assessment appears there
9. create a second assessment from the global Assessments page and explicitly choose unit-linked vs standalone behavior
10. cancel a new unit create flow and verify no orphaned unit appears

- [ ] **Step 2: Run the full Wave 1 automated verification set**

Run:
- `pnpm exec playwright test tests/smoke/teacher-planning-parity.spec.ts tests/smoke/typed-assessments.spec.ts tests/smoke/demo-contracts.spec.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm exec eslint src/app/(portal)/planning/page.tsx src/components/planning/planning-hub.tsx src/components/planning/planning-create-dialog.tsx src/app/(portal)/planning/units/[unitId]/page.tsx src/components/planning/unit-route-shell.tsx src/components/planning/unit-detail-workspace.tsx src/components/planning/strategy-section-nav.tsx src/components/planning/unit-content-panel.tsx src/components/planning/unit-assessment-actions.tsx src/components/unit-planning/lesson-plan-drawer.tsx src/components/planning/lesson-summary-card.tsx src/app/(portal)/assessments/page.tsx src/app/(portal)/assessments/[assessmentId]/page.tsx src/components/assessments/assessment-context-fields.tsx src/components/shared/assessment-list-item.tsx src/components/unit-planning/link-assessment-dialog.tsx src/components/shell/top-bar.tsx src/components/shell/breadcrumb-nav.tsx src/lib/planning-selectors.ts src/lib/unit-planning-utils.ts src/lib/demo-time.ts src/stores/index.ts src/stores/types.ts`

Expected:
- PASS on all commands

- [ ] **Step 3: Commit the verified Wave 1 remediation**

```bash
git add src tests playwright.config.ts
git commit -m "feat: complete wave 1 teacher authoring remediation"
```

Wave 1 is not done if any one of the spec completion-gate items is still broken, even if tests pass.

---

## Chunk 5: Wave 2 Roadmap (Start Only After Wave 1 Signoff)

### Task 12: Lock failing coverage for planning-purpose improvements

**Files:**
- Modify: `tests/smoke/teacher-planning-parity.spec.ts`

- [ ] **Step 1: Add Wave 2 smoke coverage for planning-purpose distinctions**

Cover:
- Planning Insights and Curriculum Maps answer different questions
- yearly planning communicates pacing and coverage more clearly
- Strategy no longer feels like a meta-workspace

- [ ] **Step 2: Run the targeted planning smoke**

Run: `pnpm exec playwright test tests/smoke/teacher-planning-parity.spec.ts`

Expected:
- FAIL until Wave 2 planning-purpose improvements land

- [ ] **Step 3: Commit the failing Wave 2 planning-purpose coverage**

```bash
git add tests/smoke/teacher-planning-parity.spec.ts
git commit -m "test: lock wave 2 planning purpose coverage"
```

---

### Task 13: Redesign planning-purpose surfaces and deeper Strategy guidance

**Files:**
- Modify: `src/components/planning/planning-hub.tsx`
- Modify: `src/components/planning/planning-insights-panel.tsx`
- Modify: `src/components/planning/curriculum-map-table.tsx`
- Modify: `src/components/planning/planning-timeline-view.tsx`
- Modify: `src/components/planning/unit-detail-workspace.tsx`
- Modify: `src/lib/planning-selectors.ts`

- [ ] **Step 1: Give each top-level planning surface one distinct teacher question to answer**

Keep them differentiated:
- yearly plans = pacing and sequence
- planning insights = seeded read-only diagnostic summaries
- curriculum maps = subject or programme coverage view

- [ ] **Step 2: Improve Strategy progression with more programme-aware prompts**

Do not turn this into a full planner-builder rewrite.

- [ ] **Step 3: Run the targeted planning smoke and type-check**

Run:
- `pnpm exec playwright test tests/smoke/teacher-planning-parity.spec.ts`
- `pnpm exec tsc --noEmit --pretty false`

Expected:
- PASS

- [ ] **Step 4: Commit the planning-purpose and Strategy improvements**

```bash
git add src/components/planning/planning-hub.tsx src/components/planning/planning-insights-panel.tsx src/components/planning/curriculum-map-table.tsx src/components/planning/planning-timeline-view.tsx src/components/planning/unit-detail-workspace.tsx src/lib/planning-selectors.ts
git commit -m "feat: deepen planning purpose and strategy guidance"
```

---

### Task 14: Improve lesson-builder ergonomics and assessment pedagogy

**Files:**
- Modify: `src/components/unit-planning/lesson-plan-drawer.tsx`
- Modify: `src/components/planning/unit-content-panel.tsx`
- Modify: `src/app/(portal)/assessments/[assessmentId]/page.tsx`
- Modify: `src/components/assessments/assessment-context-fields.tsx`
- Modify: `src/components/assessment-types/quiz-fields.tsx`
- Modify: `src/components/assessment-types/chat-fields.tsx`
- Modify: `src/components/assessment-types/essay-fields.tsx`
- Modify: `src/components/assessment-types/off-platform-fields.tsx`

- [ ] **Step 1: Add more guided authoring defaults and better labels to the lesson drawer**

- [ ] **Step 2: Make assessment pedagogy more visible in the builder**

Clarify:
- intent
- unit and lesson relationship
- grading setup
- curricular framing

- [ ] **Step 3: Run targeted smoke, lint, and type-check**

Run:
- `pnpm exec playwright test tests/smoke/teacher-planning-parity.spec.ts tests/smoke/typed-assessments.spec.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm exec eslint src/components/unit-planning/lesson-plan-drawer.tsx src/app/(portal)/assessments/[assessmentId]/page.tsx src/components/assessment-types/quiz-fields.tsx src/components/assessment-types/chat-fields.tsx src/components/assessment-types/essay-fields.tsx src/components/assessment-types/off-platform-fields.tsx`

Expected:
- PASS

- [ ] **Step 4: Commit the Wave 2 builder-guidance improvements**

```bash
git add src/components/unit-planning/lesson-plan-drawer.tsx src/components/planning/unit-content-panel.tsx src/app/(portal)/assessments/[assessmentId]/page.tsx src/components/assessments/assessment-context-fields.tsx src/components/assessment-types/quiz-fields.tsx src/components/assessment-types/chat-fields.tsx src/components/assessment-types/essay-fields.tsx src/components/assessment-types/off-platform-fields.tsx
git commit -m "feat: improve lesson and assessment authoring guidance"
```

---

### Task 15: Strengthen unit-performance coherence only after authoring is stable

**Files:**
- Modify: `src/components/planning/unit-performance-panel.tsx`
- Modify: `src/lib/planning-selectors.ts`
- Modify: `src/lib/mastery-selectors.ts`
- Modify: `tests/smoke/demo-contracts.spec.ts`

- [ ] **Step 1: Improve how authored unit content surfaces inside unit performance**

Performance should feel like the consequence of teaching the unit, not a detached report layer.

- [ ] **Step 2: Add or strengthen smoke coverage for that authored-content linkage**

- [ ] **Step 3: Run targeted smoke and type-check**

Run:
- `pnpm exec playwright test tests/smoke/demo-contracts.spec.ts`
- `pnpm exec tsc --noEmit --pretty false`

Expected:
- PASS

- [ ] **Step 4: Commit the Wave 2 unit-performance coherence changes**

```bash
git add src/components/planning/unit-performance-panel.tsx src/lib/planning-selectors.ts src/lib/mastery-selectors.ts tests/smoke/demo-contracts.spec.ts
git commit -m "feat: strengthen unit performance coherence"
```

---

## Plan Review Notes

Subagent-based plan review is the preferred workflow, but if the harness does not expose subagents, manually review each chunk against:

- the approved spec
- the file structure table above
- whether each step is 2-5 minutes and one action only
- whether every task has an explicit verification command
- whether Wave 1 completion still matches the approved success criteria

If a chunk grows materially beyond the approved scope, stop and spin a new remediation spec instead of quietly broadening this plan.

---

## Execution Handoff

Execute in this order:

1. Chunk 1: planning-context inheritance and create-unit trust
2. Chunk 2: dedicated unit route and lesson-authoring trust loop
3. Chunk 3: unit-native assessment creation and global assessment continuity
4. Chunk 4: Wave 1 copy cleanup, seed trust, and final verification
5. Chunk 5 only after explicit Wave 1 signoff

Do not start Wave 2 while any Wave 1 completion-gate item from the spec is still unresolved.
