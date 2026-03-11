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
import { createPortfolioRevisionNotification } from "@/lib/notification-events";
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
  const addStudentNotification = useStore((s) => s.addStudentNotification);
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

  const handleRequestRevision = (
    id: string,
    revisionNote?: string,
    studentId?: string,
    artifactTitle?: string,
    wasSharedWithFamily?: boolean,
  ) => {
    const updates = buildRequestRevisionPayload(revisionNote);
    applyUpdate(id, updates);

    // Fire student notification when identity is known
    if (studentId && artifactTitle) {
      addStudentNotification(
        createPortfolioRevisionNotification({
          studentId,
          artifactId: id,
          artifactTitle,
          revisionNote,
        }),
      );
    }

    toast.info(
      wasSharedWithFamily
        ? "Revision requested — family sharing revoked"
        : "Revision requested",
    );
  };

  const handleResetApproval = (id: string, wasSharedWithFamily?: boolean) => {
    const updates = buildResetApprovalPayload();
    applyUpdate(id, updates);
    toast.info(
      wasSharedWithFamily
        ? "Status reset to pending — family sharing revoked"
        : "Status reset to pending",
    );
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
