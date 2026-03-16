# Assessment UX Redesign

## Context

The current assessment system has accumulated complexity: a creation modal separate from the assessment page, a submission return/resubmit cycle, a "mark as missing" action, bulk grade release, and a grading sheet that separates submission viewing from grading. This redesign simplifies the mental model for both teachers and students by:

- Embedding the assessment builder into the draft page (no modal)
- Removing the return/resubmit path (submit is final)
- Removing "missing" as a stored status (late is derived from due date)
- Replacing bulk release with individual release + a secondary "release all ready" escape hatch
- Introducing a "Ready" status (auto-promoted when grading is complete) to gate safe batch release
- Adding post-release amendment and a Close Assessment lifecycle

---

## Assessment Status Lifecycle (persisted, transitioned)

```
Draft  →(publish)→  Live  →(close)→  Closed
                      ↑                  |
                      └──(revoke excused)─┘
```

### Transition rules

| Trigger | Mutation |
|---------|----------|
| **Publish** | `status = "live"`, `distributedAt = now` |
| **Natural close** — after any row mutation, all rows are Released or Excused and assessment is Live | `status = "closed"`, `closedAt = now`, `forceClosed = false` |
| **Force Close** — teacher clicks Close Assessment before all rows are terminal | Mutate all non-terminal rows to Excused → `status = "closed"`, `closedAt = now`, `forceClosed = true` |
| **Reopen on revoke** — teacher revokes an Excused row on a Closed assessment | `status = "live"`, `closedAt = undefined`, `forceClosed = false` |

---

## Teacher Student-Review Statuses (derived, not stored)

Each student row in the teacher's Students tab has a status computed from persisted fields:

| Status | Condition | Action Button | Grade Column |
|--------|-----------|---------------|--------------|
| **Pending** | No submission, before due date | Options | — |
| **Late** | No submission, after due date | Options | — |
| **Excused** | `grade.submissionStatus === "excused"` | Revoke | — |
| **To Mark** | Submission exists, `gradingStatus === "none"` | Grade | — |
| **In Progress** | Submission exists, `gradingStatus === "in_progress"` | Grade | — |
| **Ready** | Submission exists, `gradingStatus === "ready"` | Grade | Shows grade |
| **Released** | `grade.releasedAt` is set | Amend | Shows grade |

Late indicator: a small secondary "Late" badge appears on To Mark, In Progress, Ready, and Released rows when `submission.isLate === true`. Pre-submission lateness is conveyed by the "Late" status itself.

### Derivation logic

```
getTeacherReviewStatus(grade, submission, assessment):
  if grade.submissionStatus === "excused" → "excused"
  if submission exists:
    if grade.releasedAt → "released"
    if grade.gradingStatus === "ready" → "ready"
    if grade.gradingStatus === "in_progress" → "in_progress"
    → "to_mark"
  if assessment.dueDate < now → "late"
  → "pending"
```

---

## Student-Facing Statuses (derived, not stored)

### Submission status

| Status | Condition | Student CTA |
|--------|-----------|-------------|
| **Due submission** | Live assessment, before due date, no submission | View / Submit |
| **Overdue submission** | Live assessment, after due date, no submission | View / Submit (with late warning) |
| **Excused** | Teacher excused student | View details |
| **Submitted on time** | `submission.status === "submitted"` and `!submission.isLate` | View submission |
| **Submitted late** | `submission.status === "submitted"` and `submission.isLate` | View submission |

### Teacher marking status (relevant post-submission)

| Status | Condition |
|--------|-----------|
| **Not graded** | `grade.releasedAt` is null |
| **Graded** | `grade.releasedAt` is set |

### Report status (relevant post-release)

| Status | Condition |
|--------|-----------|
| **Unseen** | `grade.reportStatus === "unseen"` |
| **Seen** | `grade.reportStatus === "seen"` |

### Derivation logic

```
getStudentSubmissionStatus(grade, submission, assessment):
  if grade.submissionStatus === "excused" → "excused"
  if submission?.status === "submitted":
    → submission.isLate ? "submitted_late" : "submitted_on_time"
  if assessment.dueDate < now → "overdue"
  → "due"
```

---

## Teacher Assessment Page

Same route (`/assessments/[assessmentId]`), mode switch based on `assessment.status`.

### Draft mode — Assessment Builder

Two-column layout:
- **Left column**: title, class, due date, description, student instructions, learning goals, student resources
- **Right column**: grading type selector (score / rubric / standards / myp_criteria / dp_scale / checklist) + contextual builder (rubric criteria editor, checklist builder, score total points, etc.)
- **Header actions**: Save draft, Publish

All fields are editable. Grading type must be selected and configured before publishing (validation gate). Publishing transitions the page to the published view.

### Published mode — Live / Closed Assessment

