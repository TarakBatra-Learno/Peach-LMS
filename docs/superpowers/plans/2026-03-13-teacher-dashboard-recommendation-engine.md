# Teacher Dashboard Recommendation Engine — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the teacher portal dashboard around a recommendation engine with a Command Center layout — prioritized action list as hero, interactive timetable sidebar, compact reference panels.

**Architecture:** Pure function engine (`recommendation-engine.ts`) derives recommendations from existing Zustand store state + current time. No store changes. New UI components under `src/components/dashboard/`. Dashboard page (`src/app/(portal)/dashboard/page.tsx`) is fully rewritten.

**Tech Stack:** Next.js App Router, React, Zustand, shadcn/ui, Tailwind CSS, Lucide icons, date-fns

**Spec:** `docs/superpowers/specs/2026-03-13-teacher-dashboard-recommendation-engine-design.md`

---

## File Structure

| File | Responsibility | New/Modified |
|------|---------------|--------------|
| `src/lib/timetable-utils.ts` | Shared `deriveTimeRows()`, `timeToMinutes()`, `TimeRow` interface | New (extracted) |
| `src/components/student/student-timetable-view.tsx` | Import from shared module instead of local functions | Modified (minor) |
| `src/lib/recommendation-engine.ts` | Pure recommendation generators, scoring, sorting, filtering | New |
| `src/components/dashboard/recommendation-item.tsx` | Single recommendation card component | New |
| `src/components/dashboard/recommendation-list.tsx` | "Right Now" + "To Do" sections container | New |
| `src/components/dashboard/stat-cards.tsx` | 4 stat counter cards row | New |
| `src/components/dashboard/dashboard-sidebar.tsx` | Timetable rail + reference mini-panels | New |
| `src/app/(portal)/dashboard/page.tsx` | Full rewrite — Command Center layout orchestrator | Modified (rewrite) |

---

## Chunk 1: Shared Utility Extraction + Recommendation Engine

### Task 1: Extract timetable utilities to shared module

**Files:**
- Create: `src/lib/timetable-utils.ts`
- Modify: `src/components/student/student-timetable-view.tsx`

- [ ] **Step 1: Create `src/lib/timetable-utils.ts` with extracted functions**

```typescript
// src/lib/timetable-utils.ts

/** Represents one row in a timetable grid */
export interface TimeRow {
  startTime: string;
  endTime: string;
  label: string;
  type: "class" | "break" | "lunch";
}

/** Convert "HH:MM" to minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Derive all time rows for a school day from class schedules.
 * Sorts by start time and fills gaps with break/lunch rows.
 */
export function deriveTimeRows(
  classes: { schedule: { startTime: string; endTime: string }[] }[]
): TimeRow[] {
  const slotMap = new Map<string, { startTime: string; endTime: string }>();
  for (const cls of classes) {
    for (const slot of cls.schedule) {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, { startTime: slot.startTime, endTime: slot.endTime });
      }
    }
  }

  const uniqueSlots = [...slotMap.values()].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  if (uniqueSlots.length === 0) return [];

  const rows: TimeRow[] = [];
  let periodNum = 1;

  for (let i = 0; i < uniqueSlots.length; i++) {
    const slot = uniqueSlots[i];

    if (i > 0) {
      const prevEnd = uniqueSlots[i - 1].endTime;
      if (prevEnd < slot.startTime) {
        const gapMinutes = timeToMinutes(slot.startTime) - timeToMinutes(prevEnd);
        const isLunch = gapMinutes >= 30 && timeToMinutes(prevEnd) >= timeToMinutes("11:00");
        rows.push({
          startTime: prevEnd,
          endTime: slot.startTime,
          label: isLunch ? "Lunch" : "Break",
          type: isLunch ? "lunch" : "break",
        });
      }
    }

    rows.push({
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: `Period ${periodNum}`,
      type: "class",
    });
    periodNum++;
  }

  return rows;
}
```

- [ ] **Step 2: Update `student-timetable-view.tsx` to import from shared module**

In `src/components/student/student-timetable-view.tsx`:
- Remove the local `TimeRow` interface (lines 39–44)
- Remove the local `deriveTimeRows()` function (lines 50–100)
- Remove the local `timeToMinutes()` function (lines 102–105)
- Add import: `import { deriveTimeRows, timeToMinutes, type TimeRow } from "@/lib/timetable-utils";`

- [ ] **Step 3: Build to verify no regressions**

Run: `cd "/Users/tarakbatra/Desktop/Peach LMS" && npm run build`
Expected: Clean build with no errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/timetable-utils.ts src/components/student/student-timetable-view.tsx
git commit -m "refactor: extract deriveTimeRows to shared timetable-utils module"
```

---

### Task 2: Build the recommendation engine — types, scoring, and filtering

**Files:**
- Create: `src/lib/recommendation-engine.ts`

- [ ] **Step 1: Create engine file with types, scoring, and filter infrastructure**

```typescript
// src/lib/recommendation-engine.ts

import type { Assessment } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";
import type { Class } from "@/types/class";
import type { Student } from "@/types/student";
import type { PortfolioArtifact } from "@/types/portfolio";
import type { Incident } from "@/types/incident";
import type { ReportCycle, Report } from "@/types/report";
import type { LearningGoal } from "@/types/assessment";
import type { AttendanceSession } from "@/types/attendance";
import type { LessonSlotAssignment, LessonPlan } from "@/types/unit-planning";
import { getToMarkCount } from "@/lib/grade-helpers";
import { computeAttentionStudents } from "@/lib/selectors/grade-selectors";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { deriveTimeRows, timeToMinutes } from "@/lib/timetable-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecommendationCategory =
  | "marking"
  | "reports"
  | "attention"
  | "release"
  | "portfolio"
  | "incidents";

export type RecommendationUrgency = "overdue" | "today" | "soon" | "normal";

