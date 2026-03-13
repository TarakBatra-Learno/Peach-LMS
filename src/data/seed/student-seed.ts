/**
 * student-seed.ts
 *
 * Seed data for student portal: submissions across lifecycle states,
 * personal goals with evidence links, and notifications.
 *
 * References existing seed students (stu_01 through stu_05) and
 * existing assessments. Only creates cross-entity relationships.
 */

import type { GradeRecord } from "@/types/gradebook";
import type { Submission } from "@/types/submission";
import type { StudentGoal } from "@/types/student-goal";
import type { GoalEvidenceLink } from "@/types/goal-evidence";
import type { StudentNotification } from "@/types/notification";
import type { Assessment } from "@/types/assessment";
import { getDemoNow } from "@/lib/demo-time";

/**
 * Replaces a small set of bulk-generated assessment rows with intentional demo exemplars.
 * This keeps teacher and student surfaces coherent without changing the underlying state model.
 */
interface SeedAssessmentOverridePair {
  studentId: string;
  assessmentId: string;
}

export interface SeedAssessmentDemoState {
  overridePairs: SeedAssessmentOverridePair[];
  submissions: Submission[];
  grades: GradeRecord[];
}

function findLiveAssessmentByTitle(assessments: Assessment[], title: string) {
  return assessments.find(
    (assessment) =>
      assessment.title === title &&
      (assessment.status === "live" || assessment.status === "published")
  );
}

function isoDaysFrom(dateString: string, offsetDays: number) {
  const next = new Date(dateString);
  next.setDate(next.getDate() + offsetDays);
  return next.toISOString();
}

