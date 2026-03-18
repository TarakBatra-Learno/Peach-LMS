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
import type { AssessmentReport, AssessmentInsightSummary } from "@/types/assessment-report";
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
  assessmentReports: AssessmentReport[];
  assessmentInsightSummaries: AssessmentInsightSummary[];
}

function findLiveAssessmentByTitle(assessments: Assessment[], title: string) {
  return assessments.find(
    (assessment) =>
      assessment.title === title &&
      (assessment.status === "live" || assessment.status === "published")
  );
}

function findAssessmentById(assessments: Assessment[], id: string) {
  return assessments.find((assessment) => assessment.id === id);
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
  const overridePairs: SeedAssessmentOverridePair[] = [];
  const submissions: Submission[] = [];
  const grades: GradeRecord[] = [];
  const assessmentReports: AssessmentReport[] = [];
  const assessmentInsightSummaries: AssessmentInsightSummary[] = [];

  if (
    physicsProblemSet &&
    labSafetyAssessment &&
    physicsProblemSet.gradingMode === "score" &&
    labSafetyAssessment.gradingMode === "score" &&
    physicsProblemSet.totalPoints &&
    labSafetyAssessment.totalPoints
  ) {
    overridePairs.push(
      { studentId: "stu_01", assessmentId: physicsProblemSet.id },
      { studentId: "stu_02", assessmentId: physicsProblemSet.id },
      { studentId: "stu_03", assessmentId: physicsProblemSet.id },
      { studentId: "stu_04", assessmentId: physicsProblemSet.id },
      { studentId: "stu_05", assessmentId: physicsProblemSet.id },
      { studentId: "stu_01", assessmentId: labSafetyAssessment.id }
    );

    submissions.push(
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
      }
    );

    grades.push(
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
      }
    );
  }

  const offPlatformAssessment = findAssessmentById(assessments, "asmt_typed_offplatform");
  const offlineObservationAssessment = findAssessmentById(assessments, "asmt_typed_offline");
  const quizAssessment = findAssessmentById(assessments, "asmt_typed_quiz");
  const chatAssessment = findAssessmentById(assessments, "asmt_typed_chat");
  const essayAssessment = findAssessmentById(assessments, "asmt_typed_essay");

  if (offPlatformAssessment) {
    submissions.push(
      {
        id: "sub_typed_offplatform_01",
        assessmentId: offPlatformAssessment.id,
        studentId: "stu_01",
        classId: offPlatformAssessment.classId,
        assessmentType: "off_platform",
        status: "submitted",
        content:
          "I uploaded the field investigation write-up with annotated observations from the wetland transect.",
        attachments: [
          {
            id: "att_typed_offplatform_01",
            name: "field-investigation-report.pdf",
            type: "document",
            url: "https://mock.example.com/field-investigation-report.pdf",
            sourceType: "drive_import",
          },
        ],
        typedPayload: {
          offPlatform: {
            mode: "digital_submission",
            responseText:
              "My hypothesis was supported in the shaded plot. I linked the moisture readings to the species distribution in the appendix.",
            evidenceSummary: "Annotated transect notes, species-count table, and a final reflection.",
          },
        },
        submittedAt: isoDaysFrom(offPlatformAssessment.dueDate, -1),
        isLate: false,
        createdAt: isoDaysFrom(offPlatformAssessment.dueDate, -3),
        updatedAt: isoDaysFrom(offPlatformAssessment.dueDate, -1),
      },
      {
        id: "sub_typed_offplatform_02",
        assessmentId: offPlatformAssessment.id,
        studentId: "stu_02",
        classId: offPlatformAssessment.classId,
        assessmentType: "off_platform",
        status: "submitted",
        content:
          "My field report compares the biodiversity counts from the shaded and exposed plots with a short conclusion on sampling reliability.",
        attachments: [],
        typedPayload: {
          offPlatform: {
            mode: "digital_submission",
            responseText: "I included the corrected species table after the second field visit.",
            evidenceSummary: "Species table, data commentary, and one calibration note.",
          },
        },
        submittedAt: isoDaysFrom(offPlatformAssessment.dueDate, 0),
        isLate: false,
        createdAt: isoDaysFrom(offPlatformAssessment.dueDate, -2),
        updatedAt: isoDaysFrom(offPlatformAssessment.dueDate, 0),
      }
    );

    grades.push(
      {
        id: "grd_typed_offplatform_01",
        assessmentId: offPlatformAssessment.id,
        studentId: "stu_01",
        classId: offPlatformAssessment.classId,
        gradingMode: offPlatformAssessment.gradingMode,
        submissionStatus: "submitted",
        feedback:
          "Your observations are precise and your final explanation clearly connects evidence to the investigation question.",
        submittedAt: isoDaysFrom(offPlatformAssessment.dueDate, -1),
        gradedAt: isoDaysFrom(offPlatformAssessment.dueDate, 1),
        gradingStatus: "ready",
        releasedAt: isoDaysFrom(offPlatformAssessment.dueDate, 2),
        reportStatus: "unseen",
        rubricScores: offPlatformAssessment.rubric?.slice(0, 3).map((criterion, index) => ({
          criterionId: criterion.id,
          levelId: criterion.levels[Math.min(index + 1, criterion.levels.length - 1)]?.id ?? criterion.levels[0].id,
          points:
            criterion.levels[Math.min(index + 1, criterion.levels.length - 1)]?.points ??
            criterion.levels[0].points,
        })),
      },
      {
        id: "grd_typed_offplatform_02",
        assessmentId: offPlatformAssessment.id,
        studentId: "stu_02",
        classId: offPlatformAssessment.classId,
        gradingMode: offPlatformAssessment.gradingMode,
        submissionStatus: "submitted",
        feedback:
          "The data table is accurate. Push the analysis further by explaining what the outlier reading might mean for your conclusion.",
        submittedAt: isoDaysFrom(offPlatformAssessment.dueDate, 0),
        gradedAt: isoDaysFrom(offPlatformAssessment.dueDate, 2),
        gradingStatus: "ready",
        rubricScores: offPlatformAssessment.rubric?.slice(0, 3).map((criterion, index) => ({
          criterionId: criterion.id,
          levelId: criterion.levels[Math.min(index, criterion.levels.length - 1)]?.id ?? criterion.levels[0].id,
          points:
            criterion.levels[Math.min(index, criterion.levels.length - 1)]?.points ??
            criterion.levels[0].points,
        })),
      }
    );

    assessmentReports.push(
      {
        id: "asrep_typed_offplatform_01",
        assessmentId: offPlatformAssessment.id,
        studentId: "stu_01",
        classId: offPlatformAssessment.classId,
        status: "released",
        summary:
          "Aarav demonstrates strong scientific communication and accurate evidence handling in the field investigation report.",
        strengths: [
          "Connected field observations to the investigation question with clear scientific vocabulary.",
          "Selected evidence from the transect notes to justify the final conclusion.",
        ],
        weaknesses: [
          "Could evaluate one anomalous reading in more detail to strengthen the conclusion.",
        ],
        suggestions: [
          "Add one more sentence comparing the reliability of the shaded and exposed sample sites.",
        ],
        rubricFeedback: [
          {
            criterionLabel: "Investigation design",
            levelLabel: "Secure",
            summary: "The report shows a clear method and a credible link between variables and collected evidence.",
          },
          {
            criterionLabel: "Analysis and interpretation",
            levelLabel: "Strong",
            summary: "Data interpretation is accurate and mostly explains why the ecosystem pattern appears in the final chart.",
          },
        ],
        sourceAttribution: [
          { id: "asrep_src_offplatform_01", sourceType: "submission", label: "Field investigation write-up", sourceId: "sub_typed_offplatform_01" },
          { id: "asrep_src_offplatform_02", sourceType: "rubric", label: "Investigation design rubric" },
          { id: "asrep_src_offplatform_03", sourceType: "teacher_note", label: "Teacher review note" },
        ],
        generatedAt: isoDaysFrom(offPlatformAssessment.dueDate, 1),
        updatedAt: isoDaysFrom(offPlatformAssessment.dueDate, 2),
        releasedAt: isoDaysFrom(offPlatformAssessment.dueDate, 2),
      }
    );

    assessmentInsightSummaries.push({
      id: "asins_typed_offplatform",
      assessmentId: offPlatformAssessment.id,
      classId: offPlatformAssessment.classId,
      strengths: [
        "Most students documented the field methodology clearly.",
        "Evidence selection is improving across the class.",
      ],
      misconceptions: [
        "Several reports still describe patterns without evaluating the reliability of the sample.",
      ],
      reteachingSuggestions: [
        "Model one short paragraph on interpreting outliers before the next practical write-up.",
      ],
      submittedCount: 18,
      reviewedCount: 14,
      releasedCount: 9,
      generatedAt: isoDaysFrom(offPlatformAssessment.dueDate, 1),
      updatedAt: isoDaysFrom(offPlatformAssessment.dueDate, 2),
    });
  }

  if (offlineObservationAssessment) {
    grades.push({
      id: "grd_typed_offline_01",
      assessmentId: offlineObservationAssessment.id,
      studentId: "stu_01",
      classId: offlineObservationAssessment.classId,
      gradingMode: offlineObservationAssessment.gradingMode,
      submissionStatus: "submitted",
      gradingStatus: "ready",
      submittedAt: isoDaysFrom(offlineObservationAssessment.dueDate, 0),
      gradedAt: isoDaysFrom(offlineObservationAssessment.dueDate, 1),
      feedback:
        "You communicated the procedure confidently during the practical conference and responded well to follow-up questions.",
      checklistGradeResults: offlineObservationAssessment.checklist?.map((item, index) => ({
        itemId: item.id,
        status: index % 2 === 0 ? "met" : "not_yet",
      })),
    });

    assessmentInsightSummaries.push({
      id: "asins_typed_offline",
      assessmentId: offlineObservationAssessment.id,
      classId: offlineObservationAssessment.classId,
      strengths: [
        "Students are more confident describing field methods orally than in writing.",
      ],
      misconceptions: [
        "A few students still confuse observations with inferences during live conferencing.",
      ],
      reteachingSuggestions: [
        "Rehearse the difference between direct observations and conclusions before the next observation conference.",
      ],
      submittedCount: 21,
      reviewedCount: 21,
      releasedCount: 0,
      generatedAt: isoDaysFrom(offlineObservationAssessment.dueDate, 1),
      updatedAt: isoDaysFrom(offlineObservationAssessment.dueDate, 1),
    });
  }

  if (quizAssessment) {
    submissions.push({
      id: "sub_typed_quiz_01",
      assessmentId: quizAssessment.id,
      studentId: "stu_01",
      classId: quizAssessment.classId,
      assessmentType: "quiz",
      status: "draft",
      content: "Working draft of the systems check quiz.",
      attachments: [],
      typedPayload: {
        quiz: {
          questionCount: quizAssessment.quizConfig?.questions.length ?? 0,
          responses: [
            { questionId: "quiz_q_01", response: "Producer -> herbivore -> carnivore" },
            { questionId: "quiz_q_02", response: ["Energy", "Matter"] },
          ],
        },
      },
      draftSavedAt: isoDaysFrom(quizAssessment.dueDate, -1),
      isLate: false,
      createdAt: isoDaysFrom(quizAssessment.dueDate, -2),
      updatedAt: isoDaysFrom(quizAssessment.dueDate, -1),
    });

    assessmentReports.push({
      id: "asrep_typed_quiz_01",
      assessmentId: quizAssessment.id,
      studentId: "stu_01",
      classId: quizAssessment.classId,
      status: "ready",
      summary: "Draft quiz analysis prepared for teacher review.",
      strengths: ["Confident with ecosystem vocabulary and food-web reasoning."],
      weaknesses: ["Needs to double-check explanations of matter cycling."],
      suggestions: ["Review decomposer roles before the final submission."],
      rubricFeedback: [
        {
          criterionLabel: "Knowledge and understanding",
          levelLabel: "Developing",
          summary: "A solid start, but a few short-answer explanations still need precision.",
        },
      ],
      sourceAttribution: [
        { id: "asrep_src_quiz_01", sourceType: "submission", label: "Quiz draft response", sourceId: "sub_typed_quiz_01" },
      ],
      generatedAt: isoDaysFrom(quizAssessment.dueDate, -1),
      updatedAt: isoDaysFrom(quizAssessment.dueDate, -1),
    });

    assessmentInsightSummaries.push({
      id: "asins_typed_quiz",
      assessmentId: quizAssessment.id,
      classId: quizAssessment.classId,
      strengths: [
        "Most students can identify trophic levels accurately.",
      ],
      misconceptions: [
        "Matter cycling and energy loss are still being conflated in short-answer responses.",
      ],
      reteachingSuggestions: [
        "Revisit one systems diagram before releasing the quiz results.",
      ],
      submittedCount: 12,
      reviewedCount: 4,
      releasedCount: 0,
      generatedAt: isoDaysFrom(quizAssessment.dueDate, -1),
      updatedAt: isoDaysFrom(quizAssessment.dueDate, -1),
    });
  }

  if (chatAssessment) {
    submissions.push({
      id: "sub_typed_chat_01",
      assessmentId: chatAssessment.id,
      studentId: "stu_01",
      classId: chatAssessment.classId,
      assessmentType: "chat",
      status: "draft",
      content: "Conversation in progress.",
      attachments: [],
      typedPayload: {
        chat: {
          transcript: [
            {
              id: "chat_turn_01",
              role: "teacher",
              content: "Explain how an ecosystem responds when one species becomes invasive.",
              createdAt: isoDaysFrom(chatAssessment.dueDate, -2),
            },
            {
              id: "chat_turn_02",
              role: "student",
              content: "It can upset the food web because native organisms lose access to resources.",
              createdAt: isoDaysFrom(chatAssessment.dueDate, -2),
            },
          ],
          completionSummary: "Aarav has identified one core ecosystem interaction and is building out the explanation.",
        },
      },
      draftSavedAt: isoDaysFrom(chatAssessment.dueDate, -1),
      isLate: false,
      createdAt: isoDaysFrom(chatAssessment.dueDate, -2),
      updatedAt: isoDaysFrom(chatAssessment.dueDate, -1),
    });

    assessmentInsightSummaries.push({
      id: "asins_typed_chat",
      assessmentId: chatAssessment.id,
      classId: chatAssessment.classId,
      strengths: [
        "Students are verbally connecting cause-and-effect in ecosystems more fluently.",
      ],
      misconceptions: [
        "Some responses still describe impacts without naming the underlying system interaction.",
      ],
      reteachingSuggestions: [
        "Add one scaffold prompt about causal chains before the next live chat assessment.",
      ],
      submittedCount: 9,
      reviewedCount: 3,
      releasedCount: 0,
      generatedAt: isoDaysFrom(chatAssessment.dueDate, -1),
      updatedAt: isoDaysFrom(chatAssessment.dueDate, -1),
    });
  }

  if (essayAssessment) {
    submissions.push({
      id: "sub_typed_essay_01",
      assessmentId: essayAssessment.id,
      studentId: "stu_01",
      classId: essayAssessment.classId,
      assessmentType: "essay",
      status: "draft",
      content:
        "Opening paragraph for the scientific argument essay. I still need to finish the counter-argument section.",
      attachments: [],
      typedPayload: {
        essay: {
          prompt: essayAssessment.essayConfig?.prompt,
          body:
            "Human activity shifts ecosystem balance because changes in one population affect the availability of resources for other organisms. My claim is that invasive species create the fastest disruption because they alter multiple food-web relationships at once.",
          wordCount: 134,
          outline: ["Claim", "Evidence from wetland case study", "Counter-argument", "Conclusion"],
        },
      },
      draftSavedAt: isoDaysFrom(essayAssessment.dueDate, -1),
      isLate: false,
      createdAt: isoDaysFrom(essayAssessment.dueDate, -3),
      updatedAt: isoDaysFrom(essayAssessment.dueDate, -1),
    });

    assessmentInsightSummaries.push({
      id: "asins_typed_essay",
      assessmentId: essayAssessment.id,
      classId: essayAssessment.classId,
      strengths: [
        "Students are using stronger scientific vocabulary in argumentative writing.",
      ],
      misconceptions: [
        "Evidence is being cited, but counter-arguments remain underdeveloped.",
      ],
      reteachingSuggestions: [
        "Model one paragraph that integrates counter-argument and rebuttal before final submission.",
      ],
      submittedCount: 7,
      reviewedCount: 0,
      releasedCount: 0,
      generatedAt: isoDaysFrom(essayAssessment.dueDate, -1),
      updatedAt: isoDaysFrom(essayAssessment.dueDate, -1),
    });
  }

  return {
    overridePairs,
    submissions,
    grades,
    assessmentReports,
    assessmentInsightSummaries,
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