export interface Recommendation {
  id: string;
  section: "now" | "todo";
  category: RecommendationCategory;
  title: string;
  subtitle: string;
  urgency: RecommendationUrgency;
  deadline?: string;
  deadlineDate?: Date; // for sorting — not displayed
  count?: number;
  href: string;
  classId: string;
  className: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_WEIGHTS: Record<RecommendationCategory, number> = {
  marking: 6,
  reports: 5,
  attention: 4,
  release: 3,
  portfolio: 2,
  incidents: 1,
};

const URGENCY_MULTIPLIERS: Record<RecommendationUrgency, number> = {
  overdue: 4,
  today: 3,
  soon: 2,
  normal: 1,
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeScore(rec: Recommendation): number {
  return URGENCY_MULTIPLIERS[rec.urgency] * CATEGORY_WEIGHTS[rec.category];
}

function scoreAndSort(recs: Recommendation[]): Recommendation[] {
  return recs.sort((a, b) => {
    const scoreA = computeScore(a);
    const scoreB = computeScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Tie-break: deadline proximity (sooner first)
    if (a.deadlineDate && b.deadlineDate) {
      return a.deadlineDate.getTime() - b.deadlineDate.getTime();
    }
    // Items with deadlines sort before those without
    if (a.deadlineDate && !b.deadlineDate) return -1;
    if (!a.deadlineDate && b.deadlineDate) return 1;
    return 0;
  });
}

function filterByClass(
  recs: Recommendation[],
  classFilter: string | null
): Recommendation[] {
  if (!classFilter) return recs;
  return recs.filter((r) => r.classId === classFilter);
}

// ─── Urgency Helpers ──────────────────────────────────────────────────────────

function computeDeadlineUrgency(
  deadlineStr: string,
  now: Date
): { urgency: RecommendationUrgency; label: string; date: Date } {
  const deadline = new Date(deadlineStr);
  const daysUntil = differenceInDays(deadline, now);
  const nowDateStr = format(now, "yyyy-MM-dd");
  const deadlineDateStr = format(deadline, "yyyy-MM-dd");

  if (deadlineDateStr < nowDateStr) {
    return { urgency: "overdue", label: "Overdue", date: deadline };
  }
  if (deadlineDateStr === nowDateStr) {
    return { urgency: "today", label: "Due today", date: deadline };
  }
  if (daysUntil <= 3) {
    const dayLabel = daysUntil === 1 ? "Due tomorrow" : `Due in ${daysUntil}d`;
    return { urgency: "soon", label: dayLabel, date: deadline };
  }
  return {
    urgency: "normal",
    label: `Due ${format(deadline, "MMM d")}`,
    date: deadline,
  };
}

// ─── State Input ──────────────────────────────────────────────────────────────

export interface RecommendationInput {
  assessments: Assessment[];
  grades: GradeRecord[];
  classes: Class[];
  students: Student[];
  artifacts: PortfolioArtifact[];
  incidents: Incident[];
  reportCycles: ReportCycle[];
  reports: Report[];
  learningGoals: LearningGoal[];
  attendanceSessions: AttendanceSession[];
  lessonSlotAssignments: LessonSlotAssignment[];
  lessonPlans: LessonPlan[];
}

// ─── Master Function ──────────────────────────────────────────────────────────

export function generateRecommendations(
  input: RecommendationInput,
  now: Date,
  classFilter: string | null = null
): Recommendation[] {
  const all: Recommendation[] = [
    ...generateMarkingRecs(input, now),
    ...generateReportRecs(input, now),
    ...generateAttentionRecs(input, now),
    ...generateReleaseRecs(input, now),
    ...generatePortfolioRecs(input, now),
    ...generateIncidentRecs(input, now),
    ...generateRightNowRecs(input, now),
  ];

  const filtered = filterByClass(all, classFilter);
  return scoreAndSort(filtered);
}
```

- [ ] **Step 2: Build to verify imports resolve**

Run: `cd "/Users/tarakbatra/Desktop/Peach LMS" && npx tsc --noEmit 2>&1 | head -20`
Expected: May have errors for missing generator functions — that's fine, we'll add them next

- [ ] **Step 3: Commit scaffold**

```bash
git add src/lib/recommendation-engine.ts
git commit -m "feat: add recommendation engine scaffold with types, scoring, and filtering"
```

---

### Task 3: Implement the 6 category generators

**Files:**
- Modify: `src/lib/recommendation-engine.ts`

- [ ] **Step 1: Add marking backlog generator**

Append to `src/lib/recommendation-engine.ts` before the master function:

```typescript
// ─── Generator: Marking Backlog ───────────────────────────────────────────────

function generateMarkingRecs(
  input: RecommendationInput,
  now: Date
): Recommendation[] {
  const recs: Recommendation[] = [];
  const liveAssessments = input.assessments.filter((a) => a.status === "live");

  for (const asmt of liveAssessments) {
    const cls = input.classes.find((c) => c.id === asmt.classId);
    if (!cls) continue;

    const asmtGrades = input.grades.filter((g) => g.assessmentId === asmt.id);
    const count = getToMarkCount(cls.studentIds, asmtGrades, asmt);
    if (count === 0) continue;

    const { urgency, label, date } = computeDeadlineUrgency(asmt.dueDate, now);
    const hoursAgo = differenceInHours(now, new Date(asmt.dueDate));
    const isRightNow = hoursAgo >= 0 && hoursAgo <= 24;

    recs.push({
      id: `mark-${asmt.id}`,
      section: isRightNow ? "now" : "todo",
      category: "marking",
      title: `Mark ${count} submission${count !== 1 ? "s" : ""}`,
      subtitle: `${cls.name} — ${asmt.title}`,
      urgency,
      deadline: label,
      deadlineDate: date,
      count,
      href: `/assessments/${asmt.id}`,
      classId: asmt.classId,
      className: cls.name,
    });
  }

  return recs;
}
```

- [ ] **Step 2: Add report cycle progress generator**

```typescript
// ─── Generator: Report Cycle Progress ─────────────────────────────────────────

function generateReportRecs(
  input: RecommendationInput,
  now: Date
): Recommendation[] {
  const recs: Recommendation[] = [];
  const activeCycles = input.reportCycles.filter(
    (c) => c.status === "open" || c.status === "closing"
  );

  for (const cycle of activeCycles) {
    const cycleReports = input.reports.filter((r) => r.cycleId === cycle.id);
    const drafts = cycleReports.filter(
      (r) => r.publishState === "draft" || r.publishState === "ready"
    );
    const needsDistribution = cycleReports.filter(
      (r) =>
        r.publishState === "published" &&
        r.distributionStatus !== "completed"
    );

    const { urgency, label, date } = computeDeadlineUrgency(cycle.endDate, now);

    if (drafts.length > 0) {
      // Use classId of first report for filtering — cycles span classes
      const classId = drafts[0].classId;
      const cls = input.classes.find((c) => c.id === classId);
      recs.push({
        id: `report-drafts-${cycle.id}`,
        section: "todo",
        category: "reports",
        title: `Finalize ${drafts.length} report draft${drafts.length !== 1 ? "s" : ""}`,
        subtitle: cycle.name,
        urgency,
        deadline: label.replace("Due", "Closes"),
        deadlineDate: date,
        count: drafts.length,
        href: `/reports/cycles/${cycle.id}`,
        classId: classId,
        className: cls?.name ?? cycle.name,
      });
    }

    if (needsDistribution.length > 0) {
      const classId = needsDistribution[0].classId;
      const cls = input.classes.find((c) => c.id === classId);
      recs.push({
        id: `report-distribute-${cycle.id}`,
        section: "todo",
        category: "reports",
        title: `Distribute ${needsDistribution.length} published report${needsDistribution.length !== 1 ? "s" : ""}`,
        subtitle: cycle.name,
        urgency: urgency === "normal" ? "normal" : "soon",
        deadline: label.replace("Due", "Closes"),
        deadlineDate: date,
        count: needsDistribution.length,
        href: `/reports/cycles/${cycle.id}`,
        classId: classId,
        className: cls?.name ?? cycle.name,
      });
    }
  }

  return recs;
}
```

- [ ] **Step 3: Add student attention flags generator**

```typescript
// ─── Generator: Student Attention Flags ───────────────────────────────────────

function generateAttentionRecs(
  input: RecommendationInput,
  now: Date
): Recommendation[] {
  const recs: Recommendation[] = [];
  const classIds = [...new Set(input.assessments.map((a) => a.classId))];

  for (const classId of classIds) {
    const cls = input.classes.find((c) => c.id === classId);
    if (!cls) continue;

    const classStudents = input.students.filter((s) =>
      cls.studentIds.includes(s.id)
    );
    const classAssessments = input.assessments.filter(
      (a) => a.classId === classId && a.status === "live"
    );
    const classGrades = input.grades.filter((g) => g.classId === classId);

    const attentionStudents = computeAttentionStudents(
      classStudents,
      classGrades,
      classAssessments,
      input.learningGoals,
      classId
    );

    if (attentionStudents.length === 0) continue;

    // Urgency bump: check if any recent assessments (last 7 days) pushed students below threshold
    // If a student has a grade from the last 7 days and is in the attention list, bump to "soon"
    const recentGrades = classGrades.filter((g) => {
      if (!g.gradedAt) return false;
      return differenceInDays(now, new Date(g.gradedAt)) <= 7;
    });
    const recentlyFlagged = attentionStudents.some((as) =>
      recentGrades.some((g) => g.studentId === as.student.id)
    );

    recs.push({
      id: `attention-${classId}`,
      section: "todo",
      category: "attention",
      title: `${attentionStudents.length} student${attentionStudents.length !== 1 ? "s" : ""} need attention`,
      subtitle: cls.name,
      urgency: recentlyFlagged ? "soon" : "normal",
      count: attentionStudents.length,
      href: `/classes/${classId}`,
      classId,
      className: cls.name,
    });
  }

  return recs;
}
```

- [ ] **Step 4: Add grade release generator**

```typescript
// ─── Generator: Grade Release ─────────────────────────────────────────────────

function generateReleaseRecs(
  input: RecommendationInput,
  _now: Date
): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const asmt of input.assessments) {
    if (asmt.status === "draft") continue;
    const cls = input.classes.find((c) => c.id === asmt.classId);
    if (!cls) continue;

    const asmtGrades = input.grades.filter((g) => g.assessmentId === asmt.id);
    const readyUnreleased = asmtGrades.filter(
      (g) =>
        g.gradingStatus === "ready" && !g.releasedAt
    );

    if (readyUnreleased.length === 0) continue;

    // Urgency bump: all students graded, none released → likely forgot
    const totalStudents = cls.studentIds.length;
    const excusedCount = asmtGrades.filter(
      (g) => g.submissionStatus === "excused"
    ).length;
    const gradedCount = asmtGrades.filter(
      (g) => g.gradingStatus === "ready"
    ).length;
    const allGraded = gradedCount + excusedCount >= totalStudents;
    const noneReleased = asmtGrades.every((g) => !g.releasedAt);
    const urgency: RecommendationUrgency =
      allGraded && noneReleased ? "soon" : "normal";

    recs.push({
      id: `release-${asmt.id}`,
      section: "todo",
      category: "release",
      title: `Release ${readyUnreleased.length} ready grade${readyUnreleased.length !== 1 ? "s" : ""}`,
      subtitle: `${cls.name} — ${asmt.title}`,
      urgency,
      count: readyUnreleased.length,
      href: `/assessments/${asmt.id}`,
      classId: asmt.classId,
      className: cls.name,
    });
  }