export function generateSeedAssessmentDemoState(
  assessments: Assessment[]
): SeedAssessmentDemoState {
  const physicsProblemSet = findLiveAssessmentByTitle(assessments, "Physics Problem Set");
  const labSafetyAssessment = findLiveAssessmentByTitle(assessments, "Lab Safety Assessment");

  if (
    !physicsProblemSet ||
    !labSafetyAssessment ||
    physicsProblemSet.gradingMode !== "score" ||
    labSafetyAssessment.gradingMode !== "score" ||
    !physicsProblemSet.totalPoints ||
    !labSafetyAssessment.totalPoints
  ) {
    return {
      overridePairs: [],
      submissions: [],
      grades: [],
    };
  }

  const overridePairs: SeedAssessmentOverridePair[] = [
    { studentId: "stu_01", assessmentId: physicsProblemSet.id },
    { studentId: "stu_02", assessmentId: physicsProblemSet.id },
    { studentId: "stu_03", assessmentId: physicsProblemSet.id },
    { studentId: "stu_04", assessmentId: physicsProblemSet.id },
    { studentId: "stu_05", assessmentId: physicsProblemSet.id },
    { studentId: "stu_01", assessmentId: labSafetyAssessment.id },
  ];

  const submissions: Submission[] = [
    {
      id: "sub_seed_01",
      assessmentId: physicsProblemSet.id,
      studentId: "stu_01",
      classId: physicsProblemSet.classId,
      status: "submitted",
      content:
        "I solved each forces-and-motion problem step by step and checked the final units to make sure my reasoning stayed clear.",
      attachments: [
        {
          id: "att_seed_01",
          name: "physics-problem-set-final.pdf",
          type: "document",
          url: "https://mock.example.com/physics-problem-set-final.pdf",
          sourceType: "drive_import",
        },
      ],
      submittedAt: isoDaysFrom(physicsProblemSet.dueDate, -2),
      isLate: false,
      createdAt: isoDaysFrom(physicsProblemSet.dueDate, -3),
      updatedAt: isoDaysFrom(physicsProblemSet.dueDate, -2),
    },
    {
      id: "sub_seed_02",
      assessmentId: labSafetyAssessment.id,
      studentId: "stu_01",
      classId: labSafetyAssessment.classId,
      status: "draft",
      content:
        "Draft notes for the lab safety scenarios. I have explained the hazard symbols and still need to finish the final reflection.",
      attachments: [],
      draftSavedAt: isoDaysFrom(labSafetyAssessment.dueDate, -1),
      isLate: false,
      createdAt: isoDaysFrom(labSafetyAssessment.dueDate, -2),
      updatedAt: isoDaysFrom(labSafetyAssessment.dueDate, -1),
    },
    {
      id: "sub_seed_03",
      assessmentId: physicsProblemSet.id,
      studentId: "stu_02",
      classId: physicsProblemSet.classId,
      status: "submitted",
      content:
        "My submission includes the completed calculations and short written explanations for each question on net force and acceleration.",
      attachments: [
        {
          id: "att_seed_02",
          name: "forces-motion-worked-solutions.pdf",
          type: "document",
          url: "https://mock.example.com/forces-motion-worked-solutions.pdf",
          sourceType: "manual",
        },
      ],
      submittedAt: isoDaysFrom(physicsProblemSet.dueDate, -1),
      isLate: false,
      createdAt: isoDaysFrom(physicsProblemSet.dueDate, -2),
      updatedAt: isoDaysFrom(physicsProblemSet.dueDate, -1),
    },
    {
      id: "sub_seed_04",
      assessmentId: physicsProblemSet.id,
      studentId: "stu_03",
      classId: physicsProblemSet.classId,
      status: "submitted",
      content:
        "I finished the full problem set after extra help in class and added annotations showing where I corrected my original force diagrams.",
      attachments: [
        {
          id: "att_seed_03",
          name: "forces-motion-annotated.pdf",
          type: "document",
          url: "https://mock.example.com/forces-motion-annotated.pdf",
          sourceType: "drive_import",
        },
      ],
      submittedAt: isoDaysFrom(physicsProblemSet.dueDate, 1),
      isLate: true,
      createdAt: isoDaysFrom(physicsProblemSet.dueDate, -1),
      updatedAt: isoDaysFrom(physicsProblemSet.dueDate, 1),
    },
  ];

  const grades: GradeRecord[] = [
    {
      id: "grd_seed_01",
      assessmentId: physicsProblemSet.id,
      studentId: "stu_01",
      classId: physicsProblemSet.classId,
      gradingMode: physicsProblemSet.gradingMode,
      submissionStatus: "submitted",
      score: 34,
      totalPoints: physicsProblemSet.totalPoints,
      feedback:
        "Your calculations were accurate and your written explanations made the sequence of steps easy to follow.",
      submittedAt: isoDaysFrom(physicsProblemSet.dueDate, -2),
      gradedAt: isoDaysFrom(physicsProblemSet.dueDate, -1),
      gradingStatus: "ready",
      releasedAt: isoDaysFrom(physicsProblemSet.dueDate, 1),
      reportStatus: "unseen",
    },
    {
      id: "grd_seed_02",
      assessmentId: physicsProblemSet.id,
      studentId: "stu_02",
      classId: physicsProblemSet.classId,
      gradingMode: physicsProblemSet.gradingMode,
      submissionStatus: "submitted",
      submittedAt: isoDaysFrom(physicsProblemSet.dueDate, -1),
      gradingStatus: "none",
    },
    {
      id: "grd_seed_03",
      assessmentId: physicsProblemSet.id,
      studentId: "stu_03",
      classId: physicsProblemSet.classId,
      gradingMode: physicsProblemSet.gradingMode,
      submissionStatus: "submitted",
      score: 28,
      totalPoints: physicsProblemSet.totalPoints,
      feedback:
        "The revised working is much clearer now. Check sign conventions more carefully when you set up the final acceleration step.",
      submittedAt: isoDaysFrom(physicsProblemSet.dueDate, 1),
      gradedAt: isoDaysFrom(physicsProblemSet.dueDate, 2),
      gradingStatus: "ready",
    },
    {
      id: "grd_seed_04",
      assessmentId: physicsProblemSet.id,
      studentId: "stu_05",
      classId: physicsProblemSet.classId,
      gradingMode: physicsProblemSet.gradingMode,
      submissionStatus: "excused",
      gradingStatus: "none",
    },
  ];

  return {
    overridePairs,
    submissions,
    grades,
  };
}

/**
 * Generate seed personal goals (evidence + reflection model, no progress tracking)
 */
export function generateSeedStudentGoals(): StudentGoal[] {
  const demoNow = getDemoNow();
  const now = demoNow.toISOString();
  const weekAgo = new Date(demoNow.getTime() - 7 * 86400000).toISOString();
  return [
    {
      id: "sgoal_01",
      studentId: "stu_01",
      title: "Improve essay writing structure",
      description: "Work on organizing my essays with clearer thesis statements and supporting paragraphs. I want to develop a consistent approach to argumentation.",
      status: "active",
      linkedClassIds: [],
      linkedLearningGoalIds: [],
      linkedUnitIds: [],
      createdAt: weekAgo,
      updatedAt: now,
    },
    {
      id: "sgoal_02",
      studentId: "stu_01",
      title: "Build stronger lab report habits",
      description: "Submit all science lab reports before the deadline. Focus on data analysis sections and clear methodology descriptions.",
      status: "active",
      linkedClassIds: [],
      linkedLearningGoalIds: [],
      linkedUnitIds: [],
      createdAt: weekAgo,
      updatedAt: weekAgo,
    },
    {
      id: "sgoal_03",
      studentId: "stu_02",
      title: "Build confidence in public speaking",
      description: "Volunteer for at least 3 presentations this semester. Record myself practicing and reflect on what went well and what to improve.",
      status: "active",
      linkedClassIds: [],
      linkedLearningGoalIds: [],
      linkedUnitIds: [],
      createdAt: weekAgo,
      updatedAt: now,
    },
  ];
}

