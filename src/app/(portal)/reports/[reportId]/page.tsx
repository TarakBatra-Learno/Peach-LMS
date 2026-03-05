"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertCircle,
  FileText,
  Printer,
  CheckCircle2,
  Send,
  Eye,
  BookOpen,
  Clock,
  MessageSquare,
  Save,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Download,
  Wand2,
  Image,
  ShieldAlert,
  CalendarClock,
  Lightbulb,
  ChevronsUpDown,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { generateId } from "@/services/mock-service";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { COMMENT_GUIDANCE } from "@/lib/comment-guidance";
import { getMYPBoundaryGrade } from "@/lib/grade-helpers";

import type { ReportSection } from "@/types/report";

// ---------- helpers ----------

const MASTERY_RANK: Record<string, number> = {
  exceeding: 4,
  meeting: 3,
  approaching: 2,
  beginning: 1,
  not_assessed: 0,
};
const MASTERY_LABEL: Record<string, string> = {
  exceeding: "Excellent",
  meeting: "Proficient",
  approaching: "Developing",
  beginning: "Emerging",
  not_assessed: "Not assessed",
};
const MASTERY_COLOR: Record<string, string> = {
  exceeding: "bg-[#dcfce7] text-[#16a34a]",
  meeting: "bg-[#dbeafe] text-[#2563eb]",
  approaching: "bg-[#fef3c7] text-[#b45309]",
  beginning: "bg-[#fee2e2] text-[#dc2626]",
  not_assessed: "bg-muted text-muted-foreground",
};

/**
 * Check if a report section is empty.
 * Some section types render from live store data (grades, behavior_incidents)
 * rather than from section.content, so we accept optional live-data counts.
 */
function isSectionEmpty(
  section: ReportSection,
  liveData?: { studentGradesCount?: number; studentIncidentsCount?: number },
): boolean {
  if (section.type === "teacher_comment") {
    const text = (section.content?.comment as string) || (section.content?.text as string) || "";
    return text.trim() === "";
  }
  if (section.type === "attendance") {
    return section.content?.present == null && section.content?.total == null;
  }
  if (section.type === "portfolio_evidence") {
    return !section.content?.artifactIds || (section.content.artifactIds as string[]).length === 0;
  }
  if (section.type === "behavior_incidents") {
    // Renderer reads from studentIncidents store, not section.content
    if (liveData?.studentIncidentsCount != null) return liveData.studentIncidentsCount === 0;
    return !section.content || Object.keys(section.content).length === 0;
  }
  // Grades render from live studentGrades, not section.content
  if (section.type === "grades" || section.type === "myp_criteria" || section.type === "dp_grades") {
    if (liveData?.studentGradesCount != null) return liveData.studentGradesCount === 0;
    return !section.content || Object.keys(section.content).length === 0;
  }
  // ATL skills: empty if no skills array, OR every skill is "not_assessed" with no artifact evidence
  if (section.type === "learning_goals" || section.type === "atl_skills") {
    const skills = section.content?.skills as { level?: string; artifactCount?: number }[] | undefined;
    if (!skills || skills.length === 0) return true;
    return skills.every((s) => (!s.level || s.level === "not_assessed") && (!s.artifactCount || s.artifactCount === 0));
  }
  // Portfolio highlights: empty if no artifact IDs
  if (section.type === "portfolio") {
    return !section.content?.artifactIds || (section.content.artifactIds as string[]).length === 0;
  }
  // Other sections — empty if no content keys
  return !section.content || Object.keys(section.content).length === 0;
}

// ---------- constants ----------

const SECTION_LABELS: Record<string, string> = {
  teacher_comment: "Teacher Comment",
  attendance: "Attendance Summary",
  grades: "Grade Summary",
  myp_criteria: "MYP Criteria",
  dp_grades: "DP Grades",
  portfolio_evidence: "Portfolio Evidence",
  portfolio: "Portfolio Highlights",
  learning_goals: "ATL Skills Progress",
  atl_skills: "ATL Skills",
  behavior_incidents: "Behavior & Incidents",
};

const ADDABLE_SECTION_TYPES = [
  "teacher_comment",
  "attendance",
  "grades",
  "portfolio_evidence",
  "behavior_incidents",
] as const;