**Header**: title, class, due date, grading mode, status badge (Live/Closed), unreleased count indicator.

**Header actions**:
- "Release all ready" — secondary dropdown action, only releases rows in Ready status
- "Close Assessment" — if non-terminal rows exist, opens Force Close confirm dialog

**Tabs**: Details, Students, [Grading Type name] (e.g., "Rubric", "Checklist")

- **Details tab**: read-only assessment metadata, learning goals, description, student instructions
- **Students tab**: status filter pills + student table (Student, Status, Grade, Action columns)
- **Grading type tab**: read-only view of the rubric/checklist/criteria

### Action windows

**Options window** (for Pending / Late rows):
- Mark as Excused — confirm dialog: "Excusing this student will permanently clear any existing grade data. This cannot be undone."
- Message Student — opens 1:1 DM modal (uses existing DM channel infrastructure)

**Grade window** (for To Mark / In Progress / Ready rows):
- Student submission (read-only view)
- Mode-specific grader (rubric / checklist / score / standards / myp_criteria / dp_scale)
- Feedback textarea
- **Save** — persists grading progress. Status auto-promotes: if all criteria complete → Ready, else → In Progress
- **Release** — saves + sets `releasedAt`, sends notification to student. Only enabled when grading would be Ready (all criteria complete).

**Amend window** (for Released rows):
- Same layout as Grade window, pre-filled with existing grade data
- **Update** — saves changes, sets `amendedAt = now`, resets `reportStatus = "unseen"` if it was "seen", sends grade_amended notification to student. The row stays Released — amending does NOT revert to Ready. `releasedAt` is preserved.
- **Cancel** — closes without changes

**Revoke** (for Excused rows):
- Confirm dialog: "This will remove the excuse. The student will need to be re-graded from scratch."
- Clears all grade data (same excused-clearing invariant)
- Returns to: To Mark (if submission exists) or Pending/Late (if no submission)
- If assessment was Closed → reopens to Live

---

## Student Assessment Page

Route: `/student/classes/[classId]/assessments/[assessmentId]`

Single page, three panels stacked vertically (no tabs):

### Details panel
- Description, student instructions, learning goals, due date, grading mode
- Always visible regardless of state

### Criteria panel
- Read-only view of the grading criteria (rubric levels, checklist items, MYP descriptors, etc.)
- Always visible regardless of state

### Submission panel (state-dependent)

| State | Panel content |
|-------|---------------|
| Due submission | Upload area, draft save, Submit button |
| Overdue submission | Same + late warning banner: "This submission is overdue. You can still submit but it will be marked as late." |
| Excused | Message: "You are excused from this assessment." No submit CTA. |
| Submitted (not graded) | Locked read-only view of submission. Timestamp. No resubmit. |
| Submitted (graded) | Grade report (mode-specific display) + teacher feedback + collapsed submission view. Report status tracks Unseen → Seen on open. |

---

## Data Model Changes

### Assessment type

The shared `Status` type in `common.ts` is only used by `Assessment`. Rename it to `AssessmentStatus` for clarity and update `assessment.ts` to import the new name.

```typescript
// CHANGED
status: AssessmentStatus                     // "draft" | "live" | "closed" (was Status: "draft" | "published" | "archived")

// ADDED
closedAt?: string                            // set on close, cleared on reopen
forceClosed?: boolean                        // true if closed via Force Close

// REMOVED
gradesReleasedAt?: string                    // no bulk release — per-student only
```

### GradeRecord type

```typescript
// CHANGED
submissionStatus: "none" | "submitted" | "excused"   // removed "missing"

// ADDED
gradingStatus: "none" | "in_progress" | "ready"      // teacher grading progress
amendedAt?: string                                     // set on post-release amendment
reportStatus?: "unseen" | "seen"                       // student report view tracking

// KEPT AS-IS
releasedAt?: string                                    // per-student release gate
```

### Submission type

```typescript
// CHANGED
status: "draft" | "submitted"               // removed "returned" and "resubmitted"

// REMOVED
resubmittedAt?: string

// KEPT AS-IS
isLate: boolean                              // set at submission time; currently optional in type — make required
```

Note: `isLate` is currently typed as `isLate?: boolean` (optional). Make it required (`isLate: boolean`, default `false`). When `undefined`, derivation treats it as `false` (submitted on time), which is correct default behavior.

### Seed data migration

When regenerating seed data with the new model:
- Existing grades with `submissionStatus: "missing"` → remove; lateness is now derived from due date + no submission
- Existing grades with grade data: backfill `gradingStatus` based on `isGradeComplete(grade, assessment)` — if complete → `"ready"`, if partial data exists → `"in_progress"`, otherwise → `"none"`
- Existing grades with `releasedAt` set: add `reportStatus: "seen"` (assume already viewed)
- Existing submissions with `status: "returned"` or `"resubmitted"` → convert to `"submitted"`

