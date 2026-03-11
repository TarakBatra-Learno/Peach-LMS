import { addDays, subDays } from "date-fns";
import type { Assessment } from "@/types/assessment";
import type { Class } from "@/types/class";
import type { ParentProfile, FamilyNotificationPreference, FamilyAnnouncement, ClassroomUpdate, SchoolPolicy, StudentSignInCode, FamilyThread, FamilyMessage, FamilyNotification, FamilyCalendarEvent, FamilyAttachment } from "@/types/family";
import type { PortfolioArtifact } from "@/types/portfolio";
import type { Report } from "@/types/report";
import type { Student } from "@/types/student";
import type { UnitPlan } from "@/types/unit-planning";

interface FamilySeedInputs {
  students: Student[];
  classes: Class[];
  assessments: Assessment[];
  artifacts: PortfolioArtifact[];
  reports: Report[];
  unitPlans: UnitPlan[];
}

const TODAY = new Date(2026, 1, 28, 9, 0, 0);

const categories = [
  "announcements",
  "messages",
  "classroom_updates",
  "portfolio",
  "assessment_results",
  "attendance",
  "reports",
  "events",
  "deadlines",
] as const;

const isoTime = (date: Date) => date.toISOString();

function makePreferences(studentId?: string): FamilyNotificationPreference[] {
  return categories.map((category) => ({
    scope: studentId ?? "all",
    category,
    inApp: true,
    email: category !== "messages",
    push: category === "attendance" || category === "deadlines" || category === "messages",
    cadence: category === "announcements" || category === "events" ? "daily_digest" : "instant",
  }));
}

function studentName(student: Student | undefined): string {
  return student ? `${student.firstName} ${student.lastName}` : "Student";
}