// ---------- component ----------

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const loading = useMockLoading([reportId]);

  const reports = useStore((s) => s.reports);
  const updateReport = useStore((s) => s.updateReport);
  const getStudentById = useStore((s) => s.getStudentById);
  const getClassById = useStore((s) => s.getClassById);
  const reportCycles = useStore((s) => s.reportCycles);
  const reportTemplates = useStore((s) => s.reportTemplates);
  const grades = useStore((s) => s.grades);
  const assessments = useStore((s) => s.assessments);
  const attendanceSessions = useStore((s) => s.attendanceSessions);
  const addAnnouncement = useStore((s) => s.addAnnouncement);
  const channels = useStore((s) => s.channels);
  const artifacts = useStore((s) => s.artifacts);
  const incidents = useStore((s) => s.incidents);
  const learningGoals = useStore((s) => s.learningGoals);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [familyPreviewOpen, setFamilyPreviewOpen] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState<string | null>(
    null
  );
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<string[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledPublishAt, setScheduledPublishAt] = useState<string | null>(null);
  const [removeSectionConfirmOpen, setRemoveSectionConfirmOpen] = useState(false);
  const [sectionToRemove, setSectionToRemove] = useState<string | null>(null);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [distributeConfirmOpen, setDistributeConfirmOpen] = useState(false);
  const [readyWarningOpen, setReadyWarningOpen] = useState(false);
  const [emptySectionLabels, setEmptySectionLabels] = useState<string[]>([]);

  const report = reports.find((r) => r.id === reportId);

  // Compute attendance summary for the student
  const attendanceSummary = useMemo(() => {
    if (!report) return { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    let present = 0,
      absent = 0,
      late = 0,
      excused = 0,
      total = 0;
    attendanceSessions.forEach((session) => {
      const record = session.records.find(
        (r) => r.studentId === report.studentId
      );
      if (record) {
        total++;
        if (record.status === "present") present++;
        else if (record.status === "absent") absent++;
        else if (record.status === "late") late++;
        else if (record.status === "excused") excused++;
      }
    });
    return { present, absent, late, excused, total };
  }, [report, attendanceSessions]);

  // Compute grade summary for the student
  const studentGrades = useMemo(() => {
    if (!report) return [];
    return grades.filter(
      (g) => g.studentId === report.studentId && g.classId === report.classId
    );
  }, [report, grades]);

  // Filter incidents for this student
  const studentIncidents = useMemo(() => {
    if (!report) return [];
    return incidents.filter((i) => i.studentId === report.studentId);
  }, [report, incidents]);

  // Filter artifacts for this student
  const studentArtifacts = useMemo(() => {
    if (!report) return [];
    return artifacts.filter(
      (a) => a.studentId === report.studentId && a.classId === report.classId
    );
  }, [report, artifacts]);

  const getAssessmentName = (assessmentId: string) => {
    const asmt = assessments.find((a) => a.id === assessmentId);
    return asmt?.title || assessmentId;
  };

  if (loading) return <DetailSkeleton />;
  if (!report)
    return (
      <EmptyState
        icon={AlertCircle}
        title="Report not found"
        description="This report does not exist."
      />
    );

  const student = getStudentById(report.studentId);
  const cls = getClassById(report.classId);
  const cycle = reportCycles.find((c) => c.id === report.cycleId);
  const template = reportTemplates.find((t) => t.id === report.templateId);
  const studentName = student
    ? `${student.firstName} ${student.lastName}`
    : "Unknown Student";

  const sortedSections = [...report.sections].sort(
    (a, b) => a.order - b.order
  );

  // -------- Section Management handlers (A4) --------

  const handleMoveSection = (configId: string, direction: "up" | "down") => {
    const idx = sortedSections.findIndex((s) => s.configId === configId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedSections.length) return;

    const updatedSections = report.sections.map((s) => {
      if (s.configId === sortedSections[idx].configId) {
        return { ...s, order: sortedSections[swapIdx].order };
      }
      if (s.configId === sortedSections[swapIdx].configId) {
        return { ...s, order: sortedSections[idx].order };
      }
      return s;
    });
    updateReport(reportId, { sections: updatedSections });
  };

  const handleRemoveSection = (configId: string) => {
    setSectionToRemove(configId);
    setRemoveSectionConfirmOpen(true);
  };

  const confirmRemoveSection = () => {
    if (!sectionToRemove) return;
    const updatedSections = report.sections.filter(
      (s) => s.configId !== sectionToRemove
    );
    updateReport(reportId, { sections: updatedSections });
    toast.success("Section removed");
    setSectionToRemove(null);
  };

  const handleAddSection = (type: (typeof ADDABLE_SECTION_TYPES)[number]) => {
    const newSection = {
      configId: generateId("sec"),
      type: type as (typeof report.sections)[0]["type"],
      label: SECTION_LABELS[type] || type,
      order: sortedSections.length,
      content: {} as Record<string, unknown>,
    };
    updateReport(reportId, {
      sections: [...report.sections, newSection],
    });
    setAddSectionOpen(false);
    toast.success(`Added "${SECTION_LABELS[type] || type}" section`);
  };

  // -------- Auto-fill handler (A5) --------

  const handleAutoFill = () => {
    let anySkipped = false;
    const updatedSections = report.sections.map((section) => {
      const hasContent = Object.keys(section.content).length > 0;

      if (section.type === "attendance") {
        if (hasContent) {
          anySkipped = true;
          return section;
        }
        const rate =
          attendanceSummary.total > 0
            ? Math.round(
                (attendanceSummary.present / attendanceSummary.total) * 100
              )
            : 0;
        return {
          ...section,
          content: {
            present: attendanceSummary.present,
            absent: attendanceSummary.absent,
            late: attendanceSummary.late,
            excused: attendanceSummary.excused,
            total: attendanceSummary.total,
            rate,
          },
        };
      }

      if (
        section.type === "grades" ||
        section.type === "myp_criteria" ||
        section.type === "dp_grades"
      ) {
        if (hasContent) {
          anySkipped = true;
          return section;
        }
        const gradeEntries = studentGrades.map((g) => ({
          assessmentId: g.assessmentId,
          assessmentName: getAssessmentName(g.assessmentId),
          score: g.isMissing
            ? "Missing"
            : g.score != null
            ? `${g.score}%`
            : g.dpGrade != null
            ? `${g.dpGrade}/7`
            : g.mypCriteriaScores?.length
            ? `${Math.round(
                g.mypCriteriaScores.reduce((s, c) => s + c.level, 0) /
                  g.mypCriteriaScores.length
              )}/8`
            : "Pending",
        }));
        const numericScores = studentGrades
          .filter((g) => g.score != null)
          .map((g) => g.score as number);
        const average =
          numericScores.length > 0
            ? Math.round(
                numericScores.reduce((a, b) => a + b, 0) /
                  numericScores.length
              )
            : null;
        return {
          ...section,
          content: {
            grades: gradeEntries,
            average,
          },
        };
      }

      // Auto-fill ATL skills (learning_goals / atl_skills)
      if (section.type === "learning_goals" || section.type === "atl_skills") {
        if (hasContent) {
          anySkipped = true;
          return section;
        }
        const atlGoals = learningGoals.filter((g) => g.category === "atl_skill");
        const skills = atlGoals.map((goal) => {
          let bestLevel: string | null = null;
          let bestGradedAt: string | null = null;

          studentGrades.forEach((g) => {
            g.standardsMastery?.forEach((sm) => {
              if (sm.standardId === goal.id) {
                const smLevel = sm.level || "not_assessed";
                const isBetter =
                  !bestLevel ||
                  (g.gradedAt && (!bestGradedAt || g.gradedAt > bestGradedAt)) ||
                  (!g.gradedAt && !bestGradedAt && (MASTERY_RANK[smLevel] || 0) > (MASTERY_RANK[bestLevel] || 0));
                if (isBetter) {
                  bestLevel = smLevel;
                  bestGradedAt = g.gradedAt || null;
                }
              }
            });
          });

          const artifactCount = studentArtifacts.filter((a) =>
            a.learningGoalIds.includes(goal.id)
          ).length;

          return { goalId: goal.id, title: goal.title, level: bestLevel, artifactCount };
        });
        return { ...section, content: { skills } };
      }

      // Auto-fill portfolio highlights
      if (section.type === "portfolio") {
        if (hasContent) {
          anySkipped = true;
          return section;
        }
        const approved = studentArtifacts
          .filter((a) => a.approvalStatus === "approved")
          .sort((a, b) => (b.flaggedForReport ? 1 : 0) - (a.flaggedForReport ? 1 : 0))
          .slice(0, 5);
        return { ...section, content: { artifactIds: approved.map((a) => a.id) } };
      }

      return section;
    });

    updateReport(reportId, { sections: updatedSections });
    toast.success("Auto-fill complete", {
      description: anySkipped
        ? "Some sections already had content and were skipped."
        : undefined,
    });
  };

  // -------- Evidence Picker handler (A6) --------

  const handleOpenEvidencePicker = (configId: string) => {
    const section = report.sections.find((s) => s.configId === configId);
    const existingIds = (section?.content?.artifactIds as string[]) || [];
    setSelectedArtifactIds(existingIds);
    setEvidenceDialogOpen(configId);
  };

  const handleSaveEvidence = () => {
    if (!evidenceDialogOpen) return;
    const updatedSections = report.sections.map((s) =>
      s.configId === evidenceDialogOpen
        ? { ...s, content: { ...s.content, artifactIds: selectedArtifactIds } }
        : s
    );
    updateReport(reportId, { sections: updatedSections });
    setEvidenceDialogOpen(null);
    setSelectedArtifactIds([]);
    toast.success("Evidence updated");
  };

  const toggleArtifactSelection = (artifactId: string) => {
    setSelectedArtifactIds((prev) =>
      prev.includes(artifactId)
        ? prev.filter((id) => id !== artifactId)
        : [...prev, artifactId]
    );
  };

  // -------- Mock PDF Export handler (A8) --------

  const handleDownloadPdf = () => {
    let text = `REPORT\n${"=".repeat(40)}\n`;
    text += `Student: ${studentName}\n`;
    text += `Class: ${cls?.name || "Unknown"}\n`;
    text += `Cycle: ${cycle?.name || "Unknown"} - ${cycle?.term || ""}\n`;
    text += `Academic Year: ${cycle?.academicYear || ""}\n`;
    text += `Status: ${report.publishState}\n`;
    text += `\n${"=".repeat(40)}\n\n`;

    sortedSections.forEach((section) => {
      text += `--- ${section.label} ---\n`;

      if (section.type === "teacher_comment") {
        text += `${(section.content.comment as string) || (section.content.text as string) || "No comment provided."}\n`;
      } else if (section.type === "attendance") {
        text += `Present: ${attendanceSummary.present}\n`;
        text += `Absent: ${attendanceSummary.absent}\n`;
        text += `Late: ${attendanceSummary.late}\n`;
        text += `Excused: ${attendanceSummary.excused}\n`;
        text += `Total: ${attendanceSummary.total}\n`;
        const rate =
          attendanceSummary.total > 0
            ? Math.round(
                (attendanceSummary.present / attendanceSummary.total) * 100
              )
            : 0;
        text += `Rate: ${rate}%\n`;
      } else if (
        section.type === "grades" ||
        section.type === "myp_criteria" ||
        section.type === "dp_grades"
      ) {
        if (studentGrades.length > 0) {
          studentGrades.forEach((g) => {
            const score = g.isMissing
              ? "Missing"
              : g.score != null
              ? `${g.score}%`
              : g.dpGrade != null
              ? `${g.dpGrade}/7`
              : g.mypCriteriaScores?.length
              ? `${Math.round(
                  g.mypCriteriaScores.reduce((s, c) => s + c.level, 0) /
                    g.mypCriteriaScores.length
                )}/8`
              : "Pending";
            text += `  ${getAssessmentName(g.assessmentId)}: ${score}\n`;
          });
        } else {
          text += `No grades available.\n`;
        }
      } else if (section.type === "portfolio_evidence") {
        const artifactIds = (section.content.artifactIds as string[]) || [];
        if (artifactIds.length > 0) {
          artifactIds.forEach((aid) => {
            const artifact = artifacts.find((a) => a.id === aid);
            text += `  - ${artifact?.title || aid} (${artifact?.mediaType || "unknown"})\n`;
          });
        } else {
          text += `No evidence attached.\n`;
        }
      } else if (section.type === "behavior_incidents") {
        text += `Total incidents: ${studentIncidents.length}\n`;
        const bySeverity = { low: 0, medium: 0, high: 0 };
        studentIncidents.forEach((i) => {
          if (i.severity in bySeverity)
            bySeverity[i.severity as keyof typeof bySeverity]++;
        });
        text += `Severity - Low: ${bySeverity.low}, Medium: ${bySeverity.medium}, High: ${bySeverity.high}\n`;
        studentIncidents.forEach((i) => {
          text += `  - ${i.title} [${i.severity}] ${format(parseISO(i.reportedAt), "MMM d, yyyy")}\n`;
        });
      } else {
        const contentStr = JSON.stringify(section.content);
        text += contentStr === "{}" ? "No content\n" : `${contentStr}\n`;
      }

      text += "\n";
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${studentName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  // Publish flow handlers
  const handleMarkReady = () => {
    const liveData = {
      studentGradesCount: studentGrades.length,
      studentIncidentsCount: studentIncidents.length,
    };
    const emptyLabels = report.sections
      .filter((s) => isSectionEmpty(s, liveData))
      .map((s) => s.label);
    if (emptyLabels.length > 0) {
      setEmptySectionLabels(emptyLabels);
      setReadyWarningOpen(true);
      return;
    }
    confirmMarkReady();
  };

  const confirmMarkReady = () => {
    updateReport(reportId, { publishState: "ready" });
    toast.success("Report marked as ready for review");
  };

  const handlePublish = () => {
    setPublishConfirmOpen(true);
  };

  const confirmPublish = () => {
    updateReport(reportId, {
      publishState: "published",
      publishedAt: new Date().toISOString(),
    });
    toast.success("Report published successfully");
  };

  const handleDistribute = () => {
    setDistributeConfirmOpen(true);
  };

  const confirmDistribute = () => {
    const now = new Date().toISOString();
    updateReport(reportId, {
      publishState: "distributed",
      distributionStatus: "completed",
      distributedAt: now,
    });

    // Create announcement in the class announcements channel
    if (report && cls) {
      const announcementChannel = channels.find(
        (ch) => ch.classId === cls.id && ch.type === "announcements"
      );
      if (announcementChannel) {
        addAnnouncement({
          id: generateId("ann"),
          channelId: announcementChannel.id,
          classId: cls.id,
          title: `Report distributed: ${studentName}`,
          body: `The ${cycle?.term || ""} report for ${studentName} in ${cls.name} has been distributed to the family.`,
          attachments: [
            {
              id: generateId("attach"),
              type: "report",
              referenceId: reportId,
              label: `${studentName} - ${cycle?.name || "Report"}`,
            },
          ],
          status: "sent",
          sentAt: now,
          createdAt: now,
          threadReplies: [],
        });
      }
    }

    toast.success("Report distributed", {
      description: `Shared with ${studentName}'s family via the family portal.`,
    });
  };

  const handleSchedulePublish = () => {
    if (!scheduledDate) {
      toast.error("Please select a date");
      return;
    }
    setScheduledPublishAt(new Date(scheduledDate).toISOString());
    updateReport(reportId, {
      publishState: "ready",
    });
    toast.success(`Report scheduled for ${format(new Date(scheduledDate), "MMM d, yyyy")}`);
    setScheduleDialogOpen(false);
    setScheduledDate("");
  };

  const handleSaveComment = (configId: string) => {
    const newContent = commentDrafts[configId];
    if (newContent === undefined) return;
    const updatedSections = report.sections.map((s) =>
      s.configId === configId
        ? { ...s, content: { ...s.content, comment: newContent } }
        : s
    );
    updateReport(reportId, { sections: updatedSections });
    toast.success("Comment saved");
  };

  // Section type icon
  const getSectionIcon = (type: string) => {
    switch (type) {
      case "teacher_comment":
        return MessageSquare;
      case "attendance":
        return Clock;
      case "grades":
      case "myp_criteria":
      case "dp_grades":
        return BookOpen;
      case "portfolio_evidence":
      case "portfolio":
        return Image;
      case "learning_goals":
      case "atl_skills":
        return BookOpen;
      case "behavior_incidents":
        return ShieldAlert;
      default:
        return FileText;
    }
  };

  // Render section content
  const renderSectionContent = (
    section: (typeof report.sections)[0]
  ) => {
    switch (section.type) {
      case "teacher_comment": {
        const currentComment =
          commentDrafts[section.configId] ??
          (section.content.comment as string) ??
          (section.content.text as string) ??
          "";
        return (
          <div className="space-y-3">
            <Textarea
              value={currentComment}
              onChange={(e) =>
                setCommentDrafts((prev) => ({
                  ...prev,
                  [section.configId]: e.target.value,
                }))
              }
              placeholder="Write your comment for this student..."
              className="min-h-[120px] text-[13px]"
            />
            {/* Word count (#21) */}
            {(() => {
              const text = commentDrafts[section.configId] ?? (section.content.comment as string) ?? (section.content.text as string) ?? "";
              const words = text.trim() ? text.trim().split(/\s+/).length : 0;
              return (
                <p className="text-[11px] text-muted-foreground">
                  {words} {words === 1 ? "word" : "words"} &middot; {text.length} characters
                </p>
              );
            })()}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleSaveComment(section.configId)}
                disabled={commentDrafts[section.configId] === undefined}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Comment
              </Button>
            </div>

            {/* Writing guidance (#22) — read-only reference, NOT insertable */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-[12px] text-muted-foreground gap-1.5 px-2">
                  <Lightbulb className="h-3.5 w-3.5" />
                  {COMMENT_GUIDANCE.title}
                  <ChevronsUpDown className="h-3 w-3" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
                  <ul className="space-y-1">
                    {COMMENT_GUIDANCE.tips.map((tip, i) => (
                      <li key={i} className="text-[12px] text-muted-foreground flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-amber-200/50">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1">Example:</p>
                    <p className="text-[12px] text-muted-foreground italic leading-relaxed">
                      &ldquo;{COMMENT_GUIDANCE.example}&rdquo;
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      }

      case "attendance": {
        const rate =
          attendanceSummary.total > 0
            ? Math.round(
                (attendanceSummary.present / attendanceSummary.total) * 100
              )
            : 0;
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-lg bg-[#dcfce7] p-3 text-center">
                <p className="text-[20px] font-semibold text-[#16a34a]">
                  {attendanceSummary.present}
                </p>
                <p className="text-[11px] text-[#16a34a]">Present</p>
              </div>
              <div className="rounded-lg bg-[#fee2e2] p-3 text-center">
                <p className="text-[20px] font-semibold text-[#dc2626]">
                  {attendanceSummary.absent}
                </p>
                <p className="text-[11px] text-[#dc2626]">Absent</p>
              </div>
              <div className="rounded-lg bg-[#fef3c7] p-3 text-center">
                <p className="text-[20px] font-semibold text-[#b45309]">
                  {attendanceSummary.late}
                </p>
                <p className="text-[11px] text-[#b45309]">Late</p>
              </div>
              <div className="rounded-lg bg-[#dbeafe] p-3 text-center">
                <p className="text-[20px] font-semibold text-[#2563eb]">
                  {attendanceSummary.excused}
                </p>
                <p className="text-[11px] text-[#2563eb]">Excused</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-[20px] font-semibold text-foreground">
                  {rate}%
                </p>
                <p className="text-[11px] text-muted-foreground">Rate</p>
              </div>
            </div>
          </div>
        );
      }

      case "grades":
      case "myp_criteria":
      case "dp_grades": {
        if (studentGrades.length === 0) {
          return (
            <p className="text-[13px] text-muted-foreground">
              No grade data available for this student.
            </p>
          );
        }

        // ── MYP Criteria table (#1, #25) ──
        if (section.type === "myp_criteria") {
          // Aggregate best criteria scores across all MYP assessments
          const criteriaMap: Record<string, { criterion: string; level: number; assessmentName: string }> = {};
          studentGrades.forEach((g) => {
            if (g.mypCriteriaScores?.length) {
              g.mypCriteriaScores.forEach((cs) => {
                const existing = criteriaMap[cs.criterion];
                if (!existing || cs.level > existing.level) {
                  criteriaMap[cs.criterion] = {
                    criterion: cs.criterion,
                    level: cs.level,
                    assessmentName: getAssessmentName(g.assessmentId),
                  };
                }
              });
            }
          });
          const criteriaEntries = ["A", "B", "C", "D"]
            .map((c) => criteriaMap[c] || { criterion: c, level: 0, assessmentName: "—" })
            .filter((c) => criteriaMap[c.criterion] || true); // always show A-D
          const criteriaTotal = criteriaEntries.reduce((s, c) => s + c.level, 0);
          const boundaryGrade = getMYPBoundaryGrade(criteriaTotal);

          return (
            <div className="space-y-3">
              {/* Criteria table */}
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Criterion</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">Level</th>
                      <th className="text-center py-2 px-2 font-medium text-muted-foreground">Max</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteriaEntries.map((entry) => (
                      <tr key={entry.criterion} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium">
                          Criterion {entry.criterion}
                          <span className="text-muted-foreground font-normal ml-1.5">
                            {entry.criterion === "A" ? "(Knowing & understanding)" :
                             entry.criterion === "B" ? "(Investigating)" :
                             entry.criterion === "C" ? "(Communicating)" :
                             "(Thinking critically)"}
                          </span>
                        </td>
                        <td className="text-center py-2 px-2">
                          {entry.level > 0 ? (
                            <Badge variant="secondary" className="text-[12px]">{entry.level}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="text-center py-2 px-2 text-muted-foreground">8</td>
                        <td className="py-2 px-2 text-[12px] text-muted-foreground">{entry.assessmentName}</td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="border-t-2 border-border">
                      <td className="py-2 pr-4 font-semibold">Total</td>
                      <td className="text-center py-2 px-2">
                        <Badge className="text-[12px]">{criteriaTotal}</Badge>
                      </td>
                      <td className="text-center py-2 px-2 text-muted-foreground font-medium">32</td>
                      <td className="py-2 px-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Boundary grade (#25) */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-[12px] text-muted-foreground font-medium">MYP Boundary Grade</p>
                  <p className="text-[11px] text-muted-foreground">Based on criteria total of {criteriaTotal}/32</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[28px] font-bold text-foreground">{boundaryGrade ?? "—"}</span>
                  <span className="text-[14px] text-muted-foreground">/7</span>
                </div>
              </div>

              {/* Also list individual assessment grades */}
              <div>
                <p className="text-[12px] font-medium text-muted-foreground mb-2">Assessment Details</p>
                {studentGrades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between py-1.5 border-b border-border/30 text-[13px]">
                    <Link href={`/assessments/${grade.assessmentId}`} className="text-[#c24e3f] hover:underline">
                      {getAssessmentName(grade.assessmentId)}
                    </Link>
                    <span className="text-muted-foreground">
                      {grade.isMissing
                        ? "Missing"
                        : grade.mypCriteriaScores?.length
                        ? grade.mypCriteriaScores.map((c) => `${c.criterion}:${c.level}`).join(" ")
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Standard grades table (score / dp_scale / generic) ──
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                    Assessment
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentGrades.map((grade) => (
                  <tr
                    key={grade.id}
                    className="border-b border-border/50"
                  >
                    <td className="py-2 pr-4 text-[13px]">
                      <Link
                        href={`/assessments/${grade.assessmentId}`}
                        className="text-[#c24e3f] hover:underline"
                      >
                        {getAssessmentName(grade.assessmentId)}
                      </Link>
                    </td>
                    <td className="text-center py-2 px-2">
                      {grade.isMissing ? (
                        <span className="text-[#dc2626] font-medium">
                          Missing
                        </span>
                      ) : grade.score != null ? (
                        <span>{grade.score}%</span>
                      ) : grade.dpGrade != null ? (
                        <span>{grade.dpGrade}/7</span>
                      ) : grade.mypCriteriaScores?.length ? (
                        <span>
                          {Math.round(
                            grade.mypCriteriaScores.reduce(
                              (s, c) => s + c.level,
                              0
                            ) / grade.mypCriteriaScores.length
                          )}
                          /8
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {"\u2014"}
                        </span>
                      )}
                    </td>
                    <td className="text-center py-2 px-2">
                      <StatusBadge
                        status={
                          grade.isMissing
                            ? "missing"
                            : grade.score != null ||
                              grade.dpGrade != null ||
                              grade.mypCriteriaScores?.length
                            ? "completed"
                            : "pending"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      // ---------- A6: Portfolio Evidence section ----------
      case "portfolio_evidence": {
        const artifactIds = (section.content.artifactIds as string[]) || [];
        const linkedArtifacts = artifactIds
          .map((id) => artifacts.find((a) => a.id === id))
          .filter(Boolean);

        if (linkedArtifacts.length > 0) {
          return (
            <div className="space-y-3">
              <div className="grid gap-2">
                {linkedArtifacts.map((artifact) =>
                  artifact ? (
                    <div
                      key={artifact.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                    >
                      <div className="rounded-lg bg-muted p-1.5">
                        <Image className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">
                          {artifact.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(parseISO(artifact.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {artifact.mediaType}
                      </Badge>
                    </div>
                  ) : null
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenEvidencePicker(section.configId)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Edit Evidence
              </Button>
            </div>
          );
        }

        return (
          <div className="text-center py-6">
            <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground mb-3">
              No evidence attached yet.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenEvidencePicker(section.configId)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Evidence
            </Button>
          </div>
        );
      }

      // ---------- A7: Behavior Incidents section ----------
      case "behavior_incidents": {
        if (studentIncidents.length === 0) {
          return (
            <p className="text-[13px] text-muted-foreground">
              No incidents recorded for this student.
            </p>
          );
        }

        const bySeverity = { low: 0, medium: 0, high: 0 };
        const byStatus = { open: 0, in_progress: 0, resolved: 0 };
        studentIncidents.forEach((i) => {
          if (i.severity in bySeverity)
            bySeverity[i.severity as keyof typeof bySeverity]++;
          if (i.status in byStatus)
            byStatus[i.status as keyof typeof byStatus]++;
        });

        const severityColor: Record<string, string> = {
          low: "bg-[#dcfce7] text-[#16a34a]",
          medium: "bg-[#fef3c7] text-[#b45309]",
          high: "bg-[#fee2e2] text-[#dc2626]",
        };

        return (
          <div className="space-y-4">
            {/* Summary counts */}
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium">
                Total: {studentIncidents.length}
              </span>
            </div>

            {/* By severity */}
            <div>
              <p className="text-[12px] text-muted-foreground mb-1.5">
                By severity
              </p>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((sev) => (
                  <Badge
                    key={sev}
                    className={`text-[11px] ${severityColor[sev]}`}
                    variant="secondary"
                  >
                    {sev}: {bySeverity[sev]}
                  </Badge>
                ))}
              </div>
            </div>

            {/* By status */}
            <div>
              <p className="text-[12px] text-muted-foreground mb-1.5">
                By status
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[11px]">
                  Open: {byStatus.open}
                </Badge>
                <Badge variant="outline" className="text-[11px]">
                  In Progress: {byStatus.in_progress}
                </Badge>
                <Badge variant="outline" className="text-[11px]">
                  Resolved: {byStatus.resolved}
                </Badge>
              </div>
            </div>

            {/* Incident list */}
            <Separator />
            <div className="space-y-2">
              {studentIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">
                      {incident.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(parseISO(incident.reportedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge
                    className={`text-[10px] ${severityColor[incident.severity] || ""}`}
                    variant="secondary"
                  >
                    {incident.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ---------- ATL Skills Progress / ATL Skills ----------
      case "learning_goals":
      case "atl_skills": {
        const atlGoals = learningGoals.filter((g) => g.category === "atl_skill");

        // Resolve best mastery per goal: most recent gradedAt, then highest level
        const skillRows = atlGoals.map((goal) => {
          let bestLevel: string | null = null;
          let bestGradedAt: string | null = null;

          studentGrades.forEach((g) => {
            g.standardsMastery?.forEach((sm) => {
              if (sm.standardId === goal.id) {
                const smLevel = sm.level || "not_assessed";
                const isBetter =
                  !bestLevel ||
                  (g.gradedAt && (!bestGradedAt || g.gradedAt > bestGradedAt)) ||
                  (!g.gradedAt && !bestGradedAt && (MASTERY_RANK[smLevel] || 0) > (MASTERY_RANK[bestLevel] || 0));
                if (isBetter) {
                  bestLevel = smLevel;
                  bestGradedAt = g.gradedAt || null;
                }
              }
            });
          });

          const artifactCount = studentArtifacts.filter((a) =>
            a.learningGoalIds.includes(goal.id)
          ).length;

          return { goal, level: bestLevel, artifactCount };
        });

        return (
          <div className="space-y-3">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">ATL Skill</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Level</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {skillRows.map((row) => (
                  <tr key={row.goal.id} className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      <p className="font-medium">{row.goal.title}</p>
                      <p className="text-[11px] text-muted-foreground">{row.goal.code}</p>
                    </td>
                    <td className="text-center py-2 px-2">
                      {row.level && row.level !== "not_assessed" ? (
                        <Badge className={`text-[11px] ${MASTERY_COLOR[row.level] || ""}`} variant="secondary">
                          {MASTERY_LABEL[row.level] || row.level}
                        </Badge>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-center py-2 px-2">
                      {row.artifactCount > 0 ? (
                        <span className="text-[12px]">{row.artifactCount} {row.artifactCount === 1 ? "item" : "items"}</span>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {skillRows.every((r) => !r.level || r.level === "not_assessed") &&
             skillRows.every((r) => r.artifactCount === 0) && (
              <p className="text-[12px] text-muted-foreground italic">
                No ATL skill assessments or linked evidence yet. Use Auto-fill after grading.
              </p>
            )}
          </div>
        );
      }

      // ---------- Portfolio Highlights / Selected Work Samples ----------
      case "portfolio": {
        // If teacher has curated IDs, use those; otherwise derive from studentArtifacts
        const curatedIds = (section.content?.artifactIds as string[]) || [];
        const displayArtifacts = curatedIds.length > 0
          ? curatedIds.map((id) => artifacts.find((a) => a.id === id)).filter(Boolean)
          : studentArtifacts
              .filter((a) => a.approvalStatus === "approved")
              .sort((a, b) => (b.flaggedForReport ? 1 : 0) - (a.flaggedForReport ? 1 : 0));

        if (displayArtifacts.length === 0) {
          return (
            <p className="text-[13px] text-muted-foreground">
              No approved portfolio items for this student.
            </p>
          );
        }

        const flaggedCount = displayArtifacts.filter((a) => a?.flaggedForReport).length;

        return (
          <div className="space-y-3">
            <p className="text-[12px] text-muted-foreground">
              {displayArtifacts.length} approved {displayArtifacts.length === 1 ? "artifact" : "artifacts"}
              {flaggedCount > 0 && ` (${flaggedCount} flagged for report)`}
              {curatedIds.length === 0 && " · auto-suggested"}
            </p>
            <div className="grid gap-2">
              {displayArtifacts.slice(0, 8).map((artifact) =>
                artifact ? (
                  <div key={artifact.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{artifact.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {artifact.description ? artifact.description.slice(0, 80) + (artifact.description.length > 80 ? "…" : "") : "No description"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{artifact.mediaType}</Badge>
                      {artifact.flaggedForReport && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700">Flagged</Badge>
                      )}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        );
      }

      default: {
        // Generic content preview
        const contentStr = JSON.stringify(section.content, null, 2);
        return (
          <pre className="text-[12px] text-muted-foreground bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
            {contentStr === "{}" ? "No content yet" : contentStr}
          </pre>
        );
      }
    }
  };

  return (
    <div>
      <PageHeader
        title={`Report: ${studentName}`}
        description={`${cls?.name || "Unknown Class"} \u00b7 ${cycle?.name || "Unknown Cycle"} \u00b7 ${cycle?.term || ""}`}
      >
        <div className="flex items-center gap-2 mt-2">
          <StatusBadge status={report.publishState} />
          {template && (
            <Badge variant="outline" className="text-[11px]">
              {template.name}
            </Badge>
          )}
          <Separator orientation="vertical" className="h-4" />
          <Link
            href={`/students/${report.studentId}?classId=${report.classId}`}
            className="text-[13px] text-[#c24e3f] hover:underline"
          >
            View student profile →
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="text-[13px]"
              onClick={() => setFamilyPreviewOpen(true)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Family Preview
            </Button>
            <Button
              size="sm"
              className="text-[13px]"
              onClick={() => setPreviewOpen(true)}
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print Preview
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* Auto-fill — distinct from publish flow */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-amber-50/50 border border-amber-200/50">
        <Wand2 className="h-4 w-4 text-amber-600" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground">Auto-fill sections</p>
          <p className="text-[11px] text-muted-foreground">Populate attendance, grades, ATL skills, and portfolio from existing data</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleAutoFill} className="shrink-0">
          <Wand2 className="h-3.5 w-3.5 mr-1.5" />
          Auto-fill
        </Button>
      </div>

      {/* Publish Flow */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-muted/50 border border-border/50">
        <span className="text-[13px] text-muted-foreground mr-2">
          Publish flow:
        </span>
        <Button
          size="sm"
          variant={report.publishState === "draft" ? "default" : "outline"}
          onClick={handleMarkReady}
          disabled={report.publishState !== "draft"}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          Mark Ready
        </Button>
        <Button
          size="sm"
          variant={report.publishState === "ready" ? "default" : "outline"}
          onClick={handlePublish}
          disabled={report.publishState !== "ready"}
        >
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          Publish
        </Button>
        <Button
          size="sm"
          variant={
            report.publishState === "published" ? "default" : "outline"
          }
          onClick={handleDistribute}
          disabled={report.publishState !== "published"}
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          Distribute
        </Button>

        {/* Schedule button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setScheduleDialogOpen(true)}
          disabled={report.publishState === "published" || report.publishState === "distributed"}
        >
          <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
          Schedule
        </Button>

        {scheduledPublishAt && (
          <Badge variant="secondary" className="text-[11px] gap-1 ml-auto">
            <CalendarClock className="h-3 w-3" />
            Scheduled: {format(parseISO(scheduledPublishAt), "MMM d, yyyy")}
          </Badge>
        )}
        {report.publishedAt && (
          <span className="text-[11px] text-muted-foreground ml-auto">
            Published {format(parseISO(report.publishedAt), "MMM d, yyyy")}
          </span>
        )}
        {report.distributedAt && (
          <span className="text-[11px] text-muted-foreground">
            {"\u00b7"} Distributed{" "}
            {format(parseISO(report.distributedAt), "MMM d, yyyy")}
          </span>
        )}
      </div>

      {/* Report Sections */}
      <div className="space-y-4">
        {sortedSections.map((section, idx) => {
          const Icon = getSectionIcon(section.type);
          return (
            <Card key={section.configId} className="p-5 gap-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-muted p-1.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-[14px] font-semibold">{section.label}</h3>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {section.type.replace(/_/g, " ")}
                </Badge>

                {/* Section management controls (A4) */}
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleMoveSection(section.configId, "up")}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleMoveSection(section.configId, "down")}
                    disabled={idx === sortedSections.length - 1}
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveSection(section.configId)}
                    title="Remove section"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Separator className="mb-3" />
              {renderSectionContent(section)}
            </Card>
          );
        })}
      </div>

      {sortedSections.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No sections"
          description="This report has no configured sections."
        />
      )}

      {/* Add Section Button (A4) */}
      <div className="mt-4">
        <Popover open={addSectionOpen} onOpenChange={setAddSectionOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Section
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="center">
            <div className="space-y-1">
              <p className="text-[12px] font-medium text-muted-foreground px-2 py-1">
                Choose section type
              </p>
              {ADDABLE_SECTION_TYPES.map((type) => (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-[13px]"
                  onClick={() => handleAddSection(type)}
                >
                  {SECTION_LABELS[type]}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Evidence Picker Dialog (A6) */}
      <Dialog
        open={evidenceDialogOpen !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEvidenceDialogOpen(null);
            setSelectedArtifactIds([]);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Portfolio Evidence</DialogTitle>
            <DialogDescription>
              Choose artifacts to include in this report section.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {studentArtifacts.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-4">
                No artifacts found for this student.
              </p>
            ) : (
              studentArtifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleArtifactSelection(artifact.id)}
                >
                  <Checkbox
                    checked={selectedArtifactIds.includes(artifact.id)}
                    onCheckedChange={() =>
                      toggleArtifactSelection(artifact.id)
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">
                      {artifact.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(parseISO(artifact.createdAt), "MMM d, yyyy")}
                      {artifact.isReportEligible && (
                        <span className="ml-1 text-[#16a34a]">
                          (report eligible)
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {artifact.mediaType}
                  </Badge>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEvidenceDialogOpen(null);
                setSelectedArtifactIds([]);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEvidence}
              disabled={selectedArtifactIds.length === 0}
            >
              Add Selected ({selectedArtifactIds.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Publish Dialog (A12) */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Schedule Publish</DialogTitle>
            <DialogDescription>
              Schedule this report for automatic publishing on a future date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Publish date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-9 text-[13px]"
              />
            </div>
            <p className="text-[12px] text-muted-foreground">
              The report will be automatically published and available for distribution on the selected date.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSchedulePublish} disabled={!scheduledDate}>
              <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
              Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Family Preview Dialog */}
      <Dialog open={familyPreviewOpen} onOpenChange={setFamilyPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Family Portal Preview
            </DialogTitle>
            <DialogDescription>
              This is how the report will appear to {studentName}&apos;s family
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 bg-gradient-to-b from-orange-50/30 to-white rounded-lg p-6 border border-orange-100/50">
            {/* Family-friendly header */}
            <div className="text-center pb-4 border-b border-orange-200/50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#fff2f0] mb-3">
                <BookOpen className="h-6 w-6 text-[#c24e3f]" />
              </div>
              <h2 className="text-[20px] font-semibold text-foreground">{studentName}</h2>
              <p className="text-[14px] text-muted-foreground mt-1">
                {cls?.name} &middot; {cls?.subject}
              </p>
              <p className="text-[13px] text-muted-foreground">
                {cycle?.name} &middot; {cycle?.term} &middot; {cycle?.academicYear}
              </p>
              {student && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-[11px]">
                    To: {student.parentName || "Parent/Guardian"} ({student.parentEmail || "—"})
                  </Badge>
                </div>
              )}
            </div>

            {/* Friendly sections — hide empty sections except teacher_comment (#4) */}
            {sortedSections
              .filter((s) => s.type === "teacher_comment" || !isSectionEmpty(s, { studentGradesCount: studentGrades.length, studentIncidentsCount: studentIncidents.length }))
              .map((section) => (
              <div key={section.configId} className="space-y-2">
                <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                  {section.type === "grades" || section.type === "myp_criteria" || section.type === "dp_grades" ? (
                    <BookOpen className="h-4 w-4 text-[#c24e3f]" />
                  ) : section.type === "attendance" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : section.type === "teacher_comment" ? (
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  ) : section.type === "portfolio_evidence" || section.type === "portfolio" ? (
                    <Image className="h-4 w-4 text-purple-600" />
                  ) : section.type === "learning_goals" || section.type === "atl_skills" ? (
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                  ) : section.type === "behavior_incidents" ? (
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                  ) : null}
                  {section.label}
                </h3>
                {section.type === "teacher_comment" ? (
                  <div className="bg-white rounded-md border p-3">
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                      {(section.content.comment as string) || "No comment provided yet."}
                    </p>
                  </div>
                ) : section.type === "attendance" ? (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white rounded-md border p-2">
                      <div className="text-[16px] font-semibold text-green-600">{attendanceSummary.present}</div>
                      <div className="text-[11px] text-muted-foreground">Present</div>
                    </div>
                    <div className="bg-white rounded-md border p-2">
                      <div className="text-[16px] font-semibold text-red-600">{attendanceSummary.absent}</div>
                      <div className="text-[11px] text-muted-foreground">Absent</div>
                    </div>
                    <div className="bg-white rounded-md border p-2">
                      <div className="text-[16px] font-semibold text-amber-600">{attendanceSummary.late}</div>
                      <div className="text-[11px] text-muted-foreground">Late</div>
                    </div>
                    <div className="bg-white rounded-md border p-2">
                      <div className="text-[16px] font-semibold text-blue-600">{attendanceSummary.excused}</div>
                      <div className="text-[11px] text-muted-foreground">Excused</div>
                    </div>
                  </div>
                ) : section.type === "myp_criteria" ? (
                  <div className="bg-white rounded-md border p-3">
                    {(() => {
                      // Aggregate best criteria scores for Family Preview
                      const criteriaMap: Record<string, { criterion: string; level: number }> = {};
                      studentGrades.forEach((g) => {
                        if (g.mypCriteriaScores?.length) {
                          g.mypCriteriaScores.forEach((cs) => {
                            if (!criteriaMap[cs.criterion] || cs.level > criteriaMap[cs.criterion].level) {
                              criteriaMap[cs.criterion] = { criterion: cs.criterion, level: cs.level };
                            }
                          });
                        }
                      });
                      const entries = ["A", "B", "C", "D"].map((c) => criteriaMap[c] || { criterion: c, level: 0 });
                      const total = entries.reduce((s, e) => s + e.level, 0);
                      const boundary = getMYPBoundaryGrade(total);
                      return (
                        <div className="space-y-3">
                          <table className="w-full text-[13px]">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-1.5 font-medium text-muted-foreground">Criterion</th>
                                <th className="text-center py-1.5 font-medium text-muted-foreground">Achieved</th>
                                <th className="text-center py-1.5 font-medium text-muted-foreground">Max</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entries.map((e) => (
                                <tr key={e.criterion} className="border-b border-border/30">
                                  <td className="py-1.5">Criterion {e.criterion}</td>
                                  <td className="text-center py-1.5 font-medium">{e.level > 0 ? e.level : "—"}</td>
                                  <td className="text-center py-1.5 text-muted-foreground">8</td>
                                </tr>
                              ))}
                              <tr className="border-t-2 border-border font-semibold">
                                <td className="py-1.5">Total</td>
                                <td className="text-center py-1.5">{total}</td>
                                <td className="text-center py-1.5 text-muted-foreground">32</td>
                              </tr>
                            </tbody>
                          </table>
                          {boundary && (
                            <div className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                              <span className="text-[12px] text-muted-foreground">MYP Boundary Grade</span>
                              <span className="text-[16px] font-bold">{boundary}/7</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : section.type === "grades" || section.type === "dp_grades" ? (
                  <div className="bg-white rounded-md border p-3">
                    {studentGrades.length > 0 ? (
                      <div className="space-y-2">
                        {studentGrades.map((g) => (
                          <div key={g.id} className="flex items-center justify-between text-[13px]">
                            <span>{getAssessmentName(g.assessmentId)}</span>
                            <Badge variant="secondary" className="text-[12px]">
                              {g.isMissing
                                ? "Missing"
                                : g.score != null
                                ? `${g.score}%`
                                : g.dpGrade != null
                                ? `${g.dpGrade}/7`
                                : "Not yet graded"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[13px] text-muted-foreground">No grades available yet.</p>
                    )}
                  </div>
                ) : section.type === "learning_goals" || section.type === "atl_skills" ? (
                  <div className="bg-white rounded-md border p-3 space-y-2">
                    <p className="text-[12px] text-muted-foreground">ATL skills progress based on assessments and portfolio evidence this term.</p>
                    {(() => {
                      const atlGoals = learningGoals.filter((g) => g.category === "atl_skill");
                      return atlGoals.map((goal) => {
                        // Find mastery from auto-filled content or live data
                        const skillsData = section.content?.skills as { goalId: string; level?: string; artifactCount?: number }[] | undefined;
                        const saved = skillsData?.find((s) => s.goalId === goal.id);
                        const level = saved?.level || null;
                        const artCount = saved?.artifactCount ?? studentArtifacts.filter((a) => a.learningGoalIds.includes(goal.id)).length;
                        return (
                          <div key={goal.id} className="flex items-center justify-between text-[13px]">
                            <span>{goal.title}</span>
                            <div className="flex items-center gap-2">
                              {level && level !== "not_assessed" ? (
                                <Badge className={`text-[11px] ${MASTERY_COLOR[level] || ""}`} variant="secondary">
                                  {MASTERY_LABEL[level] || level}
                                </Badge>
                              ) : artCount > 0 ? (
                                <span className="text-[12px] text-muted-foreground">{artCount} portfolio {artCount === 1 ? "item" : "items"} linked</span>
                              ) : (
                                <span className="text-[12px] text-muted-foreground">—</span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : section.type === "portfolio" ? (
                  <div className="bg-white rounded-md border p-3">
                    {(() => {
                      const ids = (section.content?.artifactIds as string[]) || [];
                      const items = ids.length > 0
                        ? ids.map((id) => artifacts.find((a) => a.id === id)).filter(Boolean)
                        : studentArtifacts.filter((a) => a.approvalStatus === "approved");
                      if (items.length === 0) return <p className="text-[13px] text-muted-foreground">No portfolio items available.</p>;
                      return (
                        <div className="space-y-2">
                          {items.slice(0, 5).map((art) => art ? (
                            <div key={art.id} className="flex items-center gap-2 text-[13px]">
                              <Image className="h-4 w-4 text-muted-foreground" />
                              <span>{art.title}</span>
                              <Badge variant="outline" className="text-[10px] ml-auto">{art.mediaType}</Badge>
                            </div>
                          ) : null)}
                        </div>
                      );
                    })()}
                  </div>
                ) : section.type === "portfolio_evidence" ? (
                  <div className="bg-white rounded-md border p-3">
                    {((section.content.artifactIds as string[]) || []).length > 0 ? (
                      <div className="space-y-2">
                        {((section.content.artifactIds as string[]) || []).map((aid) => {
                          const artifact = artifacts.find((a) => a.id === aid);
                          return (
                            <div key={aid} className="flex items-center gap-2 text-[13px]">
                              <Image className="h-4 w-4 text-muted-foreground" />
                              <span>{artifact?.title || "Portfolio item"}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[13px] text-muted-foreground">No portfolio evidence attached.</p>
                    )}
                  </div>
                ) : section.type === "behavior_incidents" ? (
                  <div className="bg-white rounded-md border p-3">
                    {studentIncidents.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[12px] text-muted-foreground">
                          {studentIncidents.length} {studentIncidents.length === 1 ? "item" : "items"} recorded this term.
                        </p>
                        {studentIncidents.map((inc) => (
                          <div key={inc.id} className="flex items-center justify-between text-[13px]">
                            <span>{inc.title}</span>
                            <Badge variant="outline" className="text-[10px] capitalize">{inc.status}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[13px] text-muted-foreground">No wellbeing notes this term.</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-md border p-3">
                    <p className="text-[13px] text-muted-foreground">
                      {JSON.stringify(section.content) === "{}" ? "Not assessed this term" : JSON.stringify(section.content)}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Footer */}
            <div className="text-center pt-4 border-t border-orange-200/50">
              <p className="text-[12px] text-muted-foreground">
                Generated by Peach LMS &middot; {format(new Date(), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
            <DialogDescription>
              Print-ready preview for {studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Preview Header */}
            <div className="text-center border-b border-border pb-4">
              <h2 className="text-[18px] font-semibold">{studentName}</h2>
              <p className="text-[13px] text-muted-foreground">
                {cls?.name} &middot; {cls?.subject}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {cycle?.name} &middot; {cycle?.term} &middot;{" "}
                {cycle?.academicYear}
              </p>
            </div>

            {/* Preview Sections */}
            {sortedSections.map((section) => (
              <div key={section.configId} className="space-y-2">
                <h3 className="text-[14px] font-semibold border-b border-border/50 pb-1">
                  {section.label}
                </h3>
                {section.type === "teacher_comment" ? (
                  <p className="text-[13px] whitespace-pre-wrap">
                    {(section.content.comment as string) ||
                      "No comment provided."}
                  </p>
                ) : section.type === "attendance" ? (
                  <p className="text-[13px]">
                    Present: {attendanceSummary.present} | Absent:{" "}
                    {attendanceSummary.absent} | Late: {attendanceSummary.late}{" "}
                    | Total: {attendanceSummary.total}
                  </p>
                ) : section.type === "myp_criteria" ? (
                  <div className="text-[13px]">
                    {(() => {
                      const cMap: Record<string, number> = {};
                      studentGrades.forEach((g) => {
                        g.mypCriteriaScores?.forEach((cs) => {
                          if (!cMap[cs.criterion] || cs.level > cMap[cs.criterion]) cMap[cs.criterion] = cs.level;
                        });
                      });
                      const entries = ["A", "B", "C", "D"].map((c) => ({ c, l: cMap[c] || 0 }));
                      const tot = entries.reduce((s, e) => s + e.l, 0);
                      const bg = getMYPBoundaryGrade(tot);
                      return (
                        <>
                          {entries.map((e) => (
                            <p key={e.c}>Criterion {e.c}: {e.l > 0 ? `${e.l}/8` : "—"}</p>
                          ))}
                          <p className="font-semibold mt-1">Total: {tot}/32 · Boundary Grade: {bg ?? "—"}/7</p>
                        </>
                      );
                    })()}
                  </div>
                ) : section.type === "grades" ||
                  section.type === "dp_grades" ? (
                  <div className="text-[13px]">
                    {studentGrades.length > 0 ? (
                      <ul className="space-y-1">
                        {studentGrades.map((g) => (
                          <li key={g.id}>
                            {getAssessmentName(g.assessmentId)}:{" "}
                            {g.isMissing
                              ? "Missing"
                              : g.score != null
                              ? `${g.score}%`
                              : g.dpGrade != null
                              ? `${g.dpGrade}/7`
                              : "Pending"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">
                        No grades available.
                      </p>
                    )}
                  </div>
                ) : section.type === "learning_goals" || section.type === "atl_skills" ? (
                  <div className="text-[13px]">
                    {(() => {
                      const atlGoals = learningGoals.filter((g) => g.category === "atl_skill");
                      const skillsData = section.content?.skills as { goalId: string; level?: string; artifactCount?: number }[] | undefined;
                      return atlGoals.map((goal) => {
                        const saved = skillsData?.find((s) => s.goalId === goal.id);
                        const level = saved?.level || null;
                        const artCount = saved?.artifactCount ?? 0;
                        return (
                          <p key={goal.id}>
                            {goal.title}:{" "}
                            {level && level !== "not_assessed"
                              ? MASTERY_LABEL[level] || level
                              : artCount > 0
                              ? `${artCount} evidence item${artCount > 1 ? "s" : ""}`
                              : "—"}
                          </p>
                        );
                      });
                    })()}
                  </div>
                ) : section.type === "portfolio" ? (
                  <div className="text-[13px]">
                    {(() => {
                      const ids = (section.content?.artifactIds as string[]) || [];
                      const items = ids.length > 0
                        ? ids.map((id) => artifacts.find((a) => a.id === id)).filter(Boolean)
                        : studentArtifacts.filter((a) => a.approvalStatus === "approved");
                      if (items.length === 0) return <p className="text-muted-foreground">No portfolio items.</p>;
                      return (
                        <ul className="space-y-1">
                          {items.slice(0, 5).map((art) => art ? (
                            <li key={art.id}>{art.title} ({art.mediaType})</li>
                          ) : null)}
                        </ul>
                      );
                    })()}
                  </div>
                ) : section.type === "portfolio_evidence" ? (
                  <div className="text-[13px]">
                    {((section.content.artifactIds as string[]) || []).length > 0 ? (
                      <ul className="space-y-1">
                        {((section.content.artifactIds as string[]) || []).map((aid) => {
                          const artifact = artifacts.find((a) => a.id === aid);
                          return (
                            <li key={aid}>
                              {artifact?.title || aid} ({artifact?.mediaType || "unknown"})
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No evidence attached.</p>
                    )}
                  </div>
                ) : section.type === "behavior_incidents" ? (
                  <div className="text-[13px]">
                    <p>Total incidents: {studentIncidents.length}</p>
                    {studentIncidents.length > 0 && (
                      <ul className="space-y-1 mt-1">
                        {studentIncidents.map((i) => (
                          <li key={i.id}>
                            {i.title} [{i.severity}] -{" "}
                            {format(parseISO(i.reportedAt), "MMM d, yyyy")}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    {JSON.stringify(section.content) === "{}"
                      ? "No content"
                      : JSON.stringify(section.content)}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={handleDownloadPdf}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download PDF
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm section removal */}
      <ConfirmDialog
        open={removeSectionConfirmOpen}
        onOpenChange={setRemoveSectionConfirmOpen}
        title="Remove section?"
        description="This section and its content will be permanently removed from the report. This action cannot be undone."
        confirmLabel="Remove"
        onConfirm={confirmRemoveSection}
        destructive
      />

      {/* Completeness warning before Mark Ready (#3) */}
      <ConfirmDialog
        open={readyWarningOpen}
        onOpenChange={setReadyWarningOpen}
        title="Report has empty sections"
        description={`The following sections have no content: ${emptySectionLabels.join(", ")}. Are you sure you want to mark this report as ready?`}
        confirmLabel="Mark ready anyway"
        onConfirm={confirmMarkReady}
      />

      {/* Publish confirmation (#2) */}
      <ConfirmDialog
        open={publishConfirmOpen}
        onOpenChange={setPublishConfirmOpen}
        title="Publish this report?"
        description={`This will mark ${studentName}'s report as published. It will be visible to coordinators and ready for distribution. This cannot be undone.`}
        confirmLabel="Publish report"
        onConfirm={confirmPublish}
      />

      {/* Distribute confirmation (#2) */}
      <ConfirmDialog
        open={distributeConfirmOpen}
        onOpenChange={setDistributeConfirmOpen}
        title="Distribute to family?"
        description={`This will send ${studentName}'s report to ${student?.parentName || "their family"} (${student?.parentEmail || "email on file"}). They will see it in the Family Portal immediately. This cannot be undone.`}
        confirmLabel="Distribute report"
        onConfirm={confirmDistribute}
        destructive
      />
    </div>
  );
}
