import type { Announcement } from "@/types/communication";
import type { FamilyUnitPlanView } from "@/types/family";
import type { GradeRecord } from "@/types/gradebook";
import type { PortfolioArtifact } from "@/types/portfolio";
import type { Report } from "@/types/report";
import type { UnitPlan } from "@/types/unit-planning";

export function isGradeReleasedToLearner(grade?: Pick<GradeRecord, "releasedAt">): boolean {
  return Boolean(grade?.releasedAt);
}

export function isReportDistributedToViewer(
  report: Pick<Report, "distributionStatus">
): boolean {
  return report.distributionStatus === "completed";
}

export function isAnnouncementVisibleToLearner(
  announcement: Pick<Announcement, "status">
): boolean {
  return announcement.status === "sent";
}

export function isArtifactVisibleToFamily(
  artifact: Pick<PortfolioArtifact, "approvalStatus" | "familyShareStatus">
): boolean {
  return artifact.approvalStatus === "approved" && artifact.familyShareStatus !== "not_shared";
}

export function isUnitVisibleToFamily(unit: Pick<UnitPlan, "status">): boolean {
  return unit.status !== "draft" && unit.status !== "archived";
}

export function projectFamilyUnitPlan(unit: UnitPlan): FamilyUnitPlanView {
  const framing = unit.strategy.conceptualFraming;

  return {
    id: unit.id,
    classId: unit.classId,
    title: unit.title,
    code: unit.code,
    summary: unit.summary,
    programme: unit.programme,
    status: unit.status,
    startDate: unit.startDate,
    endDate: unit.endDate,
    conceptualFraming: framing
      ? {
          keyConcept: framing.keyConcept,
          relatedConcepts: framing.relatedConcepts,
          globalContext: framing.globalContext,
          statementOfInquiry: framing.statementOfInquiry,
          atlFocus: framing.atlFocus,
          tokConnection: framing.tokConnection,
          casOpportunity: framing.casOpportunity,
        }
      : undefined,
  };
}
