/**
 * student-seed.ts
 *
 * Seed data for student portal: submissions across lifecycle states,
 * personal goals with evidence links, and notifications.
 *
 * References existing seed students (stu_01 through stu_05) and
 * existing assessments. Only creates cross-entity relationships.
 */

import type { Submission } from "@/types/submission";
import type { StudentGoal } from "@/types/student-goal";
import type { GoalEvidenceLink } from "@/types/goal-evidence";
import type { StudentNotification } from "@/types/notification";
import type { Assessment } from "@/types/assessment";

/**
 * Generate seed submissions for the first 5 students.
 * Requires passing in the assessments array to select from published ones.
 */
export function generateSeedSubmissions(assessments: Assessment[]): Submission[] {
  const published = assessments.filter((a) => a.status === "published");
  if (published.length === 0) return [];

  const submissions: Submission[] = [];
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();

  // stu_01: submitted + draft
  if (published[0]) {
    submissions.push({
      id: "sub_seed_01",
      assessmentId: published[0].id,
      studentId: "stu_01",
      classId: published[0].classId,
      status: "submitted",
      content: "This is my completed essay on the topic of global sustainability. I've analyzed three key aspects: economic impact, environmental consequences, and social implications.",
      attachments: [
        { id: "att_seed_01", name: "Essay_Final.docx", type: "document", url: "https://mock.example.com/essay.docx", sourceType: "drive_import" },
      ],
      submittedAt: yesterday,
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
    });
  }
  if (published[1]) {
    submissions.push({
      id: "sub_seed_02",
      assessmentId: published[1].id,
      studentId: "stu_01",
      classId: published[1].classId,
      status: "draft",
      content: "Working on my analysis of the primary sources...",
      attachments: [],
      draftSavedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  // stu_02: returned (needs revision)
  if (published[0]) {
    submissions.push({
      id: "sub_seed_03",
      assessmentId: published[0].id,
      studentId: "stu_02",
      classId: published[0].classId,
      status: "returned",
      content: "My initial submission for the sustainability essay. I focused primarily on environmental aspects.",
      attachments: [
        { id: "att_seed_02", name: "Draft_v1.pdf", type: "document", url: "https://mock.example.com/draft.pdf", sourceType: "manual" },
      ],
      teacherComment: "Good start, but you need to expand your analysis of the economic impact. Also, please add at least two more sources to support your arguments. See the rubric for specifics.",
      submittedAt: twoDaysAgo,
      returnedAt: yesterday,
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
    });
  }

  // stu_03: resubmitted
  if (published[0]) {
    submissions.push({
      id: "sub_seed_04",
      assessmentId: published[0].id,
      studentId: "stu_03",
      classId: published[0].classId,
      status: "resubmitted",
      content: "I have revised my essay to include the economic analysis you mentioned. I've added sections on GDP impact and trade implications, with three additional academic sources.",
      attachments: [
        { id: "att_seed_03", name: "Essay_Revised.docx", type: "document", url: "https://mock.example.com/revised.docx", sourceType: "drive_import" },
        { id: "att_seed_04", name: "Sources_Bibliography.pdf", type: "document", url: "https://mock.example.com/sources.pdf", sourceType: "manual" },
      ],
      teacherComment: "Please expand the economic analysis section.",
      reflection: "I realized I had focused too narrowly on environmental issues. The economic perspective was important because it connects the topic to real-world policy decisions.",
      submittedAt: twoDaysAgo,
      returnedAt: yesterday,
      resubmittedAt: now,
      createdAt: twoDaysAgo,
      updatedAt: now,
    });
  }

  // stu_04: submitted for second assessment
  if (published[1]) {
    submissions.push({
      id: "sub_seed_05",
      assessmentId: published[1].id,
      studentId: "stu_04",
      classId: published[1].classId,
      status: "submitted",
      content: "Here is my analysis of the primary source documents from the archive collection.",
      attachments: [
        { id: "att_seed_05", name: "Analysis_Notes.docx", type: "document", url: "https://mock.example.com/analysis.docx", sourceType: "onedrive_import" },
      ],
      submittedAt: yesterday,
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
    });
  }

  return submissions;
}

/**
 * Generate seed personal goals (evidence + reflection model, no progress tracking)
 */
export function generateSeedStudentGoals(): StudentGoal[] {
  const now = new Date().toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
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
  const now = new Date().toISOString();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
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
      sourceId: "sub_seed_03",
      addedAt: threeDaysAgo,
      reflection: "Even though this was returned for revision, presenting my argument in the essay was a growth moment. I articulated my position clearly even if the scope needs expanding.",
      addedFromSurface: "returned_work",
    },
  ];
}

/**
 * Generate seed notifications for students
 */
export function generateSeedNotifications(): StudentNotification[] {
  const now = new Date().toISOString();
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();

  return [
    {
      id: "notif_seed_01",
      studentId: "stu_01",
      type: "grade_released",
      title: "Grade released",
      body: "Your grade has been released for a recent assessment.",
      read: false,
      createdAt: hourAgo,
      dedupeKey: "stu_01:seed_grade:grade_released",
    },
    {
      id: "notif_seed_02",
      studentId: "stu_01",
      type: "assessment_due",
      title: "Assessment due soon",
      body: "You have an assessment due this week. Make sure to submit your work on time.",
      read: true,
      createdAt: dayAgo,
      dedupeKey: "stu_01:seed_due:assessment_due",
    },
    {
      id: "notif_seed_03",
      studentId: "stu_02",
      type: "submission_returned",
      title: "Submission returned",
      body: "Your submission has been returned with feedback. Please review and revise.",
      read: false,
      createdAt: hourAgo,
      dedupeKey: "stu_02:seed_return:submission_returned",
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