  return recs;
}
```

- [ ] **Step 5: Add portfolio reviews generator**

```typescript
// ─── Generator: Portfolio Reviews ─────────────────────────────────────────────

function generatePortfolioRecs(
  input: RecommendationInput,
  now: Date
): Recommendation[] {
  const recs: Recommendation[] = [];
  const pending = input.artifacts.filter(
    (a) => a.approvalStatus === "pending"
  );

  // Group by class
  const byClass = new Map<string, PortfolioArtifact[]>();
  for (const art of pending) {
    const existing = byClass.get(art.classId) ?? [];
    existing.push(art);
    byClass.set(art.classId, existing);
  }

  for (const [classId, artifacts] of byClass) {
    const cls = input.classes.find((c) => c.id === classId);
    if (!cls) continue;

    // Check for revision resubmissions (were needs_revision, now pending again)
    const revisionResubmits = artifacts.filter(
      (a) => a.revisionNote && a.revisionRequestedAt
    );
    const normalPending = artifacts.filter(
      (a) => !a.revisionNote || !a.revisionRequestedAt
    );

    if (normalPending.length > 0) {
      const oldest = normalPending.reduce((o, a) =>
        a.createdAt < o.createdAt ? a : o
      );
      const daysWaiting = differenceInDays(now, new Date(oldest.createdAt));

      recs.push({
        id: `portfolio-${classId}`,
        section: "todo",
        category: "portfolio",
        title: `Review ${normalPending.length} portfolio submission${normalPending.length !== 1 ? "s" : ""}`,
        subtitle: cls.name,
        urgency: "normal",
        deadline: daysWaiting > 0 ? `${daysWaiting}d waiting` : "Today",
        count: normalPending.length,
        href: "/portfolio",
        classId,
        className: cls.name,
      });
    }

    if (revisionResubmits.length > 0) {
      recs.push({
        id: `portfolio-revision-${classId}`,
        section: "todo",
        category: "portfolio",
        title: `Review ${revisionResubmits.length} revised submission${revisionResubmits.length !== 1 ? "s" : ""}`,
        subtitle: `${cls.name} — resubmitted`,
        urgency: "soon",
        count: revisionResubmits.length,
        href: "/portfolio",
        classId,
        className: cls.name,
      });
    }
  }

  return recs;
}
```

- [ ] **Step 6: Add incident follow-ups generator**

```typescript
// ─── Generator: Incident Follow-ups ──────────────────────────────────────────

