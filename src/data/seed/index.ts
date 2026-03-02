import { format, subDays, addDays } from "date-fns";
import type { Class, TimetableSlot } from "@/types/class";
import type { Student, FamilyShareRecord } from "@/types/student";
import type { Assessment, LearningGoal, MYPCriterion, RubricCriterion, ChecklistItem } from "@/types/assessment";
import type { GradeRecord } from "@/types/gradebook";
import type { PortfolioArtifact } from "@/types/portfolio";
import type { AttendanceSession } from "@/types/attendance";
import type { Incident, SupportPlan, IncidentTaxonomy } from "@/types/incident";
import type { ReportCycle, Report, ReportTemplate, TranscriptYear } from "@/types/report";
import type { Channel, Announcement, NotificationSettings } from "@/types/communication";
import type { CalendarEvent } from "@/types/calendar";
import type { AttendanceStatus, MasteryLevel } from "@/types/common";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TODAY = new Date(2026, 1, 28); // 2026-02-28
const iso = (d: Date) => format(d, "yyyy-MM-dd");
const isoTime = (d: Date) => d.toISOString();
const pad = (n: number, len = 2) => String(n).padStart(len, "0");

const FIRST_NAMES = [
  "Aarav","Mei","Liam","Priya","Yuto","Sofia","Kwame","Ingrid","Mateo","Aisha",
  "Noah","Fatima","Hiroshi","Zara","Carlos","Amara","Ethan","Sakura","Kofi","Leila",
  "Hugo","Ananya","Lucas","Nia","Ravi","Emma","Tariq","Isla","Arjun","Chloe",
  "Soren","Devi","Felix","Yara","Omar","Mila","Kai","Sita","Leo","Hana",
  "Rohan","Freya","Idris","Luna","Marco","Nala","Theo","Maya","Amir","Rina",
  "Dante","Kira","Elio","Tara","Samir","Lena","Axel","Isha","Milan","Zoe",
];
const LAST_NAMES = [
  "Patel","Chen","Nakamura","Johansson","Garcia","Okafor","Kim","Larsen","Silva","Hassan",
  "Tanaka","Berg","Moreno","Osei","Park","Jensen","Costa","Al-Rashid","Yamamoto","Eriksen",
  "Gupta","Li","Sato","Andersen","Lopez","Mensah","Suzuki","Holm","Fernandez","Ibrahim",
  "Ito","Nygaard","Reyes","Boateng","Choi","Lund","Almeida","Khalil","Takahashi","Strand",
  "Sharma","Wang","Watanabe","Fischer","Torres","Asante","Lee","Bakker","Rojas","Youssef",
  "Reddy","Zhang","Hayashi","Mueller","Ruiz","Adu","Huang","Visser","Herrera","Nasser",
];
const LANGUAGES = ["en","en","en","en","es","fr","ja","hi","ko","zh","ar","de"];

// ---------------------------------------------------------------------------
// Stable ID generators
// ---------------------------------------------------------------------------
const stuId = (n: number) => `stu_${pad(n)}`;
const asmtId = (n: number) => `asmt_${pad(n)}`;
const gradeId = (aIdx: number, sIdx: number) => `grd_${pad(aIdx)}_${pad(sIdx)}`;
const artifactId = (n: number) => `art_${pad(n, 3)}`;
const attId = (cls: string, n: number) => `att_${cls}_${pad(n)}`;
const incId = (n: number) => `inc_${pad(n)}`;
const spId = (n: number) => `sp_${pad(n)}`;
const rptId = (n: number) => `rpt_${pad(n, 3)}`;
const chId = (n: number) => `ch_${pad(n)}`;
const annId = (n: number) => `ann_${pad(n)}`;
const calId = (n: number) => `cal_${pad(n, 3)}`;
const lgId = (n: number) => `lg_${pad(n)}`;