/**
 * Generate seed evidence links between goals and existing source entities
 */
export function generateSeedGoalEvidenceLinks(): GoalEvidenceLink[] {
  const demoNow = getDemoNow();
  const now = demoNow.toISOString();
  const dayAgo = new Date(demoNow.getTime() - 86400000).toISOString();
  const threeDaysAgo = new Date(demoNow.getTime() - 3 * 86400000).toISOString();
  return [
    {
      id: "gel_01",
      goalId: "sgoal_01",
      sourceType: "submission",
      sourceId: "sub_seed_01",
      addedAt: dayAgo,
      reflection: "This essay shows my improved paragraph structure compared to my first attempt. I used a clearer thesis statement and each paragraph supports the main argument.",
      addedFromSurface: "goal_detail",
    },
    {
      id: "gel_02",
      goalId: "sgoal_02",
      sourceType: "submission",
      sourceId: "sub_seed_02",
      addedAt: now,
      reflection: "Started this draft early — working on my time management. Even though it's not finished yet, the fact that I began 3 days before the deadline is progress.",
      addedFromSurface: "submission",
    },
    {
      id: "gel_03",
      goalId: "sgoal_03",
      sourceType: "submission",
      sourceId: "sub_seed_04",
      addedAt: threeDaysAgo,
      reflection: "This later submission shows that I stayed with the task and improved the clarity of my working even after I missed the original deadline.",
      addedFromSurface: "submission",
    },
  ];
}

/**
 * Generate seed notifications for students
 */
export function generateSeedNotifications(assessments: Assessment[]): StudentNotification[] {
  const demoNow = getDemoNow();
  const hourAgo = new Date(demoNow.getTime() - 3600000).toISOString();
  const dayAgo = new Date(demoNow.getTime() - 86400000).toISOString();
  const physicsProblemSet = findLiveAssessmentByTitle(assessments, "Physics Problem Set");
  const labSafetyAssessment = findLiveAssessmentByTitle(assessments, "Lab Safety Assessment");

  return [
    {
      id: "notif_seed_01",
      studentId: "stu_01",
      type: "grade_released",
      title: "Grade released",
      body: 'Your result for "Physics Problem Set" has been released.',
      read: false,
      createdAt: hourAgo,
      linkTo: physicsProblemSet
        ? `/student/classes/${physicsProblemSet.classId}/assessments/${physicsProblemSet.id}`
        : undefined,
      dedupeKey: "stu_01:physics-problem-set:grade_released",
    },
    {
      id: "notif_seed_02",
      studentId: "stu_01",
      type: "assessment_due",
      title: "Assessment due soon",
      body: 'Your draft for "Lab Safety Assessment" is still in progress. Submit it before the due date.',
      read: true,
      createdAt: dayAgo,
      linkTo: labSafetyAssessment
        ? `/student/classes/${labSafetyAssessment.classId}/assessments/${labSafetyAssessment.id}`
        : undefined,
      dedupeKey: "stu_01:lab-safety-assessment:assessment_due",
    },
    {
      id: "notif_seed_03",
      studentId: "stu_05",
      type: "student_excused",
      title: "Assessment excused",
      body: 'You have been excused from "Physics Problem Set".',
      read: false,
      createdAt: hourAgo,
      linkTo: physicsProblemSet
        ? `/student/classes/${physicsProblemSet.classId}/assessments/${physicsProblemSet.id}`
        : undefined,
      dedupeKey: "stu_05:physics-problem-set:student_excused",
    },
    {
      id: "notif_seed_04",
      studentId: "stu_03",
      type: "announcement",
      title: "New announcement",
      body: "A new announcement has been posted in your class channel.",
      read: true,
      createdAt: dayAgo,
      dedupeKey: "stu_03:seed_announce:announcement",
    },
  ];
}