function generateIncidentRecs(
  input: RecommendationInput,
  now: Date
): Recommendation[] {
  const open = input.incidents.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  );
  if (open.length === 0) return [];

  // Group by class (incidents may not have classId — use "all")
  const byClass = new Map<string, Incident[]>();
  for (const inc of open) {
    const key = inc.classId ?? "all";
    const existing = byClass.get(key) ?? [];
    existing.push(inc);
    byClass.set(key, existing);
  }

  const recs: Recommendation[] = [];

  for (const [classId, incidents] of byClass) {
    const cls = classId !== "all"
      ? input.classes.find((c) => c.id === classId)
      : null;

    // Determine urgency: high severity → soon, 7d+ old with no follow-up → today
    let urgency: RecommendationUrgency = "normal";
    for (const inc of incidents) {
      const daysSinceReport = differenceInDays(now, new Date(inc.reportedAt));
      const hasRecentFollowUp = inc.followUps.length > 0;

      if (daysSinceReport > 7 && !hasRecentFollowUp) {
        urgency = "today";
        break;
      }
      if (inc.severity === "high" && urgency !== "today") {
        urgency = "soon";
      }
    }

    recs.push({
      id: `incidents-${classId}`,
      section: "todo",
      category: "incidents",
      title: `${incidents.length} open incident${incidents.length !== 1 ? "s" : ""} need follow-up`,
      subtitle: cls?.name ?? "Across classes",
      urgency,
      count: incidents.length,
      href: "/student-support",
      classId: classId !== "all" ? classId : "",
      className: cls?.name ?? "All",
    });
  }

  return recs;
}
```

- [ ] **Step 7: Add "Right Now" time-aware generators**

```typescript
// ─── Generator: Right Now (Time-Aware) ────────────────────────────────────────

function generateRightNowRecs(
  input: RecommendationInput,
  now: Date
): Recommendation[] {
  const recs: Recommendation[] = [];
  const nowDateStr = format(now, "yyyy-MM-dd");
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const dayMap: Record<number, string> = {
    0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
  };
  const todayDay = dayMap[now.getDay()];

  // Get all teacher's classes with today's schedule
  for (const cls of input.classes) {
    const todaySlots = cls.schedule.filter((s) => s.day === todayDay);

    for (const slot of todaySlots) {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);

      // Attendance: within period or 15 min before
      if (nowMinutes >= slotStart - 15 && nowMinutes <= slotEnd) {
        const attendanceTaken = input.attendanceSessions.some(
          (s) => s.classId === cls.id && s.date === nowDateStr
        );

        if (!attendanceTaken) {
          recs.push({
            id: `attendance-${cls.id}-${slot.startTime}`,
            section: "now",
            category: "marking", // attendance is high-priority
            title: `Take attendance`,
            subtitle: `${cls.name} (${slot.startTime}–${slot.endTime})`,
            urgency: "today",
            href: `/classes/${cls.id}`,
            classId: cls.id,
            className: cls.name,
          });
        }
      }

      // Lesson prep: next upcoming period (starts in 0-30 min)
      if (slotStart > nowMinutes && slotStart - nowMinutes <= 30) {
        const assignment = input.lessonSlotAssignments.find(
          (a) =>
            a.classId === cls.id &&
            a.date === nowDateStr &&
            a.slotStartTime === slot.startTime
        );

        if (assignment) {
          const lesson = input.lessonPlans.find(
            (lp) => lp.id === assignment.lessonPlanId
          );
          if (lesson) {
            recs.push({
              id: `lesson-prep-${cls.id}-${slot.startTime}`,
              section: "now",
              category: "marking",
              title: `Review lesson plan`,
              subtitle: `${lesson.title} — ${cls.name}`,
              urgency: "today",
              href: `/classes/${cls.id}`,
              classId: cls.id,
              className: cls.name,
            });
          }
        }
      }
    }

    // End-of-day: after last scheduled period, attendance not taken
    const lastSlot = todaySlots.sort((a, b) =>
      b.endTime.localeCompare(a.endTime)
    )[0];
    if (lastSlot && nowMinutes > timeToMinutes(lastSlot.endTime)) {
      const attendanceTaken = input.attendanceSessions.some(
        (s) => s.classId === cls.id && s.date === nowDateStr
      );
      if (!attendanceTaken && todaySlots.length > 0) {
        recs.push({
          id: `missed-attendance-${cls.id}`,
          section: "now",
          category: "attention",
          title: `Attendance not taken today`,
          subtitle: cls.name,
          urgency: "today",
          href: `/classes/${cls.id}`,
          classId: cls.id,
          className: cls.name,
        });
      }
    }
  }

  // Due today assessments
  const dueToday = input.assessments.filter((a) => {
    const dueDateStr = a.dueDate.split("T")[0];
    return dueDateStr === nowDateStr && a.status === "live";
  });
  for (const asmt of dueToday) {
    const cls = input.classes.find((c) => c.id === asmt.classId);
    if (!cls) continue;
    const asmtGrades = input.grades.filter((g) => g.assessmentId === asmt.id);
    const notSubmitted = cls.studentIds.filter((sid) => {
      const grade = asmtGrades.find((g) => g.studentId === sid);
      if (!grade) return true;
      return grade.submissionStatus === "none";
    });
    if (notSubmitted.length > 0) {
      recs.push({
        id: `due-today-${asmt.id}`,
        section: "now",
        category: "marking",
        title: `Assessment due today — ${notSubmitted.length} haven't submitted`,
        subtitle: `${cls.name} — ${asmt.title}`,
        urgency: "today",
        href: `/assessments/${asmt.id}`,
        classId: asmt.classId,
        className: cls.name,
      });
    }
  }

  return recs;
}
```

- [ ] **Step 8: Build to verify**

Run: `cd "/Users/tarakbatra/Desktop/Peach LMS" && npm run build`
Expected: Clean build. If there are type import issues, fix them.

- [ ] **Step 9: Commit**

```bash
git add src/lib/recommendation-engine.ts
git commit -m "feat: implement all 6 recommendation generators + right-now triggers"
```

---

## Chunk 2: UI Components

### Task 4: Create the recommendation item component

**Files:**
- Create: `src/components/dashboard/recommendation-item.tsx`

- [ ] **Step 1: Create `src/components/dashboard/recommendation-item.tsx`**

```typescript
"use client";

import type { Recommendation } from "@/lib/recommendation-engine";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Image,
  Shield,
  ArrowRight,
  Clock,
  X,
} from "lucide-react";
import Link from "next/link";