// ---------------------------------------------------------------------------
// Class IDs
// ---------------------------------------------------------------------------
const CLS_MYP_HR = "cls_myp_hr";
const CLS_MYP_SCI = "cls_myp_sci";
const CLS_DP_ENG = "cls_dp_eng";
// ---------------------------------------------------------------------------
// Generate data
// ---------------------------------------------------------------------------
export function generateSeedData() {
  // -----------------------------------------------------------------------
  // Learning Goals (15)
  // -----------------------------------------------------------------------
  const learningGoals: LearningGoal[] = [
    // 5 standards
    { id: lgId(1), code: "SCI.1", title: "Scientific inquiry and experimental design", subject: "Sciences", strand: "Inquiry", category: "standard" },
    { id: lgId(2), code: "SCI.2", title: "Data analysis and interpretation", subject: "Sciences", strand: "Processing", category: "standard" },
    { id: lgId(3), code: "ENG.1", title: "Textual analysis and critical reading", subject: "English", strand: "Reading", category: "standard" },
    { id: lgId(4), code: "ENG.2", title: "Effective written communication", subject: "English", strand: "Writing", category: "standard" },
    { id: lgId(5), code: "HR.1", title: "Interdisciplinary problem solving", subject: "Interdisciplinary", strand: "Synthesis", category: "standard" },
    // 5 ATL skills
    { id: lgId(6), code: "ATL.COM", title: "Communication skills", subject: "ATL", category: "atl_skill" },
    { id: lgId(7), code: "ATL.COL", title: "Collaboration skills", subject: "ATL", category: "atl_skill" },
    { id: lgId(8), code: "ATL.ORG", title: "Organisation skills", subject: "ATL", category: "atl_skill" },
    { id: lgId(9), code: "ATL.RES", title: "Research skills", subject: "ATL", category: "atl_skill" },
    { id: lgId(10), code: "ATL.THK", title: "Thinking skills", subject: "ATL", category: "atl_skill" },
    // 5 Learner profile
    { id: lgId(11), code: "LP.INQ", title: "Inquirers", subject: "Learner Profile", category: "learner_profile" },
    { id: lgId(12), code: "LP.KNW", title: "Knowledgeable", subject: "Learner Profile", category: "learner_profile" },
    { id: lgId(13), code: "LP.THK", title: "Thinkers", subject: "Learner Profile", category: "learner_profile" },
    { id: lgId(14), code: "LP.COM", title: "Communicators", subject: "Learner Profile", category: "learner_profile" },
    { id: lgId(15), code: "LP.RIS", title: "Risk-takers", subject: "Learner Profile", category: "learner_profile" },
  ];

  // -----------------------------------------------------------------------
  // Students (60)
  // -----------------------------------------------------------------------
  const students: Student[] = [];
  for (let i = 1; i <= 60; i++) {
    const idx = i - 1;
    // Students 1-25 => MYP HR + MYP SCI;  26-45 => MYP HR only;  46-60 => DP ENG
    let classIds: string[];
    if (i <= 25) classIds = [CLS_MYP_HR, CLS_MYP_SCI];
    else if (i <= 45) classIds = [CLS_MYP_HR];
    else classIds = [CLS_DP_ENG];

    const firstName = FIRST_NAMES[idx];
    const lastName = LAST_NAMES[idx];
    const gradeLevel = i <= 45 ? "Grade 10" : "Grade 12";
    const lang = LANGUAGES[idx % LANGUAGES.length];

    students.push({
      id: stuId(i),
      firstName,
      lastName,
      avatarUrl: `https://api.dicebear.com/9.x/thumbs/svg?seed=${firstName}${lastName}`,
      gradeLevel,
      classIds,
      parentEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.parent@example.com`,
      parentName: `${firstName === "Aarav" ? "Vikram" : firstName.charAt(0) + "."} ${lastName}`,
      preferredLanguage: lang,
      familyShareHistory: [],
    });
  }

  // Student ID arrays per class
  const mypHrStudentIds = students.filter(s => s.classIds.includes(CLS_MYP_HR)).map(s => s.id); // 45
  const mypSciStudentIds = students.filter(s => s.classIds.includes(CLS_MYP_SCI)).map(s => s.id); // 25
  const dpEngStudentIds = students.filter(s => s.classIds.includes(CLS_DP_ENG)).map(s => s.id); // 15

  // -----------------------------------------------------------------------
  // Classes (3)
  // -----------------------------------------------------------------------
  const scheduleSlot = (day: TimetableSlot["day"], start: string, end: string, room?: string): TimetableSlot => ({
    day, startTime: start, endTime: end, room,
  });

  const classes: Class[] = [
    {
      id: CLS_MYP_HR,
      name: "MYP 5 Homeroom 10A",
      subject: "Homeroom",
      gradeLevel: "Grade 10",
      type: "homeroom",
      programme: "MYP",
      studentIds: mypHrStudentIds,
      schedule: [
        scheduleSlot("mon", "08:00", "08:30", "Room 201"),
        scheduleSlot("wed", "08:00", "08:30", "Room 201"),
        scheduleSlot("fri", "08:00", "08:30", "Room 201"),
      ],
      academicYear: "2025-2026",
      term: "Term 2",
    },
    {
      id: CLS_MYP_SCI,
      name: "MYP 5 Sciences",
      subject: "Sciences",
      gradeLevel: "Grade 10",
      type: "subject",
      programme: "MYP",
      studentIds: mypSciStudentIds,
      schedule: [
        scheduleSlot("mon", "09:00", "10:00", "Lab 3"),
        scheduleSlot("tue", "11:00", "12:00", "Lab 3"),
        scheduleSlot("thu", "09:00", "10:00", "Lab 3"),
      ],
      academicYear: "2025-2026",
      term: "Term 2",
    },
    {
      id: CLS_DP_ENG,
      name: "DP English A: Language & Literature HL",
      subject: "English",
      gradeLevel: "Grade 12",
      type: "subject",
      programme: "DP",
      studentIds: dpEngStudentIds,
      schedule: [
        scheduleSlot("mon", "10:15", "11:45", "Room 305"),
        scheduleSlot("wed", "10:15", "11:45", "Room 305"),
        scheduleSlot("fri", "10:15", "11:45", "Room 305"),
      ],
      academicYear: "2025-2026",
      term: "Term 2",
    },
  ];

  // -----------------------------------------------------------------------
  // MYP Criteria (reusable)
  // -----------------------------------------------------------------------
  const mypSciCriteria: MYPCriterion[] = [
    { id: "myp_sci_a", criterion: "A", title: "Knowing and understanding", maxLevel: 8, strandDescriptors: ["Recall scientific knowledge", "Apply to solve problems"] },
    { id: "myp_sci_b", criterion: "B", title: "Inquiring and designing", maxLevel: 8, strandDescriptors: ["Formulate testable hypothesis", "Design scientific investigation"] },
    { id: "myp_sci_c", criterion: "C", title: "Processing and evaluating", maxLevel: 8, strandDescriptors: ["Collect and present data", "Interpret results and draw conclusions"] },
    { id: "myp_sci_d", criterion: "D", title: "Reflecting on the impacts of science", maxLevel: 8, strandDescriptors: ["Explain the connection between science and society", "Evaluate implications of scientific developments"] },
  ];

  // -----------------------------------------------------------------------
  // Rubric for homeroom assessments
  // -----------------------------------------------------------------------
  const hrRubric: RubricCriterion[] = [
    {
      id: "rub_hr_1", title: "Presentation Quality", weight: 50,
      levels: [
        { id: "rub_hr_1_l1", label: "Emerging", points: 1, description: "Presentation lacks structure" },
        { id: "rub_hr_1_l2", label: "Developing", points: 2, description: "Some structure present" },
        { id: "rub_hr_1_l3", label: "Proficient", points: 3, description: "Clear and organized" },
        { id: "rub_hr_1_l4", label: "Exemplary", points: 4, description: "Exceptionally polished" },
      ],
    },
    {
      id: "rub_hr_2", title: "Content Depth", weight: 50,
      levels: [
        { id: "rub_hr_2_l1", label: "Emerging", points: 1, description: "Surface-level understanding" },
        { id: "rub_hr_2_l2", label: "Developing", points: 2, description: "Some depth shown" },
        { id: "rub_hr_2_l3", label: "Proficient", points: 3, description: "Good analysis" },
        { id: "rub_hr_2_l4", label: "Exemplary", points: 4, description: "Outstanding insight" },
      ],
    },
  ];

  // -----------------------------------------------------------------------
  // Checklist
  // -----------------------------------------------------------------------
  const checklist: ChecklistItem[] = [
    { id: "chk_1", label: "Title page included", required: true },
    { id: "chk_2", label: "Bibliography attached", required: true },
    { id: "chk_3", label: "Word count met (800-1200)", required: true },
    { id: "chk_4", label: "Peer review completed", required: false },
    { id: "chk_5", label: "Reflection paragraph included", required: false },
  ];

  // -----------------------------------------------------------------------
  // Assessments (14)
  // -----------------------------------------------------------------------
  const assessmentConfigs: {
    title: string; desc: string; classId: string; mode: Assessment["gradingMode"];
    status: Assessment["status"]; dueDaysAgo: number; goalIds: string[];
    totalPoints?: number; rubric?: RubricCriterion[]; checklist?: ChecklistItem[];
    standardIds?: string[]; mypCriteria?: MYPCriterion[];
  }[] = [
    // MYP HR (4 assessments) - rubric & standards
    { title: "Personal Project Proposal", desc: "Write a proposal for your MYP Personal Project.", classId: CLS_MYP_HR, mode: "rubric", status: "published", dueDaysAgo: 30, goalIds: [lgId(5), lgId(6)], rubric: hrRubric },
    { title: "Community Service Reflection", desc: "Reflect on your community service experience.", classId: CLS_MYP_HR, mode: "rubric", status: "published", dueDaysAgo: 20, goalIds: [lgId(5), lgId(14)], rubric: hrRubric },
    { title: "ATL Skills Self-Assessment", desc: "Complete the ATL skills self-assessment form.", classId: CLS_MYP_HR, mode: "standards", status: "published", dueDaysAgo: 14, goalIds: [lgId(6), lgId(7), lgId(8)], standardIds: [lgId(6), lgId(7), lgId(8)] },
    { title: "Term 2 Learning Portfolio", desc: "Curate your best work samples for Term 2.", classId: CLS_MYP_HR, mode: "rubric", status: "draft", dueDaysAgo: -7, goalIds: [lgId(5), lgId(8)], rubric: hrRubric },

    // MYP SCI (5 assessments) - myp_criteria
    { title: "Ecology Lab Report", desc: "Investigate the effect of pH on plant growth.", classId: CLS_MYP_SCI, mode: "myp_criteria", status: "published", dueDaysAgo: 35, goalIds: [lgId(1), lgId(2)], mypCriteria: mypSciCriteria },
    { title: "Chemistry Unit Test", desc: "End-of-unit assessment on atomic structure.", classId: CLS_MYP_SCI, mode: "score", status: "published", dueDaysAgo: 25, goalIds: [lgId(1)], totalPoints: 50 },
    { title: "Scientific Investigation: Osmosis", desc: "Design and conduct an experiment on osmosis.", classId: CLS_MYP_SCI, mode: "myp_criteria", status: "published", dueDaysAgo: 15, goalIds: [lgId(1), lgId(2), lgId(9)], mypCriteria: mypSciCriteria },
    { title: "Physics Problem Set", desc: "Complete problems on forces and motion.", classId: CLS_MYP_SCI, mode: "score", status: "published", dueDaysAgo: 7, goalIds: [lgId(1)], totalPoints: 40 },
    { title: "IDU Collaboration Reflection", desc: "Reflect on the interdisciplinary unit collaboration.", classId: CLS_MYP_SCI, mode: "myp_criteria", status: "draft", dueDaysAgo: -5, goalIds: [lgId(1), lgId(7), lgId(10)], mypCriteria: mypSciCriteria },

    // DP ENG (5 assessments) - dp_scale & score
    { title: "Paper 1: Guided Textual Analysis", desc: "Unseen text analysis under timed conditions.", classId: CLS_DP_ENG, mode: "dp_scale", status: "published", dueDaysAgo: 32, goalIds: [lgId(3), lgId(4)] },
    { title: "Individual Oral Commentary", desc: "15-minute oral commentary on studied work.", classId: CLS_DP_ENG, mode: "dp_scale", status: "published", dueDaysAgo: 22, goalIds: [lgId(3), lgId(14)] },
    { title: "Written Task 1: Creative Response", desc: "Creative writing based on studied text.", classId: CLS_DP_ENG, mode: "score", status: "published", dueDaysAgo: 12, goalIds: [lgId(4), lgId(6)], totalPoints: 30, checklist },
    { title: "Comparative Essay Draft", desc: "Compare two works from the reading list.", classId: CLS_DP_ENG, mode: "dp_scale", status: "published", dueDaysAgo: 4, goalIds: [lgId(3), lgId(4), lgId(10)] },
    { title: "HL Essay Outline", desc: "Submit the outline for your HL extended essay.", classId: CLS_DP_ENG, mode: "score", status: "draft", dueDaysAgo: -10, goalIds: [lgId(4), lgId(9)], totalPoints: 20 },
  ];

  let publishedAsmtCount = 0;
  const assessments: Assessment[] = assessmentConfigs.map((cfg, idx) => {
    const i = idx + 1;
    const dueDate = iso(subDays(TODAY, cfg.dueDaysAgo));
    const isPublished = cfg.status === "published";
    if (isPublished) publishedAsmtCount++;
    return {
      id: asmtId(i),
      title: cfg.title,
      description: cfg.desc,
      classId: cfg.classId,
      gradingMode: cfg.mode,
      status: cfg.status,
      dueDate,
      createdAt: isoTime(subDays(TODAY, cfg.dueDaysAgo + 7)),
      totalPoints: cfg.totalPoints,
      rubric: cfg.rubric,
      checklist: cfg.checklist,
      standardIds: cfg.standardIds,
      learningGoalIds: cfg.goalIds,
      distributedAt: isPublished ? isoTime(subDays(TODAY, cfg.dueDaysAgo + 5)) : undefined,
      linkedAnnouncementId: isPublished ? annId(publishedAsmtCount) : undefined,
      mypCriteria: cfg.mypCriteria,
    };
  });

  // -----------------------------------------------------------------------
  // Student-to-class mapping helpers
  // -----------------------------------------------------------------------
  const studentsForClass = (classId: string): string[] => {
    if (classId === CLS_MYP_HR) return mypHrStudentIds;
    if (classId === CLS_MYP_SCI) return mypSciStudentIds;
    return dpEngStudentIds;
  };

  // -----------------------------------------------------------------------
  // Grade Records
  // -----------------------------------------------------------------------
  const masteryLevels: MasteryLevel[] = ["exceeding", "meeting", "approaching", "beginning"];
  const feedbackPhrases = [
    "Great work demonstrating your understanding.",
    "Good effort, keep refining your analysis.",
    "Solid progress; focus on providing more evidence.",
    "Shows potential; needs more detailed explanations.",
    "Excellent critical thinking demonstrated here.",
  ];

  const grades: GradeRecord[] = [];
  assessments.forEach((asmt, aIdx) => {
    if (asmt.status === "draft") return; // no grades for draft assessments
    const sIds = studentsForClass(asmt.classId);
    sIds.forEach((sid, sIdx) => {
      const isMissing = sIdx % 17 === 0 && sIdx > 0; // roughly 1 missing per assessment
      const seedVal = (aIdx * 100 + sIdx) % 100;
      const grade: GradeRecord = {
        id: gradeId(aIdx + 1, sIdx + 1),
        assessmentId: asmt.id,
        studentId: sid,
        classId: asmt.classId,
        gradingMode: asmt.gradingMode,
        isMissing,
        feedback: isMissing ? undefined : feedbackPhrases[sIdx % feedbackPhrases.length],
        submittedAt: isMissing ? undefined : isoTime(subDays(TODAY, (assessmentConfigs[aIdx].dueDaysAgo || 1) + 1)),
        gradedAt: isMissing ? undefined : isoTime(subDays(TODAY, (assessmentConfigs[aIdx].dueDaysAgo || 1) - 1)),
      };

      if (isMissing) {
        grades.push(grade);
        return;
      }

      switch (asmt.gradingMode) {
        case "score":
          grade.score = Math.round((asmt.totalPoints || 50) * (0.55 + (seedVal % 45) / 100));
          grade.totalPoints = asmt.totalPoints;
          break;
        case "rubric":
          grade.rubricScores = (asmt.rubric || []).map(crit => {
            const lvlIdx = (sIdx + aIdx) % crit.levels.length;
            const lvl = crit.levels[Math.min(lvlIdx, crit.levels.length - 1)];
            return { criterionId: crit.id, levelId: lvl.id, points: lvl.points };
          });
          break;
        case "standards":
          grade.standardsMastery = (asmt.standardIds || []).map(stdId => ({
            standardId: stdId,
            level: masteryLevels[(sIdx + aIdx) % masteryLevels.length],
          }));
          break;
        case "myp_criteria":
          grade.mypCriteriaScores = (asmt.mypCriteria || []).map(c => ({
            criterionId: c.id,
            criterion: c.criterion,
            level: Math.min(1 + ((sIdx + aIdx) % 7), c.maxLevel),
          }));
          break;
        case "dp_scale":
          grade.dpGrade = 1 + ((seedVal + sIdx) % 7); // 1-7
          break;
      }

      if (asmt.checklist) {
        grade.checklistResults = asmt.checklist.map((item, ci) => ({
          itemId: item.id,
          checked: ci < 3 || sIdx % 3 !== 0,
        }));
      }

      grades.push(grade);
    });
  });

  // -----------------------------------------------------------------------
  // Portfolio Artifacts (~100)
  // -----------------------------------------------------------------------
  const mediaTypes: PortfolioArtifact["mediaType"][] = ["image", "video", "document", "audio", "link"];
  const approvalStatuses: PortfolioArtifact["approvalStatus"][] = ["approved", "approved", "approved", "pending", "needs_revision"];
  const artifactTitles = [
    "Lab experiment photo", "Essay draft", "Science poster", "Oral presentation recording",
    "Research notes", "Creative writing piece", "Graph analysis screenshot", "Field trip reflection",
    "Peer review document", "Personal project sketch", "Video explanation", "Annotated bibliography",
    "Concept map", "Data visualization", "Class collaboration photo",
  ];

  const artifacts: PortfolioArtifact[] = [];
  let artCount = 0;
  // Distribute ~100 artifacts across students and classes
  for (let round = 0; round < 2; round++) {
    for (const cls of classes) {
      const sIds = studentsForClass(cls.id);
      const perStudent = cls.id === CLS_DP_ENG ? 3 : 2; // DP students get 3, MYP get 2
      for (let si = 0; si < Math.min(sIds.length, cls.id === CLS_MYP_HR ? 20 : sIds.length); si++) {
        if (artCount >= 100) break;
        for (let p = 0; p < perStudent && artCount < 100; p++) {
          artCount++;
          const daysAgo = 3 + (artCount % 35);
          const approvalStatus = approvalStatuses[artCount % approvalStatuses.length];
          const hasReflection = artCount % 3 !== 0;
          const artifact: PortfolioArtifact = {
            id: artifactId(artCount),
            studentId: sIds[si],
            classId: cls.id,
            title: `${artifactTitles[artCount % artifactTitles.length]} #${artCount}`,
            description: `Student work sample demonstrating progress in ${cls.subject}.`,
            mediaType: mediaTypes[artCount % mediaTypes.length],
            mediaUrl: `https://storage.example.com/artifacts/${artifactId(artCount)}.${mediaTypes[artCount % mediaTypes.length] === "image" ? "jpg" : "pdf"}`,
            thumbnailUrl: artCount % 4 === 0 ? undefined : `https://storage.example.com/thumbs/${artifactId(artCount)}.jpg`,
            learningGoalIds: [learningGoals[(artCount - 1) % learningGoals.length].id],
            reflection: hasReflection ? {
              text: "I learned a lot working on this piece. I improved my understanding of the topic and developed new skills.",
              submittedAt: isoTime(subDays(TODAY, daysAgo - 1)),
              teacherComment: approvalStatus === "approved" ? "Well done! Your reflection shows good self-awareness." : undefined,
              teacherCommentAt: approvalStatus === "approved" ? isoTime(subDays(TODAY, daysAgo - 2)) : undefined,
            } : undefined,
            approvalStatus,
            familyShareStatus: approvalStatus === "approved" && artCount % 3 === 0 ? "shared" : "not_shared",
            createdBy: artCount % 5 === 0 ? "teacher" : "student",
            createdAt: isoTime(subDays(TODAY, daysAgo)),
            updatedAt: isoTime(subDays(TODAY, daysAgo - 1)),
            isReportEligible: approvalStatus === "approved",
            linkedReportId: undefined,
          };
          artifacts.push(artifact);
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Attendance Sessions (~90 = 30 per class across 6 weeks)
  // -----------------------------------------------------------------------
  const attendanceSessions: AttendanceSession[] = [];
  const scheduleDays: Record<string, TimetableSlot["day"][]> = {
    [CLS_MYP_HR]: ["mon", "wed", "fri"],
    [CLS_MYP_SCI]: ["mon", "tue", "thu"],
    [CLS_DP_ENG]: ["mon", "wed", "fri"],
  };
  const dayToNum: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 };

  for (const cls of classes) {
    const sIds = studentsForClass(cls.id);
    const days = scheduleDays[cls.id];
    let sessionCount = 0;
    // Go back 6 weeks (42 days) and generate sessions for matching days
    for (let d = 42; d >= 0 && sessionCount < 30; d--) {
      const date = subDays(TODAY, d);
      const dayOfWeek = date.getDay(); // 0=Sun..6=Sat
      const matchDay = days.find(dn => dayToNum[dn] === dayOfWeek);
      if (!matchDay) continue;
      sessionCount++;

      const records = sIds.map((sid, si) => {
        const statusSeed = (sessionCount * 7 + si) % 20;
        let status: AttendanceStatus = "present";
        if (statusSeed === 0) status = "absent";
        else if (statusSeed === 1) status = "late";
        else if (statusSeed === 2) status = "excused";
        return {
          studentId: sid,
          status,
          note: status === "excused" ? "Parent notified" : status === "absent" ? "No notification received" : undefined,
          arrivedAt: status === "late" ? isoTime(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 15)) : undefined,
        };
      });

      attendanceSessions.push({
        id: attId(cls.id.replace("cls_", ""), sessionCount),
        classId: cls.id,
        date: iso(date),
        records,
        completedAt: isoTime(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0)),
      });
    }
  }

  // -----------------------------------------------------------------------
  // Incidents (10)
  // -----------------------------------------------------------------------
  const taxonomy: IncidentTaxonomy = {
    categories: ["Behavioural", "Academic Integrity", "Attendance", "Wellbeing", "Safety", "Technology Misuse"],
    tags: ["recurring", "parent-contacted", "counsellor-involved", "peer-conflict", "self-harm-risk", "resolved-informally", "formal-warning", "restorative"],
  };

  const incidentData = [
    { stu: 3, cls: CLS_MYP_HR, title: "Disruptive behaviour in homeroom", cat: "Behavioural", sev: "medium" as const, tags: ["recurring"], status: "in_progress" as const },
    { stu: 7, cls: CLS_MYP_SCI, title: "Lab safety violation", cat: "Safety", sev: "high" as const, tags: ["formal-warning"], status: "resolved" as const },
    { stu: 12, cls: CLS_MYP_HR, title: "Persistent tardiness", cat: "Attendance", sev: "low" as const, tags: ["recurring", "parent-contacted"], status: "in_progress" as const },
    { stu: 5, cls: CLS_MYP_SCI, title: "Suspected plagiarism on lab report", cat: "Academic Integrity", sev: "high" as const, tags: ["formal-warning"], status: "open" as const },
    { stu: 48, cls: CLS_DP_ENG, title: "Anxiety affecting participation", cat: "Wellbeing", sev: "medium" as const, tags: ["counsellor-involved"], status: "in_progress" as const },
    { stu: 20, cls: CLS_MYP_HR, title: "Peer conflict during group work", cat: "Behavioural", sev: "medium" as const, tags: ["peer-conflict", "restorative"], status: "resolved" as const },
    { stu: 50, cls: CLS_DP_ENG, title: "Missed multiple deadlines", cat: "Attendance", sev: "low" as const, tags: ["parent-contacted"], status: "open" as const },
    { stu: 15, cls: CLS_MYP_SCI, title: "Phone use during practical", cat: "Technology Misuse", sev: "low" as const, tags: ["resolved-informally"], status: "resolved" as const },
    { stu: 3, cls: CLS_MYP_SCI, title: "Verbal altercation with peer", cat: "Behavioural", sev: "high" as const, tags: ["peer-conflict", "formal-warning"], status: "in_progress" as const },
    { stu: 48, cls: CLS_DP_ENG, title: "Requested wellbeing check-in", cat: "Wellbeing", sev: "medium" as const, tags: ["counsellor-involved", "parent-contacted"], status: "open" as const },
  ];

  const incidents: Incident[] = incidentData.map((d, i) => ({
    id: incId(i + 1),
    studentId: stuId(d.stu),
    classId: d.cls,
    title: d.title,
    description: `${d.title}. Reported during scheduled class time. Further details documented below.`,
    category: d.cat,
    tags: d.tags,
    severity: d.sev,
    reportedBy: "Ms. Mitchell",
    reportedAt: isoTime(subDays(TODAY, 40 - i * 4)),
    collaboratorNames: i % 3 === 0 ? ["Mr. Thompson", "School Counsellor"] : [],
    followUps: d.status !== "open" ? [
      {
        id: `fu_${pad(i + 1)}_1`,
        note: `Initial follow-up: Spoke with ${students.find(s => s.id === stuId(d.stu))?.firstName || "student"} about the situation.`,
        createdAt: isoTime(subDays(TODAY, 38 - i * 4)),
        createdBy: "Ms. Mitchell",
      },
      ...(d.status === "resolved" ? [{
        id: `fu_${pad(i + 1)}_2`,
        note: "Issue resolved after meeting with student and parent. Action plan agreed.",
        createdAt: isoTime(subDays(TODAY, 35 - i * 4)),
        createdBy: "Ms. Mitchell",
        linkedCalendarEventId: calId(50 + i),
      }] : []),
    ] : [],
    status: d.status,
  }));

  // -----------------------------------------------------------------------
  // Support Plans (4)
  // -----------------------------------------------------------------------
  const supportPlans: SupportPlan[] = [
    {
      id: spId(1),
      studentId: stuId(3),
      title: "Behaviour Support Plan for Liam",
      description: "Structured plan to address recurring behavioural incidents and improve classroom engagement.",
      nextCheckIn: iso(addDays(TODAY, 7)),
      notes: ["Initial meeting with parent completed", "Weekly check-ins scheduled", "Positive reinforcement strategy in place"],
      status: "active",
      incidentIds: [incId(1), incId(9)],
      createdAt: isoTime(subDays(TODAY, 30)),
    },
    {
      id: spId(2),
      studentId: stuId(48),
      title: "Wellbeing Support Plan for Rina",
      description: "Support plan coordinated with school counsellor to address anxiety and improve participation.",
      nextCheckIn: iso(addDays(TODAY, 5)),
      notes: ["Counsellor sessions twice weekly", "Modified participation expectations", "Parent updated weekly"],
      status: "active",
      incidentIds: [incId(5), incId(10)],
      createdAt: isoTime(subDays(TODAY, 25)),
    },
    {
      id: spId(3),
      studentId: stuId(5),
      title: "Academic Integrity Plan for Yuto",
      description: "Plan to support academic integrity awareness and proper citation skills.",
      nextCheckIn: iso(addDays(TODAY, 14)),
      notes: ["Completed academic integrity workshop", "Resubmission of lab report in progress"],
      status: "active",
      incidentIds: [incId(4)],
      createdAt: isoTime(subDays(TODAY, 20)),
    },
    {
      id: spId(4),
      studentId: stuId(20),
      title: "Conflict Resolution Plan for Aisha",
      description: "Restorative practice plan following peer conflict during group work.",
      nextCheckIn: iso(subDays(TODAY, 5)),
      notes: ["Restorative conference completed", "Both students agreed to action plan", "Follow-up confirmed resolution"],
      status: "completed",
      incidentIds: [incId(6)],
      createdAt: isoTime(subDays(TODAY, 35)),
    },
  ];

  // -----------------------------------------------------------------------
  // Report Templates (3)
  // -----------------------------------------------------------------------
  const reportTemplates: ReportTemplate[] = [
    {
      id: "tmpl_myp_hr",
      name: "MYP Homeroom Report",
      description: "Standard report template for MYP homeroom classes",
      programme: "MYP",
      sections: [
        { id: "sec_hr_1", type: "attendance", label: "Attendance Summary", required: true, order: 1 },
        { id: "sec_hr_2", type: "learning_goals", label: "ATL Skills Progress", required: true, order: 2 },
        { id: "sec_hr_3", type: "portfolio", label: "Portfolio Highlights", required: false, order: 3 },
        { id: "sec_hr_4", type: "teacher_comment", label: "Homeroom Teacher Comment", required: true, order: 4 },
      ],
    },
    {
      id: "tmpl_myp_subj",
      name: "MYP Subject Report",
      description: "Standard report template for MYP subject classes",
      programme: "MYP",
      sections: [
        { id: "sec_ms_1", type: "myp_criteria", label: "MYP Criteria Achievement", required: true, order: 1 },
        { id: "sec_ms_2", type: "attendance", label: "Attendance Summary", required: true, order: 2 },
        { id: "sec_ms_3", type: "atl_skills", label: "ATL Skills", required: true, order: 3 },
        { id: "sec_ms_4", type: "portfolio", label: "Selected Work Samples", required: false, order: 4 },
        { id: "sec_ms_5", type: "teacher_comment", label: "Subject Teacher Comment", required: true, order: 5 },
      ],
    },
    {
      id: "tmpl_dp",
      name: "DP Subject Report",
      description: "Standard report template for Diploma Programme subject classes",
      programme: "DP",
      sections: [
        { id: "sec_dp_1", type: "dp_grades", label: "DP Grade Summary", required: true, order: 1 },
        { id: "sec_dp_2", type: "attendance", label: "Attendance Summary", required: true, order: 2 },
        { id: "sec_dp_3", type: "portfolio", label: "Key Submissions", required: false, order: 3 },
        { id: "sec_dp_4", type: "teacher_comment", label: "Teacher Comment", required: true, order: 4 },
      ],
    },
  ];

  // -----------------------------------------------------------------------
  // Report Cycles (2)
  // -----------------------------------------------------------------------
  const reportCycles: ReportCycle[] = [
    {
      id: "rc_t1",
      name: "Term 1 Reports 2025-2026",
      term: "Term 1",
      academicYear: "2025-2026",
      startDate: "2025-08-25",
      endDate: "2025-12-15",
      templateId: undefined,
      classIds: [CLS_MYP_HR, CLS_MYP_SCI, CLS_DP_ENG],
      status: "closed",
    },
    {
      id: "rc_t2",
      name: "Term 2 Reports 2025-2026",
      term: "Term 2",
      academicYear: "2025-2026",
      startDate: "2026-01-12",
      endDate: "2026-03-20",
      templateId: undefined,
      classIds: [CLS_MYP_HR, CLS_MYP_SCI, CLS_DP_ENG],
      status: "open",
    },
  ];

  // -----------------------------------------------------------------------
  // Reports - one per student per cycle per class they belong to
  // -----------------------------------------------------------------------
  const reports: Report[] = [];
  let rptCount = 0;

  const teacherComments = [
    "Has shown consistent effort and growth this term.",
    "Demonstrates strong understanding and actively participates.",
    "A dedicated learner who takes initiative in collaborative tasks.",
    "Continues to develop skills and meet expectations.",
    "Has made excellent progress and shows strong potential.",
  ];

  for (const cycle of reportCycles) {
    for (const clsId of cycle.classIds) {
      const cls = classes.find(c => c.id === clsId)!;
      const tmplId = cls.programme === "DP" ? "tmpl_dp" : cls.type === "homeroom" ? "tmpl_myp_hr" : "tmpl_myp_subj";
      const template = reportTemplates.find(t => t.id === tmplId)!;
      const sIds = studentsForClass(clsId);

      for (const sid of sIds) {
        rptCount++;
        const isClosed = cycle.status === "closed";
        reports.push({
          id: rptId(rptCount),
          cycleId: cycle.id,
          studentId: sid,
          classId: clsId,
          templateId: tmplId,
          sections: template.sections.map(sec => ({
            configId: sec.id,
            type: sec.type,
            label: sec.label,
            order: sec.order,
            content: sec.type === "teacher_comment"
              ? { text: teacherComments[rptCount % teacherComments.length] }
              : sec.type === "attendance"
              ? { present: 25 + (rptCount % 5), absent: rptCount % 3, late: rptCount % 2, total: 30 }
              : {},
          })),
          publishState: isClosed ? "published" : "draft",
          distributionStatus: isClosed ? "completed" : "not_started",
          publishedAt: isClosed ? "2025-12-18T10:00:00.000Z" : undefined,
          distributedAt: isClosed ? "2025-12-19T08:00:00.000Z" : undefined,
        });
      }
    }
  }

  // -----------------------------------------------------------------------
  // Transcripts - one per student (based on closed cycles)
  // -----------------------------------------------------------------------
  const transcripts: Record<string, TranscriptYear[]> = {};
  for (const student of students) {
    // Derive grades from actual GradeRecord data
    const deriveGradeForClass = (classId: string): string => {
      const cls = classes.find(c => c.id === classId);
      if (!cls) return "-";
      const classGrades = grades.filter(g => g.studentId === student.id && g.classId === classId && !g.isMissing);
      if (classGrades.length === 0) return "-";

      if (cls.programme === "DP") {
        const dpGrades = classGrades.filter(g => g.dpGrade != null);
        if (dpGrades.length > 0) {
          const avg = dpGrades.reduce((s, g) => s + (g.dpGrade || 0), 0) / dpGrades.length;
          return `${Math.round(avg)}`;
        }
        const scoreGrades = classGrades.filter(g => g.score != null);
        if (scoreGrades.length > 0) {
          const asmts = assessments.filter(a => a.classId === classId);
          const pcts = scoreGrades.map(g => {
            const a = asmts.find(a2 => a2.id === g.assessmentId);
            return a?.totalPoints ? (g.score! / a.totalPoints) * 7 : g.score! / 100 * 7;
          });
          return `${Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)}`;
        }
        return "-";
      }

      // MYP: derive descriptor from criteria averages
      const mypGrades = classGrades.filter(g => g.mypCriteriaScores?.length);
      if (mypGrades.length > 0) {
        const allAssessed = mypGrades.flatMap(g => (g.mypCriteriaScores || []).filter(c => c.level > 0));
        if (allAssessed.length === 0) return "-";
        const avg = allAssessed.reduce((s, c) => s + c.level, 0) / allAssessed.length;
        if (avg >= 7) return "Exceeding";
        if (avg >= 5) return "Meeting";
        if (avg >= 3) return "Approaching";
        return "Beginning";
      }

      const scoreGrades = classGrades.filter(g => g.score != null);
      if (scoreGrades.length > 0) {
        const asmts = assessments.filter(a => a.classId === classId);
        const pcts = scoreGrades.map(g => {
          const a = asmts.find(a2 => a2.id === g.assessmentId);
          return a?.totalPoints ? (g.score! / a.totalPoints) * 100 : g.score!;
        });
        const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
        if (avg >= 85) return "Exceeding";
        if (avg >= 65) return "Meeting";
        if (avg >= 45) return "Approaching";
        return "Beginning";
      }
      return "-";
    };

    const studentNum = parseInt(student.id.replace("stu_", ""));
    const years: TranscriptYear[] = [
      {
        academicYear: "2025-2026",
        terms: [
          {
            term: "Term 1",
            subjects: student.classIds.map(cid => {
              const cls = classes.find(c => c.id === cid)!;
              return {
                subject: cls.subject,
                grade: deriveGradeForClass(cid),
                comments: teacherComments[studentNum % teacherComments.length],
              };
            }),
            attendance: { present: 26 + (studentNum % 4), absent: studentNum % 3, late: studentNum % 2, total: 30 },
          },
          {
            term: "Term 2",
            subjects: student.classIds.map(cid => {
              const cls = classes.find(c => c.id === cid)!;
              return {
                subject: cls.subject,
                grade: deriveGradeForClass(cid),
                comments: teacherComments[(studentNum + 1) % teacherComments.length],
              };
            }),
            attendance: { present: 24 + (studentNum % 5), absent: 1 + (studentNum % 3), late: studentNum % 2, total: 28 },
          },
        ],
      },
    ];
    transcripts[student.id] = years;
  }

  // -----------------------------------------------------------------------
  // Golden Records - 7 students with family share history
  // -----------------------------------------------------------------------
  const goldenStudentIds = [stuId(1), stuId(3), stuId(5), stuId(12), stuId(25), stuId(48), stuId(50)];
  for (const gid of goldenStudentIds) {
    const student = students.find(s => s.id === gid)!;
    const shares: FamilyShareRecord[] = [
      {
        id: `fsh_${gid}_1`,
        type: "report",
        referenceId: reports.find(r => r.studentId === gid && r.cycleId === "rc_t1")?.id || rptId(1),
        sharedAt: "2025-12-19T08:00:00.000Z",
        status: "viewed",
        viewedAt: "2025-12-20T14:30:00.000Z",
      },
      {
        id: `fsh_${gid}_2`,
        type: "portfolio",
        referenceId: artifacts.find(a => a.studentId === gid)?.id || artifactId(1),
        sharedAt: isoTime(subDays(TODAY, 10)),
        status: "shared",
      },
    ];
    student.familyShareHistory = shares;
  }

  // -----------------------------------------------------------------------
  // Channels (9 = 3 per class)
  // -----------------------------------------------------------------------
  const channelTypes: Channel["type"][] = ["general", "announcements", "assignments"];
  const channels: Channel[] = [];
  let chCount = 0;
  for (const cls of classes) {
    for (const chType of channelTypes) {
      chCount++;
      channels.push({
        id: chId(chCount),
        classId: cls.id,
        name: `${cls.name} - ${chType.charAt(0).toUpperCase() + chType.slice(1)}`,
        type: chType,
        createdAt: "2025-08-20T09:00:00.000Z",
      });
    }
  }

  // -----------------------------------------------------------------------
  // Announcements (14 - one linked per published assessment + extras)
  // -----------------------------------------------------------------------
  const announcements: Announcement[] = [];
  let annCount = 0;

  // Assessment-linked announcements
  assessments.forEach((asmt, idx) => {
    if (asmt.status !== "published") return;
    annCount++;
    const cls = classes.find(c => c.id === asmt.classId)!;
    const announcementChannel = channels.find(c => c.classId === asmt.classId && c.type === "assignments")!;
    announcements.push({
      id: annId(annCount),
      channelId: announcementChannel.id,
      classId: asmt.classId,
      title: `New Assessment: ${asmt.title}`,
      body: `A new assessment "${asmt.title}" has been published. Due date: ${asmt.dueDate}. Please check the assessment details for requirements.`,
      attachments: [
        { id: `att_ann_${annCount}_1`, type: "assessment", referenceId: asmt.id, label: asmt.title },
      ],
      status: "sent",
      sentAt: asmt.distributedAt,
      createdAt: asmt.distributedAt || asmt.createdAt,
      threadReplies: annCount % 3 === 0 ? [
        { id: `tr_${annCount}_1`, authorName: "Ms. Mitchell", body: "Reminder: please ask questions early if you need clarification.", createdAt: isoTime(subDays(TODAY, 10)) },
      ] : [],
    });
  });

  // Extra general announcements
  const extraAnnouncements = [
    { cls: CLS_MYP_HR, title: "Field Trip Permission Slips", body: "Please return signed permission slips for the upcoming field trip by Friday." },
    { cls: CLS_MYP_SCI, title: "Lab Safety Refresher", body: "All students must complete the lab safety quiz before next Monday." },
    { cls: CLS_DP_ENG, title: "Reading List Update", body: "The comparative essay reading list has been updated. Please check the new selections." },
  ];

  for (const extra of extraAnnouncements) {
    annCount++;
    const generalChannel = channels.find(c => c.classId === extra.cls && c.type === "general")!;
    announcements.push({
      id: annId(annCount),
      channelId: generalChannel.id,
      classId: extra.cls,
      title: extra.title,
      body: extra.body,
      attachments: [],
      status: "sent",
      sentAt: isoTime(subDays(TODAY, annCount)),
      createdAt: isoTime(subDays(TODAY, annCount + 1)),
      threadReplies: [],
    });
  }

  // -----------------------------------------------------------------------
  // Notification Settings
  // -----------------------------------------------------------------------
  const notificationSettings: NotificationSettings = {
    announcements: true,
    assignments: true,
    grades: true,
    attendance: true,
    incidents: true,
  };

  // -----------------------------------------------------------------------
  // Calendar Events
  // -----------------------------------------------------------------------
  const calendarEvents: CalendarEvent[] = [];
  let calCount = 0;

  // Weekly recurring class sessions (current week only for calendar view)
  for (const cls of classes) {
    for (const slot of cls.schedule) {
      calCount++;
      const dayNum = dayToNum[slot.day];
      // Current week: find the date for this day
      const currentWeekStart = subDays(TODAY, TODAY.getDay() === 0 ? 6 : TODAY.getDay() - 1); // Monday
      const slotDate = addDays(currentWeekStart, dayNum - 1);
      const [sh, sm] = slot.startTime.split(":").map(Number);
      const [eh, em] = slot.endTime.split(":").map(Number);
      calendarEvents.push({
        id: calId(calCount),
        title: cls.name,
        description: `Regular ${cls.subject} session`,
        type: "class",
        classId: cls.id,
        startTime: new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), sh, sm).toISOString(),
        endTime: new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), eh, em).toISOString(),
        isAllDay: false,
        recurrence: "weekly",
      });
    }
  }

  // Assessment deadlines
  assessments.forEach((asmt) => {
    calCount++;
    const dueDate = new Date(asmt.dueDate + "T23:59:00.000Z");
    calendarEvents.push({
      id: calId(calCount),
      title: `Due: ${asmt.title}`,
      description: asmt.description,
      type: "deadline",
      classId: asmt.classId,
      startTime: dueDate.toISOString(),
      endTime: dueDate.toISOString(),
      isAllDay: true,
      linkedAssessmentId: asmt.id,
    });
  });

  // Report cycle deadlines
  for (const cycle of reportCycles) {
    calCount++;
    calendarEvents.push({
      id: calId(calCount),
      title: `${cycle.name} - Submission Deadline`,
      description: `Final date for submitting ${cycle.name}.`,
      type: "deadline",
      startTime: new Date(cycle.endDate + "T23:59:00.000Z").toISOString(),
      endTime: new Date(cycle.endDate + "T23:59:00.000Z").toISOString(),
      isAllDay: true,
      linkedReportCycleId: cycle.id,
    });
  }

  // Meetings & video calls
  const meetingEvents: Omit<CalendarEvent, "id">[] = [
    {
      title: "Parent-Teacher Conference: Liam Nakamura",
      description: "Discuss behaviour support plan progress.",
      type: "meeting",
      classId: CLS_MYP_HR,
      startTime: new Date(2026, 1, 26, 15, 0).toISOString(),
      endTime: new Date(2026, 1, 26, 15, 30).toISOString(),
      isAllDay: false,
      linkedIncidentId: incId(1),
      attendees: ["Ms. Mitchell", "Vikram Nakamura"],
    },
    {
      title: "Counsellor Check-in: Rina Youssef",
      description: "Weekly wellbeing check-in session.",
      type: "video_call",
      startTime: new Date(2026, 2, 2, 10, 0).toISOString(),
      endTime: new Date(2026, 2, 2, 10, 30).toISOString(),
      isAllDay: false,
      videoCallUrl: "https://meet.example.com/wellbeing-checkin",
      linkedIncidentId: incId(5),
      attendees: ["Ms. Mitchell", "School Counsellor"],
    },
    {
      title: "MYP Team Planning Meeting",
      description: "Weekly team meeting to discuss curriculum planning and student progress.",
      type: "meeting",
      startTime: new Date(2026, 2, 3, 14, 0).toISOString(),
      endTime: new Date(2026, 2, 3, 15, 0).toISOString(),
      isAllDay: false,
      attendees: ["Ms. Mitchell", "Mr. Thompson", "Ms. Chen"],
    },
    {
      title: "DP Internal Assessment Moderation",
      description: "DP English IA moderation session with department.",
      type: "video_call",
      classId: CLS_DP_ENG,
      startTime: new Date(2026, 2, 5, 13, 0).toISOString(),
      endTime: new Date(2026, 2, 5, 14, 30).toISOString(),
      isAllDay: false,
      videoCallUrl: "https://meet.example.com/dp-moderation",
      attendees: ["Ms. Mitchell", "Mr. Kim", "Ms. Johansson"],
    },
    {
      title: "School Assembly",
      description: "Whole-school assembly in the auditorium.",
      type: "event",
      startTime: new Date(2026, 2, 6, 8, 30).toISOString(),
      endTime: new Date(2026, 2, 6, 9, 15).toISOString(),
      isAllDay: false,
    },
    {
      title: "Professional Development Day",
      description: "No classes - teacher PD sessions all day.",
      type: "event",
      startTime: new Date(2026, 2, 10, 0, 0).toISOString(),
      endTime: new Date(2026, 2, 10, 23, 59).toISOString(),
      isAllDay: true,
    },
  ];

  for (const evt of meetingEvents) {
    calCount++;
    calendarEvents.push({ id: calId(calCount), ...evt });
  }

  // Incident-linked calendar events referenced by follow-ups
  for (let i = 0; i < incidents.length; i++) {
    const inc = incidents[i];
    if (inc.followUps.some(fu => fu.linkedCalendarEventId)) {
      calCount++;
      const evtId = inc.followUps.find(fu => fu.linkedCalendarEventId)!.linkedCalendarEventId!;
      // Only add if not already present
      if (!calendarEvents.find(e => e.id === evtId)) {
        calendarEvents.push({
          id: evtId,
          title: `Follow-up Meeting: ${inc.title}`,
          description: `Follow-up meeting regarding incident with ${students.find(s => s.id === inc.studentId)?.firstName || "student"}.`,
          type: "meeting",
          classId: inc.classId,
          startTime: new Date(2026, 1, 20 + i, 15, 0).toISOString(),
          endTime: new Date(2026, 1, 20 + i, 15, 30).toISOString(),
          isAllDay: false,
          linkedIncidentId: inc.id,
          attendees: ["Ms. Mitchell"],
        });
      }
    }
  }

  // -----------------------------------------------------------------------
  // Return complete seed data
  // -----------------------------------------------------------------------
  return {
    classes,
    students,
    assessments,
    learningGoals,
    grades,
    artifacts,
    attendanceSessions,
    incidents,
    supportPlans,
    taxonomy,
    reportCycles,
    reports,
    reportTemplates,
    transcripts,
    channels,
    announcements,
    notificationSettings,
    calendarEvents,
  };
}