### Derived counts

**Unreleased grades** (shown on assessment list items, class CTAs, dashboard):
```
count where: submission exists
  AND grade.releasedAt is null
  AND grade.submissionStatus !== "excused"
```

This is To Mark + In Progress + Ready.

---

## Notifications

| Type | Trigger | Recipient | Link |
|------|---------|-----------|------|
| `grade_released` | Teacher releases grade | Student | Assessment page |
| `grade_amended` | Teacher updates grade post-release | Student | Assessment page |
| `student_excused` | Teacher excuses student | Student | Assessment page |

Existing `grade_released` notification stays as-is. `grade_amended` and `student_excused` are new types.

Report status tracking: `grade_amended` notification also resets `reportStatus` to `"unseen"` if it was `"seen"`.

---

## Excused Invariant

Excusing a student **always wipes all grade data**: score, dpGrade, mypCriteriaScores, rubricScores, standardsMastery, checklistGradeResults, checklistResults, feedback, feedbackAttachments, gradedAt, submittedAt, releasedAt, amendedAt, reportStatus, gradingStatus. Sets `updatedAt = now`.

Confirm dialog warns: "Excusing this student will permanently clear any existing grade data. This cannot be undone."

Revoking an excuse returns to To Mark (if submission) or Pending/Late (if none). Teacher must re-grade from scratch.

---

## What's Removed

| Feature | Reason |
|---------|--------|
| Assessment creation modal | Replaced by draft page builder |
| Submissions tab on published assessment | Submission view merged into Grade window |
| "Mark as Missing" action | Late status is derived from due date + no submission |
| `submissionStatus: "missing"` | Removed from data model |
| Return submission / resubmit path | Submit is final — no resubmit |
| `Submission.status: "returned" / "resubmitted"` | Removed from data model |
| Bulk "Release All" primary button | Replaced by individual release + secondary "Release all ready" |
| `Assessment.gradesReleasedAt` | No class-wide release gate |
| `Assessment.status: "archived"` | Replaced by "closed" |
| Feedback column in student table | Feedback is in Grade/Amend window only |
| Status dropdown in grading sheet | Status is derived from actions, not manually set |
| `createSubmissionReturnedNotification` | Dead code — return/resubmit path removed |
| `submission_returned` notification type | No longer fired |

---

## What's Added

| Feature | Detail |
|---------|--------|
| Draft page = inline assessment builder | Two-column layout, grading type builder on right |
| "Ready" status | Auto-promoted when all grading criteria are complete on save |
| Options window | Excuse + Message Student for Pending/Late rows |
| Amend window | Post-release grade editing with Update action |
| Close Assessment lifecycle | Natural close + Force Close + reopen on revoke |
| Late indicator badge | Secondary chip on teacher rows post-submission |
| "Release all ready" secondary action | Batch releases only Ready rows, tucked in dropdown |
| Unreleased Grades count | To Mark + In Progress + Ready, shown on list items and CTAs |
| Report status (Unseen/Seen) | Tracks whether student has opened their grade report |
| `grade_amended` notification | Fired on amend, resets report to Unseen |
| `student_excused` notification | Fired when teacher excuses student |
| Criteria panel on student page | Always-visible read-only view of grading criteria |

---

## Key Files to Modify

### Types
- `src/types/common.ts` — Rename `Status` → `AssessmentStatus` = `"draft" | "live" | "closed"`
- `src/types/assessment.ts` — Import `AssessmentStatus`; remove `gradesReleasedAt`; add `closedAt`, `forceClosed`
- `src/types/gradebook.ts` — GradeRecord: add `gradingStatus`, `amendedAt`, `reportStatus`; change `SubmissionStatus` to remove `"missing"`
- `src/types/submission.ts` — Change `SubmissionLifecycleStatus` to `"draft" | "submitted"` only; remove `resubmittedAt`; make `isLate` required
- `src/types/notification.ts` — Add `grade_amended`, `student_excused` notification types

### Domain Logic
- `src/lib/grade-save.ts` — Update `buildGradePayload` for new `gradingStatus` auto-promotion; update `buildExcusedPayload` to clear new fields (`feedbackAttachments`, `gradingStatus`, `amendedAt`, `reportStatus`)
- `src/lib/grade-helpers.ts` — Rewrite `getStudentAssessmentStatus` → `getTeacherReviewStatus`; add `isGradingComplete()` per mode; update count helpers; remove `"missing"` references
- `src/lib/student-permissions.ts` — Update `canStudentViewGrade` (remove `gradesReleasedAt` gate, per-student only); update `StudentWorkState` type (remove `"returned"`, `"resubmitted"`, `"missing"`); update `StudentAssessmentStateProjection`; update `isAssessmentOpenForSubmission` to check `status === "live"` instead of `"published"`
- `src/lib/student-selectors.ts` — Update `getStudentAssessments` projections; add `getStudentSubmissionStatus`
- `src/lib/notification-events.ts` — Add `createGradeAmendedNotification`, `createStudentExcusedNotification`; remove `createSubmissionReturnedNotification` (dead code)
- `src/lib/selectors/grade-selectors.ts` — Update analytics: remove `submissionStatus === "missing"` filter from `computeClassAveragePercent`; add unreleased grades count selector