const URGENCY_COLORS: Record<string, string> = {
  overdue: "bg-red-500",
  today: "bg-amber-500",
  soon: "bg-blue-500",
  normal: "bg-slate-300",
};

const URGENCY_BADGE_COLORS: Record<string, string> = {
  overdue: "bg-red-50 text-red-700 border-red-200",
  today: "bg-amber-50 text-amber-700 border-amber-200",
  soon: "bg-blue-50 text-blue-700 border-blue-200",
  normal: "bg-slate-50 text-slate-500 border-slate-200",
};

const CATEGORY_ICONS: Record<string, typeof ClipboardList> = {
  marking: ClipboardList,
  reports: FileText,
  attention: AlertTriangle,
  release: CheckCircle2,
  portfolio: Image,
  incidents: Shield,
};

interface RecommendationItemProps {
  rec: Recommendation;
  compact?: boolean;
  onDismiss?: (id: string) => void;
  onSnooze?: (id: string) => void;
}

export function RecommendationItem({
  rec,
  compact = false,
  onDismiss,
  onSnooze,
}: RecommendationItemProps) {
  const Icon = CATEGORY_ICONS[rec.category] ?? ClipboardList;

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-lg border bg-white transition-shadow hover:shadow-sm ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      }`}
    >
      {/* Urgency bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg ${URGENCY_COLORS[rec.urgency]}`}
      />

      {/* Category icon */}
      <div className="mt-0.5 shrink-0 ml-1">
        <Icon className={`h-4 w-4 text-muted-foreground ${compact ? "h-3.5 w-3.5" : ""}`} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${compact ? "text-[12px]" : "text-[13px]"}`}>
          {rec.title}
        </p>
        <p className={`text-muted-foreground truncate ${compact ? "text-[11px]" : "text-[12px]"}`}>
          {rec.subtitle}
        </p>
      </div>

      {/* Right side: deadline + actions */}
      <div className="flex items-center gap-2 shrink-0">
        {rec.deadline && (
          <Badge
            variant="outline"
            className={`text-[10px] font-medium ${URGENCY_BADGE_COLORS[rec.urgency]}`}
          >
            {rec.deadline}
          </Badge>
        )}

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={rec.href}>
            <button
              type="button"
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Go to"
            >
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </Link>
          {onSnooze && (
            <button
              type="button"
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Snooze"
              onClick={() => onSnooze(rec.id)}
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Dismiss"
              onClick={() => onDismiss(rec.id)}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd "/Users/tarakbatra/Desktop/Peach LMS" && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/recommendation-item.tsx
git commit -m "feat: add RecommendationItem component with urgency bar and action buttons"
```

---

### Task 5: Create the recommendation list component

**Files:**
- Create: `src/components/dashboard/recommendation-list.tsx`

- [ ] **Step 1: Create `src/components/dashboard/recommendation-list.tsx`**

```typescript
"use client";

import { useState } from "react";
import type { Recommendation } from "@/lib/recommendation-engine";
import { RecommendationItem } from "./recommendation-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ListTodo, PartyPopper } from "lucide-react";

interface RecommendationListProps {
  recommendations: Recommendation[];
  dismissedIds: Set<string>;
  snoozedIds: Set<string>;
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
  classFilter: string | null;
  onClassFilterChange: (classId: string | null) => void;
  classes: { id: string; name: string }[];
}

export function RecommendationList({
  recommendations,
  dismissedIds,
  snoozedIds,
  onDismiss,
  onSnooze,
  classFilter,
  onClassFilterChange,
  classes,
}: RecommendationListProps) {
  const [showAllNow, setShowAllNow] = useState(false);
  const [showAllTodo, setShowAllTodo] = useState(false);

  const visible = recommendations.filter(
    (r) => !dismissedIds.has(r.id) && !snoozedIds.has(r.id)
  );

  const nowItems = visible.filter((r) => r.section === "now");
  const todoItems = visible.filter((r) => r.section === "todo");

  const displayedNow = showAllNow ? nowItems : nowItems.slice(0, 3);
  const displayedTodo = showAllTodo ? todoItems : todoItems.slice(0, 8);

  if (nowItems.length === 0 && todoItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <PartyPopper className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-[15px] font-semibold text-muted-foreground">
          You're all caught up!
        </p>
        <p className="text-[13px] text-muted-foreground/70 mt-1">
          No pending actions right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Right Now section */}
      {nowItems.length > 0 && (
        <div className="rounded-lg bg-[#fff2f0] border border-[#ffc1b7]/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[#c24e3f]" />
            <h3 className="text-[12px] font-bold text-[#c24e3f] uppercase tracking-wider">
              Right Now
            </h3>
            <Badge className="bg-[#c24e3f] text-white text-[10px] px-1.5 py-0">
              {nowItems.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {displayedNow.map((rec) => (
              <RecommendationItem
                key={rec.id}
                rec={rec}
                onDismiss={onDismiss}
                onSnooze={onSnooze}
              />
            ))}
          </div>
          {nowItems.length > 3 && !showAllNow && (
            <button
              className="text-[12px] text-[#c24e3f] hover:underline mt-2"
              onClick={() => setShowAllNow(true)}
            >
              +{nowItems.length - 3} more
            </button>
          )}
        </div>
      )}

      {/* To Do section */}
      {todoItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-slate-500" />
              <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                To Do
              </h3>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {todoItems.length}
              </Badge>
            </div>

            {/* Class filter pill */}
            <button
              className="text-[11px] text-muted-foreground hover:text-foreground border rounded-full px-2.5 py-0.5 transition-colors"
              onClick={() =>
                onClassFilterChange(classFilter ? null : classes[0]?.id ?? null)
              }
            >
              {classFilter
                ? classes.find((c) => c.id === classFilter)?.name ?? "Class"
                : "All classes"}{" "}
              ▾
            </button>
          </div>
          <div className="space-y-1.5">
            {displayedTodo.map((rec) => (
              <RecommendationItem
                key={rec.id}
                rec={rec}
                compact
                onDismiss={onDismiss}
                onSnooze={onSnooze}
              />
            ))}
          </div>
          {todoItems.length > 8 && !showAllTodo && (
            <button
              className="text-[12px] text-muted-foreground hover:underline mt-2"
              onClick={() => setShowAllTodo(true)}
            >
              Show all ({todoItems.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd "/Users/tarakbatra/Desktop/Peach LMS" && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/recommendation-list.tsx
git commit -m "feat: add RecommendationList with Right Now and To Do sections"
```

---

### Task 6: Create the stat cards component

**Files:**
- Create: `src/components/dashboard/stat-cards.tsx`

