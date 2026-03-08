/**
 * Artifact approval domain logic — single source of truth.
 *
 * Non-React module. Contains no hooks, no store access, no toast calls.
 * Returns update payloads that the caller applies to the store.
 */

import type { PortfolioArtifact, Reflection } from "@/types/portfolio";
import type { FamilyShareRecord } from "@/types/student";

// ---------------------------------------------------------------------------
// Approval actions — return Partial<PortfolioArtifact> payloads
// ---------------------------------------------------------------------------

export function buildApprovePayload(): Partial<PortfolioArtifact> {
  return {
    approvalStatus: "approved",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Request revision: revokes family share (invariant — student work in
 * revision-needed state should never be visible to families).
 */
export function buildRequestRevisionPayload(): Partial<PortfolioArtifact> {
  return {
    approvalStatus: "needs_revision",
    familyShareStatus: "not_shared",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Reset to pending: revokes family share (same invariant as revision).
 */
export function buildResetApprovalPayload(): Partial<PortfolioArtifact> {
  return {
    approvalStatus: "pending",
    familyShareStatus: "not_shared",
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Teacher comment
// ---------------------------------------------------------------------------

export function buildTeacherCommentPayload(
  existingReflection: Reflection | undefined,
  comment: string,
): Partial<PortfolioArtifact> {
  const now = new Date().toISOString();
  return {
    reflection: {
      ...(existingReflection || { text: "", submittedAt: now }),
      teacherComment: comment.trim(),
      teacherCommentAt: now,
    },
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Family share toggle
// ---------------------------------------------------------------------------

export interface FamilyShareResult {
  artifactUpdate: Partial<PortfolioArtifact>;
  /** Non-null when sharing is toggled ON — caller should append to student.familyShareHistory */
  newShareRecord: FamilyShareRecord | null;
}

export function buildFamilySharePayload(
  artifactId: string,
  checked: boolean,
  shareRecordId: string,
): FamilyShareResult {
  const now = new Date().toISOString();
  const status = checked ? ("shared" as const) : ("not_shared" as const);

  return {
    artifactUpdate: {
      familyShareStatus: status,
      updatedAt: now,
    },
    newShareRecord: checked
      ? {
          id: shareRecordId,
          type: "portfolio" as const,
          referenceId: artifactId,
          sharedAt: now,
          status: "shared" as const,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Report eligibility toggle
// ---------------------------------------------------------------------------

export function buildReportEligiblePayload(
  checked: boolean,
): Partial<PortfolioArtifact> {
  return {
    isReportEligible: checked,
    flaggedForReport: checked,
    updatedAt: new Date().toISOString(),
  };
}