### Store
- `src/stores/index.ts` — Update assessment CRUD for new status transitions (publish, close, force close, reopen); update grade actions for amend flow
- `src/stores/types.ts` — Update AppState/AppActions interfaces

### Teacher Pages
- `src/app/(portal)/assessments/page.tsx` — Remove creation modal; update list items for unreleased count; update status filters (draft/live/closed)
- `src/app/(portal)/assessments/[assessmentId]/page.tsx` — Major rewrite: draft builder mode vs published mode; new Students tab with 4-column table; Close Assessment button; release-all-ready dropdown
- `src/app/(portal)/classes/[classId]/page.tsx` — Update assessments tab for new statuses and unreleased count indicator
- `src/app/(portal)/dashboard/page.tsx` — Update assessment references from `"published"` to `"live"`
- `src/app/(portal)/students/[studentId]/page.tsx` — Remove `"missing"` status references in grade display

### Teacher Components
- `src/components/shared/grading-sheet.tsx` — Rewrite as Grade window: merge submission view + grader; remove status dropdown; add Save/Release actions with Ready validation; support Amend mode with Update action
- `src/components/shared/assessment-list-item.tsx` — Update for new status badges, unreleased count indicator, late badge
- `src/components/shared/status-badge.tsx` — Add Ready, In Progress, Late, To Mark badge variants
- New: Options window component (Excuse + Message Student)
- Remove: Submissions tab component (merged into Grade window)

### Student Pages
- `src/app/student/classes/[classId]/assessments/[assessmentId]/page.tsx` — Rewrite: three-panel layout (Details, Criteria, Submission); state-dependent submission panel; report Unseen→Seen tracking
- `src/app/student/assessments/page.tsx` — Update status filters and card display for new submission statuses
- `src/app/student/home/page.tsx` — Update dashboard assessment cards for new status model

### Student Components
- `src/components/student/submission-workbook.tsx` — Simplify: remove resubmit path, remove "returned" handling; submit locks immediately
- `src/components/student/grade-feedback-viewer.tsx` — Update for inline report display with Unseen/Seen tracking
- `src/components/student/grade-result-sheet.tsx` — Remove (replaced by inline report on assessment page)
- `src/components/student/class-grades-tab.tsx` — Remove `"missing"` status references
- `src/components/student/class-work-tab.tsx` — Update for new student assessment status model
- `src/lib/hooks/use-released-assessment-click.ts` — Update for new per-student release check (remove `gradesReleasedAt`)

### Shared Components (cross-cutting)
- `src/components/student-shell/notification-panel.tsx` — Handle new `grade_amended` and `student_excused` notification types; remove `submission_returned` handling

### Seed Data
- `src/data/seed/index.ts` — Update assessment statuses, grade records with new fields, remove missing submissionStatus
- `src/data/seed/student-seed.ts` — Update submissions (remove returned/resubmitted), add reportStatus examples
- `src/components/shell/store-initializer.tsx` — Bump SEED_VERSION

---

## Verification

1. **Build**: `npm run build` passes with no TypeScript errors
2. **Draft → Publish flow**: Create draft assessment, configure grading type, publish — page transitions to live view with Students tab
3. **Student submission**: Student submits work, submission locks, teacher row shows To Mark
4. **Grading flow**: Teacher opens Grade window, partially grades → In Progress; completes all criteria → Ready (grade appears in table); releases → Released (student notified)
5. **Amend flow**: Teacher opens Amend on Released row, changes grade, clicks Update → student notified, report resets to Unseen
6. **Excuse flow**: Teacher excuses student → confirm dialog → grade data wiped → Excused status; Revoke → returns to correct prior status
7. **Close flow**: All rows Released/Excused → auto-closes; Force Close excuses remaining; Revoke on closed → reopens
8. **Student page**: Check all 6 submission panel states render correctly
9. **Late indicator**: Submit after due date → late badge on teacher row
10. **Unreleased count**: Verify count on assessment list items and class CTAs
11. **Notifications**: Verify grade_amended and student_excused notifications render in student notification panel; verify submission_returned no longer appears
12. **Closed assessment actions**: Verify Amend and Revoke still work on closed assessments; verify revoke reopens to Live
