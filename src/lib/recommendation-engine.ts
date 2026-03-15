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
import { timeToMinutes } from "@/lib/timetable-utils";

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

// ─── Generator: Portfolio Reviews ─────────────────────────────────────────────

function generatePortfolioRecs(
  input: RecommendationInput,
  now: Date
): Recommendation[] {
  const recs: Recommendation[] = [];
  const pending = input.artifacts.filter(
    (a) => a.approvalStatus === "pending"
  );

  const byClass = new Map<string, PortfolioArtifact[]>();
  for (const art of pending) {
    const existing = byClass.get(art.classId) ?? [];
    existing.push(art);
    byClass.set(art.classId, existing);
  }

  for (const [classId, artifacts] of byClass) {
    const cls = input.classes.find((c) => c.id === classId);
    if (!cls) continue;

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

// ─── Generator: Incident Follow-ups ──────────────────────────────────────────

function generateIncidentRecs(
  input: RecommendationInput,
  now: Date
): Recommendation[] {
  const open = input.incidents.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  );
  if (open.length === 0) return [];

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

    let urgency: RecommendationUrgency = "normal";
    for (const inc of incidents) {
      const daysSinceReport = differenceInDays(now, new Date(inc.reportedAt));
      const hasRecentFollowUp = inc.followUps.length > 0;

      if (daysSinceReport > 7 && !hasRecentFollowUp) {
        urgency = "today";
        break;
      }
      if (inc.severity === "high") {
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
            category: "marking",
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