function linkAttachment(
  label: string,
  type: FamilyAttachment["type"],
  referenceId?: string,
  url?: string
): FamilyAttachment {
  return {
    id: `fam_attach_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    label,
    type,
    referenceId,
    url,
  };
}

export function generateFamilyPortalData({
  students,
  classes,
  assessments,
  artifacts,
  reports,
  unitPlans,
}: FamilySeedInputs) {
  const multiChildIds = ["stu_01", "stu_48"];
  const singleChildIds = ["stu_03"];

  const studentMap = new Map(students.map((student) => [student.id, student]));
  const classMap = new Map(classes.map((cls) => [cls.id, cls]));

  const scienceAssessment = assessments.find((assessment) => assessment.classId === "cls_myp_sci" && assessment.status !== "draft");
  const dpAssessment = assessments.find((assessment) => assessment.classId === "cls_dp_eng" && assessment.status !== "draft");
  const multiChildReportDp = reports.find((report) => report.studentId === "stu_48" && report.distributionStatus === "completed");

  const scienceArtifact = artifacts.find((artifact) => artifact.studentId === "stu_01" && artifact.familyShareStatus !== "not_shared");
  const dpArtifact = artifacts.find((artifact) => artifact.studentId === "stu_48" && artifact.familyShareStatus !== "not_shared");

  const scienceUnit = unitPlans.find((unit) => unit.classId === "cls_myp_sci" && unit.status !== "draft");
  const dpUnit = unitPlans.find((unit) => unit.classId === "cls_dp_eng" && unit.status !== "draft");
  const hrUnit = unitPlans.find((unit) => unit.classId === "cls_myp_hr" && unit.status !== "draft");

  const parentProfiles: ParentProfile[] = [
    {
      id: "parent_01",
      householdName: "Rahman Family",
      name: "Amina Rahman",
      email: "amina.rahman@example.com",
      relationshipLabel: "Mother",
      preferredLanguage: "English",
      uiLanguage: "English",
      translationLanguage: "Spanish",
      autoTranslateCommunications: false,
      linkedStudentIds: multiChildIds,
      avatarInitials: "AR",
      signInMethod: "google",
      directMessagingEnabled: true,
      channelParticipationEnabled: true,
      notificationPreferences: [...makePreferences(), ...makePreferences("stu_48")],
      quietHours: {
        start: "21:00",
        end: "06:30",
      },
    },
    {
      id: "parent_02",
      householdName: "Chen Family",
      name: "David Chen",
      email: "david.chen@example.com",
      relationshipLabel: "Father",
      preferredLanguage: "Arabic",
      uiLanguage: "English",
      translationLanguage: "Arabic",
      autoTranslateCommunications: true,
      linkedStudentIds: singleChildIds,
      avatarInitials: "DC",
      signInMethod: "email",
      directMessagingEnabled: false,
      channelParticipationEnabled: true,
      notificationPreferences: makePreferences(),
    },
  ];

  const familyAnnouncements: FamilyAnnouncement[] = [
    {
      id: "fam_ann_01",
      title: "Student-led conferences open next week",
      body: "Conference booking opens on Monday. Please use the family portal calendar to reserve a time for each child.",
      translatedBody: "Las reservas para las conferencias dirigidas por estudiantes abren el lunes. Usa el calendario familiar para elegir una hora para cada hijo.",
      translatedLanguage: "Spanish",
      audience: "school",
      studentIds: [...multiChildIds, ...singleChildIds],
      attachments: [linkAttachment("Conference guide", "file", undefined, "https://files.example.com/family/conference-guide.pdf")],
      urgent: true,
      emailMirrored: true,
      createdAt: isoTime(subDays(TODAY, 2)),
      sentAt: isoTime(subDays(TODAY, 2)),
      readByParentIds: ["parent_02"],
    },
    {
      id: "fam_ann_02",
      title: "MYP Sciences lab safety reminder",
      body: "Please ensure students bring closed shoes for Thursday's ecosystem investigation. A spare set of goggles will be available at school.",
      translatedBody: "Recuerde que los estudiantes deben traer zapatos cerrados para la investigación del jueves. Habrá gafas de repuesto en la escuela.",
      translatedLanguage: "Spanish",
      audience: "class",
      classId: "cls_myp_sci",
      studentIds: ["stu_01", "stu_03"],
      attachments: scienceAssessment ? [linkAttachment(scienceAssessment.title, "assessment", scienceAssessment.id)] : [],
      createdAt: isoTime(subDays(TODAY, 1)),
      sentAt: isoTime(subDays(TODAY, 1)),
      readByParentIds: [],
    },
    {
      id: "fam_ann_03",
      title: "DP English oral practice evening",
      body: "Families of DP English students are invited to a short virtual briefing on oral assessment milestones and support strategies.",
      translatedBody: "Se invita a las familias de Inglés DP a una breve sesión virtual sobre hitos de evaluación oral y estrategias de apoyo.",
      translatedLanguage: "Spanish",
      audience: "class",
      classId: "cls_dp_eng",
      studentIds: ["stu_48"],
      attachments: dpAssessment ? [linkAttachment(dpAssessment.title, "assessment", dpAssessment.id)] : [],
      emailMirrored: true,
      createdAt: isoTime(subDays(TODAY, 5)),
      sentAt: isoTime(subDays(TODAY, 5)),
      readByParentIds: ["parent_01"],
    },
  ];

  const classroomUpdates: ClassroomUpdate[] = [
    {
      id: "fam_update_01",
      classId: "cls_myp_sci",
      studentIds: ["stu_01", "stu_03"],
      title: "Investigating food webs in the lab",
      body: "Students used observation notes, specimen cards, and collaborative talk to explain how ecosystems respond when one species disappears.",
      translatedBody: "Los estudiantes usaron notas de observación, tarjetas de especies y trabajo colaborativo para explicar cómo responden los ecosistemas cuando desaparece una especie.",
      translatedLanguage: "Spanish",
      teacherName: "Ms. Sarah Mitchell",
      createdAt: isoTime(subDays(TODAY, 2)),
      unitId: scienceUnit?.id,
      mediaType: "image",
      mediaUrl: scienceArtifact?.mediaUrl,
      attachmentLabel: "Lab photo",
      tags: ["Systems", "Inquiry", "ATL: Collaboration"],
    },
    {
      id: "fam_update_02",
      classId: "cls_myp_hr",
      studentIds: ["stu_01", "stu_03"],
      title: "Homeroom reflection circles",
      body: "This week's homeroom circle focused on balancing deadlines and wellbeing. Students identified one strategy they will try before next Friday.",
      teacherName: "Ms. Sarah Mitchell",
      createdAt: isoTime(subDays(TODAY, 4)),
      unitId: hrUnit?.id,
      tags: ["Wellbeing", "Reflection"],
    },
    {
      id: "fam_update_03",
      classId: "cls_dp_eng",
      studentIds: ["stu_48"],
      title: "Comparative oral rehearsal",
      body: "DP English students rehearsed comparative oral extracts and practised speaking with concise evidence-based transitions.",
      translatedBody: "Los estudiantes de Inglés DP ensayaron extractos comparativos y practicaron transiciones claras y basadas en evidencia.",
      translatedLanguage: "Spanish",
      teacherName: "Mr. Daniel Kim",
      createdAt: isoTime(subDays(TODAY, 3)),
      unitId: dpUnit?.id,
      mediaType: "document",
      mediaUrl: dpArtifact?.mediaUrl,
      attachmentLabel: "Speaking checklist",
      tags: ["Language and Literature", "Communication"],
    },
    {
      id: "fam_update_04",
      classId: "cls_myp_sci",
      studentIds: ["stu_03"],
      title: "Ecosystem model critique",
      body: "Students presented draft ecosystem models and gave each other warm and cool feedback before final submissions.",
      teacherName: "Ms. Sarah Mitchell",
      createdAt: isoTime(subDays(TODAY, 6)),
      unitId: scienceUnit?.id,
      tags: ["Peer feedback", "Iteration"],
    },
  ];

  const schoolPolicies: SchoolPolicy[] = [
    {
      id: "policy_01",
      category: "Handbook",
      title: "Family handbook 2025/26",
      summary: "Key routines, communication expectations, and schoolwide family guidance for the current academic year.",
      body: "This handbook brings together the routines families use most often: arrival and dismissal expectations, communication pathways, safeguarding reminders, and how learning updates are shared through Peach.",
      translatedBody: "Este manual reúne las rutinas que las familias usan con más frecuencia: horarios de llegada y salida, vías de comunicación, recordatorios de protección y cómo se comparten las actualizaciones de aprendizaje en Peach.",
      translatedLanguage: "Spanish",
      publishedAt: isoTime(subDays(TODAY, 45)),
      attachment: linkAttachment("Family handbook PDF", "policy", undefined, "https://files.example.com/family/handbook-2025.pdf"),
    },
    {
      id: "policy_02",
      category: "Assessment",
      title: "Assessment and reporting guide",
      summary: "How formative feedback, released results, and narrative reports are shared with families across IB programmes.",
      body: "Families will see assessment details only after release. In MYP classes this may include criteria-based feedback, while DP courses may show component-specific milestones and released teacher comments.",
      publishedAt: isoTime(subDays(TODAY, 32)),
      attachment: linkAttachment("Assessment guide", "policy", undefined, "https://files.example.com/family/assessment-guide.pdf"),
    },
    {
      id: "policy_03",
      category: "Attendance",
      title: "Attendance and punctuality expectations",
      summary: "Attendance thresholds, reporting routines, and how the school works with families when patterns emerge.",
      body: "Attendance records in the family portal are intended to support shared awareness. Internal staff-only notes are never displayed here.",
      translatedBody: "Los registros de asistencia en el portal familiar están pensados para apoyar una conciencia compartida. Las notas internas del personal nunca se muestran aquí.",
      translatedLanguage: "Spanish",
      publishedAt: isoTime(subDays(TODAY, 20)),
    },
  ];

  const studentSignInCodes: StudentSignInCode[] = [
    {
      id: "signin_01",
      studentId: "stu_01",
      code: "PEACH-A1R4",
      qrValue: "https://demo.peachlms.app/pair/stu_01",
      enabled: true,
      expiresAt: isoTime(addDays(TODAY, 18)),
      instructions: "Use this code to connect the Peach student app on a new device. The code expires automatically and can be refreshed by the school.",
    },
    {
      id: "signin_02",
      studentId: "stu_48",
      code: "PEACH-DP48",
      qrValue: "https://demo.peachlms.app/pair/stu_48",
      enabled: true,
      expiresAt: isoTime(addDays(TODAY, 7)),
      instructions: "Use this code to pair a student device for quick access to the DP course view.",
    },
    {
      id: "signin_03",
      studentId: "stu_03",
      code: "PEACH-M3P3",
      qrValue: "https://demo.peachlms.app/pair/stu_03",
      enabled: false,
      instructions: "Your school has not enabled new pairing codes at the moment. Please contact the front office if you need help signing in.",
    },
  ];

  const familyThreads: FamilyThread[] = [
    {
      id: "fam_thread_01",
      kind: "direct",
      title: "Ms. Sarah Mitchell",
      classId: "cls_myp_sci",
      studentId: "stu_01",
      participantIds: ["parent_01", "tchr_01"],
      teacherName: "Ms. Sarah Mitchell",
      subtitle: `${studentName(studentMap.get("stu_01"))} · ${classMap.get("cls_myp_sci")?.name ?? "Science"}`,
      createdAt: isoTime(subDays(TODAY, 10)),
      lastMessageAt: isoTime(subDays(TODAY, 1)),
      mutedByParentIds: [],
    },
    {
      id: "fam_thread_02",
      kind: "direct",
      title: "Mr. Daniel Kim",
      classId: "cls_dp_eng",
      studentId: "stu_48",
      participantIds: ["parent_01", "tchr_02"],
      teacherName: "Mr. Daniel Kim",
      subtitle: `${studentName(studentMap.get("stu_48"))} · ${classMap.get("cls_dp_eng")?.name ?? "DP English"}`,
      createdAt: isoTime(subDays(TODAY, 12)),
      lastMessageAt: isoTime(subDays(TODAY, 3)),
      mutedByParentIds: [],
    },
    {
      id: "fam_thread_03",
      kind: "channel",
      title: "MYP 5 Sciences families",
      classId: "cls_myp_sci",
      participantIds: ["parent_01", "parent_02", "tchr_01"],
      teacherName: "Ms. Sarah Mitchell",
      subtitle: "Class channel",
      createdAt: isoTime(subDays(TODAY, 20)),
      lastMessageAt: isoTime(subDays(TODAY, 2)),
      mutedByParentIds: ["parent_02"],
      schoolManaged: true,
    },
    {
      id: "fam_thread_04",
      kind: "channel",
      title: "DP English families",
      classId: "cls_dp_eng",
      participantIds: ["parent_01", "tchr_02"],
      teacherName: "Mr. Daniel Kim",
      subtitle: "Course channel",
      createdAt: isoTime(subDays(TODAY, 18)),
      lastMessageAt: isoTime(subDays(TODAY, 4)),
      mutedByParentIds: [],
      schoolManaged: true,
    },
  ];

  const familyMessages: FamilyMessage[] = [
    {
      id: "fam_msg_01",
      threadId: "fam_thread_01",
      authorId: "tchr_01",
      authorName: "Ms. Sarah Mitchell",
      authorRole: "teacher",
      body: "Aarav asked thoughtful questions during the food-web investigation today. If you have time this weekend, ask him which species was hardest to place in the model.",
      translatedBody: "Aarav hizo preguntas muy interesantes durante la investigación de cadenas alimentarias hoy. Si tienen tiempo este fin de semana, pregúntenle qué especie fue más difícil de ubicar en el modelo.",
      translatedLanguage: "Spanish",
      attachments: scienceAssessment ? [linkAttachment(scienceAssessment.title, "assessment", scienceAssessment.id)] : [],
      createdAt: isoTime(subDays(TODAY, 3)),
      readByParentIds: ["parent_01"],
    },
    {
      id: "fam_msg_02",
      threadId: "fam_thread_01",
      authorId: "parent_01",
      authorName: "Amina Rahman",
      authorRole: "parent",
      body: "Thank you. We'll ask him to walk us through the model tonight.",
      attachments: [],
      createdAt: isoTime(subDays(TODAY, 2)),
      readByParentIds: ["parent_01"],
    },
    {
      id: "fam_msg_03",
      threadId: "fam_thread_01",
      authorId: "tchr_01",
      authorName: "Ms. Sarah Mitchell",
      authorRole: "teacher",
      body: "Wonderful. I have also attached the task sheet so you can see the reflection prompt families will notice in the portal later this week.",
      translatedBody: "Perfecto. También adjunté la hoja de la tarea para que puedan ver la consigna de reflexión que aparecerá en el portal esta semana.",
      translatedLanguage: "Spanish",
      attachments: scienceAssessment ? [linkAttachment("Task sheet", "assessment", scienceAssessment.id)] : [],
      createdAt: isoTime(subDays(TODAY, 1)),
      readByParentIds: [],
    },
    {
      id: "fam_msg_04",
      threadId: "fam_thread_02",
      authorId: "tchr_02",
      authorName: "Mr. Daniel Kim",
      authorRole: "teacher",
      body: "We have scheduled an optional oral practice evening next Tuesday. It will focus on pacing, evidence selection, and confidence with transitions.",
      translatedBody: "Hemos programado una sesión opcional de práctica oral para el próximo martes. Se centrará en el ritmo, la selección de evidencia y la confianza al conectar ideas.",
      translatedLanguage: "Spanish",
      attachments: dpAssessment ? [linkAttachment(dpAssessment.title, "assessment", dpAssessment.id)] : [],
      createdAt: isoTime(subDays(TODAY, 4)),
      readByParentIds: ["parent_01"],
    },
    {
      id: "fam_msg_05",
      threadId: "fam_thread_03",
      authorId: "tchr_01",
      authorName: "Ms. Sarah Mitchell",
      authorRole: "teacher",
      body: "Reminder: the ecosystem model checkpoint is due on Friday. Families can encourage students to bring their annotated draft and any feedback notes to class.",
      translatedBody: "Recordatorio: el punto de control del modelo de ecosistema vence el viernes. Las familias pueden animar a los estudiantes a traer su borrador anotado y cualquier nota de retroalimentación.",
      translatedLanguage: "Spanish",
      attachments: scienceAssessment ? [linkAttachment(scienceAssessment.title, "assessment", scienceAssessment.id)] : [],
      createdAt: isoTime(subDays(TODAY, 2)),
      readByParentIds: ["parent_01"],
    },
    {
      id: "fam_msg_06",
      threadId: "fam_thread_03",
      authorId: "parent_02",
      authorName: "David Chen",
      authorRole: "parent",
      body: "Thanks for the reminder. Mei has already started organising her notes.",
      attachments: [],
      createdAt: isoTime(subDays(TODAY, 2)),
      readByParentIds: ["parent_02"],
    },
    {
      id: "fam_msg_07",
      threadId: "fam_thread_04",
      authorId: "tchr_02",
      authorName: "Mr. Daniel Kim",
      authorRole: "teacher",
      body: "The revised oral schedule is attached below. Please review it with your child so there are no surprises in the final rehearsal week.",
      attachments: [linkAttachment("Rehearsal schedule", "file", undefined, "https://files.example.com/family/oral-schedule.pdf")],
      createdAt: isoTime(subDays(TODAY, 4)),
      readByParentIds: [],
    },
  ];

  const familyCalendarEvents: FamilyCalendarEvent[] = [
    {
      id: "fam_event_01",
      title: "Student-led conferences",
      description: "Families will meet with advisors and students to review goals, current units, and next steps for the term.",
      type: "school_event",
      studentIds: [...multiChildIds, ...singleChildIds],
      startsAt: isoTime(addDays(TODAY, 4)),
      endsAt: isoTime(addDays(TODAY, 4)),
      isAllDay: true,
      location: "Main campus",
      attachment: linkAttachment("Conference guide", "event", undefined, "https://files.example.com/family/conference-guide.pdf"),
    },
    {
      id: "fam_event_02",
      title: "MYP Sciences open lab",
      description: "Families are welcome to visit the lab showcase and see ecosystem models in progress.",
      type: "class_event",
      classId: "cls_myp_sci",
      studentIds: ["stu_01", "stu_03"],
      startsAt: isoTime(addDays(TODAY, 6)),
      endsAt: isoTime(addDays(TODAY, 6)),
      isAllDay: false,
      location: "Lab 3",
    },
    {
      id: "fam_event_03",
      title: "DP English oral briefing",
      description: "Virtual briefing for families about upcoming oral assessment milestones.",
      type: "meeting",
      classId: "cls_dp_eng",
      studentIds: ["stu_48"],
      startsAt: isoTime(addDays(TODAY, 5)),
      endsAt: isoTime(addDays(TODAY, 5)),
      isAllDay: false,
      meetingLink: "https://meet.example.com/dp-family-briefing",
    },
    {
      id: "fam_event_04",
      title: "Family wellbeing evening",
      description: "A short parent-facing session on routines for balancing workload, sleep, and wellbeing during reporting season.",
      type: "school_event",
      studentIds: [...multiChildIds, ...singleChildIds],
      startsAt: isoTime(addDays(TODAY, 10)),
      endsAt: isoTime(addDays(TODAY, 10)),
      isAllDay: false,
      location: "Auditorium",
    },
  ];

  const familyNotifications: FamilyNotification[] = [
    {
      id: "fam_notif_01",
      parentId: "parent_01",
      studentId: "stu_01",
      type: "portfolio",
      title: "New learning evidence shared",
      body: `${studentName(studentMap.get("stu_01"))} has a new science artifact in the portfolio feed.`,
      read: false,
      createdAt: isoTime(subDays(TODAY, 1)),
      linkTo: scienceArtifact ? `/family/learning?tab=portfolio&artifact=${scienceArtifact.id}&child=stu_01` : "/family/learning?tab=portfolio&child=stu_01",
      childLabel: studentName(studentMap.get("stu_01")),
    },
    {
      id: "fam_notif_02",
      parentId: "parent_01",
      studentId: "stu_48",
      type: "deadline",
      title: "Upcoming DP assessment deadline",
      body: `${dpAssessment?.title ?? "A course task"} is due later this week.`,
      read: false,
      createdAt: isoTime(subDays(TODAY, 1)),
      linkTo: dpAssessment ? `/family/assessments/${dpAssessment.id}?child=stu_48` : "/family/assessments?child=stu_48",
      childLabel: studentName(studentMap.get("stu_48")),
    },
    {
      id: "fam_notif_03",
      parentId: "parent_01",
      studentId: "stu_48",
      type: "report",
      title: "Report available",
      body: "A published report is ready to review for your DP English learner.",
      read: true,
      createdAt: isoTime(subDays(TODAY, 6)),
      linkTo: multiChildReportDp ? `/family/reports/${multiChildReportDp.id}?child=stu_48` : "/family/reports?child=stu_48",
      childLabel: studentName(studentMap.get("stu_48")),
    },
    {
      id: "fam_notif_04",
      parentId: "parent_01",
      studentId: "stu_01",
      type: "announcement",
      title: "New announcement",
      body: "The MYP Sciences class has posted a new update for families.",
      read: false,
      createdAt: isoTime(subDays(TODAY, 1)),
      linkTo: "/family/messages?tab=announcements",
      childLabel: studentName(studentMap.get("stu_01")),
    },
    {
      id: "fam_notif_05",
      parentId: "parent_02",
      studentId: "stu_03",
      type: "attendance",
      title: "Attendance note updated",
      body: "Attendance records for this week now reflect Friday's late arrival.",
      read: false,
      createdAt: isoTime(subDays(TODAY, 2)),
      linkTo: "/family/attendance?child=stu_03",
      childLabel: studentName(studentMap.get("stu_03")),
    },
    {
      id: "fam_notif_06",
      parentId: "parent_02",
      studentId: "stu_03",
      type: "event",
      title: "Upcoming class event",
      body: "The open lab showcase is coming up next week.",
      read: true,
      createdAt: isoTime(subDays(TODAY, 4)),
      linkTo: "/family/calendar",
      childLabel: studentName(studentMap.get("stu_03")),
    },
    {
      id: "fam_notif_07",
      parentId: "parent_02",
      studentId: "stu_03",
      type: "assessment_result",
      title: "Released assessment result",
      body: "A science result has been released for family view.",
      read: false,
      createdAt: isoTime(subDays(TODAY, 7)),
      linkTo: scienceAssessment ? `/family/assessments/${scienceAssessment.id}` : "/family/assessments",
      childLabel: studentName(studentMap.get("stu_03")),
    },
  ];

  return {
    parentProfiles,
    familyNotifications,
    classroomUpdates,
    schoolPolicies,
    studentSignInCodes,
    familyAnnouncements,
    familyThreads,
    familyMessages,
    familyCalendarEvents,
  };
}