- [ ] **Step 1: Create `src/components/dashboard/stat-cards.tsx`**

```typescript
"use client";

import { Card } from "@/components/ui/card";
import {
  ClipboardList,
  CalendarClock,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface StatCardsProps {
  toMark: number;
  dueToday: number;
  readyToRelease: number;
  reportsDue: number;
}

const STATS_CONFIG = [
  {
    key: "toMark",
    label: "To Mark",
    icon: ClipboardList,
    bg: "bg-[#fff2f0]",
    border: "border-[#ffc1b7]",
    text: "text-[#c24e3f]",
  },
  {
    key: "dueToday",
    label: "Due Today",
    icon: CalendarClock,
    bg: "bg-[#dbeafe]",
    border: "border-[#93c5fd]",
    text: "text-[#2563eb]",
  },
  {
    key: "readyToRelease",
    label: "Ready to Release",
    icon: CheckCircle2,
    bg: "bg-[#dcfce7]",
    border: "border-[#86efac]",
    text: "text-[#16a34a]",
  },
  {
    key: "reportsDue",
    label: "Reports Due",
    icon: FileText,
    bg: "bg-[#fef3c7]",
    border: "border-[#fcd34d]",
    text: "text-[#b45309]",
  },
] as const;

export function StatCards({ toMark, dueToday, readyToRelease, reportsDue }: StatCardsProps) {
  const values: Record<string, number> = {
    toMark,
    dueToday,
    readyToRelease,
    reportsDue,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS_CONFIG.map((stat) => {
        const Icon = stat.icon;
        const value = values[stat.key];
        return (
          <Card
            key={stat.key}
            className={`${stat.bg} ${stat.border} border p-3 gap-0`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[22px] font-bold ${stat.text}`}>
                  {value}
                </p>
                <p className={`text-[11px] font-medium ${stat.text} opacity-80`}>
                  {stat.label}
                </p>
              </div>
              <Icon className={`h-5 w-5 ${stat.text} opacity-40`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd "/Users/tarakbatra/Desktop/Peach LMS" && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/stat-cards.tsx
git commit -m "feat: add StatCards component with 4 counter cards"
```

---

### Task 7: Create the dashboard sidebar component

**Files:**
- Create: `src/components/dashboard/dashboard-sidebar.tsx`

- [ ] **Step 1: Create `src/components/dashboard/dashboard-sidebar.tsx`**

```typescript
"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  Coffee,
  UtensilsCrossed,
  AlertTriangle,
  Shield,
  FileText,
  Image,
  MessageSquare,
} from "lucide-react";
import type { Class } from "@/types/class";
import type { ReportCycle, Report } from "@/types/report";
import type { Incident } from "@/types/incident";
import type { PortfolioArtifact } from "@/types/portfolio";
import type { Announcement } from "@/types/communication";
import type { AttendanceSession } from "@/types/attendance";
import type { Student } from "@/types/student";
import type { GradeRecord } from "@/types/gradebook";
import type { Assessment } from "@/types/assessment";
import type { LearningGoal } from "@/types/assessment";
import { computeAttentionStudents } from "@/lib/selectors/grade-selectors";
import { deriveTimeRows, timeToMinutes, type TimeRow } from "@/lib/timetable-utils";
import { format } from "date-fns";
import Link from "next/link";

interface DashboardSidebarProps {
  classes: Class[];
  now: Date;
  todayStr: string;
  reportCycles: ReportCycle[];
  reports: Report[];
  incidents: Incident[];
  artifacts: PortfolioArtifact[];
  announcements: Announcement[];
  attendanceSessions: AttendanceSession[];
  students: Student[];
  grades: GradeRecord[];
  assessments: Assessment[];
  learningGoals: LearningGoal[];
  onSlotClick?: (cls: Class) => void;
}

