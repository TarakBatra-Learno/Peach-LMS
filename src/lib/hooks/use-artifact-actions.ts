"use client";

import { useStore } from "@/stores";
import { generateId } from "@/services/mock-service";
import { toast } from "sonner";
import {
  buildApprovePayload,
  buildRequestRevisionPayload,
  buildResetApprovalPayload,
  buildTeacherCommentPayload,
  buildFamilySharePayload,
  buildReportEligiblePayload,
} from "@/lib/artifact-actions";
import type { PortfolioArtifact } from "@/types/portfolio";

/**
 * Hook for artifact approval actions. Wraps the domain module with
 * store access and toast feedback.
 *
 * The optional `onArtifactUpdated` callback lets callers sync local
 * detail-sheet state (e.g., `setDetailArtifact`) after a store update.
 */
export function useArtifactActions(
  onArtifactUpdated?: (id: string, updates: Partial<PortfolioArtifact>) => void,
) {
  const updateArtifact = useStore((s) => s.updateArtifact);
  const updateStudent = useStore((s) => s.updateStudent);
  const students = useStore((s) => s.students);

  const applyUpdate = (id: string, updates: Partial<PortfolioArtifact>) => {
    updateArtifact(id, updates);
    onArtifactUpdated?.(id, updates);
  };

  const handleApprove = (id: string) => {
    const updates = buildApprovePayload();
    applyUpdate(id, updates);
    toast.success("Artifact approved");
  };

  const handleRequestRevision = (id: string) => {
    const updates = buildRequestRevisionPayload();
    applyUpdate(id, updates);
    toast.info("Revision requested — family share revoked");
  };

  const handleResetApproval = (id: string) => {
    const updates = buildResetApprovalPayload();
    applyUpdate(id, updates);
    toast.info("Status reset to pending — family share revoked");
  };

  const handleSaveTeacherComment = (artifact: PortfolioArtifact, comment: string) => {
    if (!comment.trim()) return;
    const updates = buildTeacherCommentPayload(artifact.reflection, comment);
    applyUpdate(artifact.id, updates);
    toast.success("Comment saved");
  };

  const handleToggleFamilyShare = (artifact: PortfolioArtifact, checked: boolean) => {
    const { artifactUpdate, newShareRecord } = buildFamilySharePayload(
      artifact.id,
      checked,
      generateId("fsr"),
    );
    applyUpdate(artifact.id, artifactUpdate);

    if (newShareRecord) {
      const student = students.find((s) => s.id === artifact.studentId);
      if (student) {
        updateStudent(student.id, {
          familyShareHistory: [...(student.familyShareHistory || []), newShareRecord],
        });
      }
    }

    toast.success(checked ? "Shared with family" : "Family sharing removed");
  };

  const handleToggleReportEligible = (id: string, checked: boolean) => {
    const updates = buildReportEligiblePayload(checked);
    applyUpdate(id, updates);
    toast.success(checked ? "Added to report" : "Removed from report");
  };

  return {
    handleApprove,
    handleRequestRevision,
    handleResetApproval,
    handleSaveTeacherComment,
    handleToggleFamilyShare,
    handleToggleReportEligible,
  };
}