export function DashboardSidebar({
  classes,
  now,
  todayStr,
  reportCycles,
  reports,
  incidents,
  artifacts,
  announcements,
  attendanceSessions,
  students,
  grades,
  assessments,
  learningGoals,
  onSlotClick,
}: DashboardSidebarProps) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const dayMap: Record<number, string> = {
    0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
  };
  const todayDay = dayMap[now.getDay()];

  // Derive time rows from all classes
  const timeRows = useMemo(() => deriveTimeRows(classes), [classes]);

  // Build slot lookup: startTime → class with that slot today
  const slotLookup = useMemo(() => {
    const map = new Map<string, Class>();
    for (const cls of classes) {
      for (const slot of cls.schedule) {
        if (slot.day === todayDay) {
          map.set(slot.startTime, cls);
        }
      }
    }
    return map;
  }, [classes, todayDay]);

  // Room lookup
  const roomLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const cls of classes) {
      for (const slot of cls.schedule) {
        if (slot.day === todayDay && slot.room) {
          map.set(slot.startTime, slot.room);
        }
      }
    }
    return map;
  }, [classes, todayDay]);

  // Report cycle mini-panel data
  const activeCycle = reportCycles.find(
    (c) => c.status === "open" || c.status === "closing"
  );
  const cycleReports = activeCycle
    ? reports.filter((r) => r.cycleId === activeCycle.id)
    : [];
  const publishedCount = cycleReports.filter(
    (r) => r.publishState === "published" || r.publishState === "distributed"
  ).length;

  // Attention mini-panel data
  const openIncidents = incidents.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  );

  const attentionCount = useMemo(() => {
    const seen = new Set<string>();
    for (const cls of classes) {
      const classStudents = students.filter((s) => cls.studentIds.includes(s.id));
      const classAssessments = assessments.filter(
        (a) => a.classId === cls.id && a.status === "live"
      );
      const classGrades = grades.filter((g) => g.classId === cls.id);
      const flagged = computeAttentionStudents(
        classStudents,
        classGrades,
        classAssessments,
        learningGoals,
        cls.id
      );
      for (const s of flagged) seen.add(s.student.id);
    }
    return seen.size;
  }, [classes, students, grades, assessments, learningGoals]);

  // Recent activity
  const recentItems = useMemo(() => {
    type ActivityItem = { icon: typeof Image; text: string; time: string; href: string };
    const items: (ActivityItem & { ts: number })[] = [];

    // Recent artifacts
    for (const art of artifacts.slice(0, 5)) {
      items.push({
        icon: Image,
        text: `New artifact: ${art.title}`,
        time: art.createdAt,
        ts: new Date(art.createdAt).getTime(),
        href: "/portfolio",
      });
    }

    // Recent announcement replies
    for (const ann of announcements) {
      for (const reply of ann.threadReplies ?? []) {
        items.push({
          icon: MessageSquare,
          text: `Reply on "${ann.title}"`,
          time: reply.createdAt,
          ts: new Date(reply.createdAt).getTime(),
          href: "/communication",
        });
      }
    }

    // Recent incidents
    for (const inc of incidents.slice(0, 5)) {
      items.push({
        icon: Shield,
        text: `Incident: ${inc.title}`,
        time: inc.reportedAt,
        ts: new Date(inc.reportedAt).getTime(),
        href: "/student-support",
      });
    }

    return items
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 3)
      .map(({ ts, ...rest }) => rest);
  }, [artifacts, announcements, incidents]);

  function getPeriodStatus(row: TimeRow): "past" | "current" | "future" {
    const start = timeToMinutes(row.startTime);
    const end = timeToMinutes(row.endTime);
    if (nowMinutes > end) return "past";
    if (nowMinutes >= start - 15 && nowMinutes <= end) return "current";
    return "future";
  }

  function formatRelativeTime(timeStr: string): string {
    const diff = now.getTime() - new Date(timeStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-4">
      {/* Timetable Rail */}
      <Card className="p-3 gap-0">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Today's Schedule
        </h3>
        {timeRows.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-2">No classes today</p>
        ) : (
          <div className="space-y-1">
            {timeRows.map((row) => {
              if (row.type !== "class") {
                // Break/lunch
                return (
                  <div
                    key={`${row.startTime}-${row.endTime}`}
                    className="flex items-center gap-2 py-1.5 px-2 text-muted-foreground/60"
                  >
                    {row.type === "lunch" ? (
                      <UtensilsCrossed className="h-2.5 w-2.5" />
                    ) : (
                      <Coffee className="h-2.5 w-2.5" />
                    )}
                    <span className="text-[10px]">{row.label}</span>
                    <span className="text-[9px] ml-auto">{row.startTime}</span>
                  </div>
                );
              }

              const cls = slotLookup.get(row.startTime);
              const room = roomLookup.get(row.startTime);
              const status = getPeriodStatus(row);

              return (
                <button
                  key={`${row.startTime}-${row.endTime}`}
                  type="button"
                  onClick={() => cls && onSlotClick?.(cls)}
                  className={`w-full text-left rounded-md p-2 transition-colors ${
                    status === "current"
                      ? "bg-[#fff2f0] border-l-[3px] border-[#c24e3f]"
                      : status === "past"
                        ? "opacity-50"
                        : "hover:bg-muted/50"
                  } ${cls ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-medium ${
                        status === "current" ? "text-[#c24e3f]" : ""
                      }`}
                    >
                      {row.startTime} – {row.endTime}
                    </span>
                    {status === "current" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c24e3f] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c24e3f]" />
                      </span>
                    )}
                  </div>
                  {cls ? (
                    <>
                      <p className={`text-[12px] font-semibold mt-0.5 ${status === "current" ? "text-[#c24e3f]" : ""}`}>
                        {cls.name}
                      </p>
                      {room && (
                        <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                          <MapPin className="h-2 w-2" />
                          {room}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                      Free
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Report Cycle Mini-Panel */}
      {activeCycle && (
        <Card className="p-3 gap-0">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {activeCycle.name}
          </h3>
          <div className="bg-muted rounded-full h-1.5 mb-1.5 overflow-hidden">
            <div
              className="bg-[#c24e3f] h-full rounded-full transition-all"
              style={{
                width: `${cycleReports.length > 0 ? (publishedCount / cycleReports.length) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {publishedCount}/{cycleReports.length} published · Closes{" "}
            {format(new Date(activeCycle.endDate), "MMM d")}
          </p>
        </Card>
      )}

      {/* Attention Mini-Panel */}
      <Card className="p-3 gap-0">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Attention
        </h3>
        {attentionCount > 0 && (
          <Link href="/classes" className="flex items-center gap-1.5 text-[11px] text-foreground hover:text-[#c24e3f] transition-colors py-0.5">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            {attentionCount} student{attentionCount !== 1 ? "s" : ""} below 50%
          </Link>
        )}
        {openIncidents.length > 0 && (
          <Link href="/student-support" className="flex items-center gap-1.5 text-[11px] text-foreground hover:text-[#c24e3f] transition-colors py-0.5">
            <Shield className="h-3 w-3 text-amber-500" />
            {openIncidents.length} open incident{openIncidents.length !== 1 ? "s" : ""}
          </Link>
        )}
        {attentionCount === 0 && openIncidents.length === 0 && (
          <p className="text-[10px] text-muted-foreground/60">No flags</p>
        )}
      </Card>

      {/* Recent Activity Mini-Panel */}
      {recentItems.length > 0 && (
        <Card className="p-3 gap-0">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Recent Activity
          </h3>
          <div className="space-y-1.5">
            {recentItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-start gap-2 text-[10px] hover:text-[#c24e3f] transition-colors"
                >
                  <Icon className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="truncate flex-1">{item.text}</span>
                  <span className="text-muted-foreground/60 shrink-0">
                    {formatRelativeTime(item.time)}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd "/Users/tarakbatra/Desktop/Peach LMS" && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/dashboard-sidebar.tsx
git commit -m "feat: add DashboardSidebar with timetable rail and reference panels"
```

---

## Chunk 3: Dashboard Page Rewrite + Integration

### Task 8: Rewrite the dashboard page with Command Center layout

**Files:**
- Modify: `src/app/(portal)/dashboard/page.tsx` (full rewrite)

- [ ] **Step 1: Rewrite `src/app/(portal)/dashboard/page.tsx`**

Replace the entire file content. The new page:
1. Imports the recommendation engine, stat cards, recommendation list, and dashboard sidebar
2. Computes all derived data with `useMemo`
3. Manages `dismissedIds`, `snoozedIds`, and `recommendationClassFilter` state
4. Renders the Command Center layout: header → stats → main (recs) + sidebar

Key implementation notes:
- Use `getDemoNow()` from `src/lib/demo-time.ts` for all time calculations
- Use `useStore()` selectors to read all entities
- Pass `RecommendationInput` to `generateRecommendations()`
- Header has time-aware greeting: "Good morning" (before 12pm), "Good afternoon" (12-5pm), "Good evening" (after 5pm)
- Class filter dropdown in header uses `useStore((s) => s.ui.activeClassId)` and `useStore((s) => s.setActiveClass)`
- `recommendationClassFilter` syncs to `activeClassId` via `useEffect`, but can be overridden back to null
- Stat card counts: `toMark` via `getToMarkCount()`, `dueToday` via date comparison, `readyToRelease` via `gradingStatus === "ready"` + no `releasedAt`, `reportsDue` via `publishState` filter
- Layout: `flex` with main area `flex-1` and sidebar `w-[280px] shrink-0`

The page should be ~250 lines. All complex logic lives in the engine and components — the page is an orchestrator.

```typescript
"use client";

import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/stores";
import { getDemoNow } from "@/lib/demo-time";
import { format } from "date-fns";
import {
  generateRecommendations,
  type RecommendationInput,
} from "@/lib/recommendation-engine";
import { getToMarkCount } from "@/lib/grade-helpers";
import { StatCards } from "@/components/dashboard/stat-cards";
import { RecommendationList } from "@/components/dashboard/recommendation-list";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardPage() {
  const state = useStore((s) => s);
  const activeClassId = useStore((s) => s.ui.activeClassId);
  const setActiveClass = useStore((s) => s.setActiveClass);

  const now = getDemoNow();
  const todayStr = format(now, "yyyy-MM-dd");

  // Dismiss/snooze (session-only)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());

  // Class filter for recommendations — syncs to activeClassId but can be overridden
  const [recClassFilter, setRecClassFilter] = useState<string | null>(null);
  useEffect(() => {
    setRecClassFilter(activeClassId);
  }, [activeClassId]);

  // Time-aware greeting
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Build recommendation input
  const recInput: RecommendationInput = useMemo(
    () => ({
      assessments: state.assessments,
      grades: state.grades,
      classes: state.classes,
      students: state.students,
      artifacts: state.artifacts,
      incidents: state.incidents,
      reportCycles: state.reportCycles,
      reports: state.reports,
      learningGoals: state.learningGoals,
      attendanceSessions: state.attendanceSessions,
      lessonSlotAssignments: state.lessonSlotAssignments ?? [],
      lessonPlans: state.lessonPlans ?? [],
    }),
    [state]
  );

  // Generate recommendations
  const recommendations = useMemo(
    () => generateRecommendations(recInput, now, recClassFilter),
    [recInput, now, recClassFilter]
  );

  // Stat card counts
  const stats = useMemo(() => {
    const filteredAssessments = activeClassId
      ? state.assessments.filter((a) => a.classId === activeClassId)
      : state.assessments;
    const liveAssessments = filteredAssessments.filter((a) => a.status === "live");

    const toMark = liveAssessments.reduce((count, asmt) => {
      const cls = state.classes.find((c) => c.id === asmt.classId);
      if (!cls) return count;
      const asmtGrades = state.grades.filter((g) => g.assessmentId === asmt.id);
      return count + getToMarkCount(cls.studentIds, asmtGrades, asmt);
    }, 0);

    const dueToday = liveAssessments.filter(
      (a) => a.dueDate.split("T")[0] === todayStr
    ).length;

    const filteredGrades = activeClassId
      ? state.grades.filter((g) => g.classId === activeClassId)
      : state.grades;
    const readyToRelease = filteredGrades.filter(
      (g) => g.gradingStatus === "ready" && !g.releasedAt
    ).length;

    const activeCycles = state.reportCycles.filter(
      (c) => c.status === "open" || c.status === "closing"
    );
    const cycleIds = new Set(activeCycles.map((c) => c.id));
    const reportsDue = state.reports.filter(
      (r) =>
        cycleIds.has(r.cycleId) &&
        (r.publishState === "draft" || r.publishState === "ready") &&
        (!activeClassId || r.classId === activeClassId)
    ).length;

    return { toMark, dueToday, readyToRelease, reportsDue };
  }, [state, activeClassId, todayStr]);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };
  const handleSnooze = (id: string) => {
    setSnoozedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold">
            {greeting}, {state.currentUser?.name?.split(" ")[0] ?? "Teacher"}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {format(now, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <Select
          value={activeClassId ?? "all"}
          onValueChange={(v) => setActiveClass(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[220px] h-9 text-[13px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {state.classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <StatCards
        toMark={stats.toMark}
        dueToday={stats.dueToday}
        readyToRelease={stats.readyToRelease}
        reportsDue={stats.reportsDue}
      />

      {/* Command Center: Main + Sidebar */}
      <div className="flex gap-6">
        {/* Main area: Recommendations */}
        <div className="flex-1 min-w-0">
          <RecommendationList
            recommendations={recommendations}
            dismissedIds={dismissedIds}
            snoozedIds={snoozedIds}
            onDismiss={handleDismiss}
            onSnooze={handleSnooze}
            classFilter={recClassFilter}
            onClassFilterChange={setRecClassFilter}
            classes={state.classes.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>

        {/* Sidebar */}
        <div className="w-[280px] shrink-0 hidden lg:block">
          <DashboardSidebar
            classes={state.classes}
            now={now}
            todayStr={todayStr}
            reportCycles={state.reportCycles}
            reports={state.reports}
            incidents={state.incidents}
            artifacts={state.artifacts}
            announcements={state.announcements}
            attendanceSessions={state.attendanceSessions}
            students={state.students}
            grades={state.grades}
            assessments={state.assessments}
            learningGoals={state.learningGoals}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd "/Users/tarakbatra/Desktop/Peach LMS" && npm run build`
Expected: Clean build. Fix any type import issues.

- [ ] **Step 3: Manually verify in browser**

Run: `cd "/Users/tarakbatra/Desktop/Peach LMS" && npm run dev`
Navigate to http://localhost:3000/dashboard and verify:
- Header shows greeting + date + class filter
- 4 stat cards show correct counts
- "Right Now" section shows time-sensitive items (based on demo time 09:00 Monday)
- "To Do" section shows prioritized backlog
- Sidebar shows timetable rail with current period highlighted
- Sidebar shows report cycle progress, attention flags, recent activity
- Dismiss/snooze buttons work (items disappear)
- Class filter cascades from header dropdown
- Class filter pill in recommendations can override back to "All"

- [ ] **Step 4: Commit**

```bash
git add src/app/\(portal\)/dashboard/page.tsx
git commit -m "feat: rewrite teacher dashboard with Command Center recommendation engine layout"
```

---

### Task 9: Final verification and cleanup

- [ ] **Step 1: Full build check**

Run: `cd "/Users/tarakbatra/Desktop/Peach LMS" && npm run build`
Expected: Clean build, no errors

- [ ] **Step 2: Check no other portals are affected**

Navigate to:
- http://localhost:3000/student/home (student portal)
- http://localhost:3000/family/home (family portal)
- http://localhost:3000/admin/overview (admin portal)

Verify all still work correctly.

- [ ] **Step 3: Bump SEED_VERSION if needed**

If any seed data changes were required, bump SEED_VERSION in `src/components/shell/store-initializer.tsx`.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: teacher dashboard recommendation engine — final verification"
```
