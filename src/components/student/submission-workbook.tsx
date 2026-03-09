"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/stores";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { getStudentStatusLabel, getStudentStatusVariant } from "@/lib/grade-helpers";
import { SimulatedDriveImport } from "./simulated-drive-import";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  FileText,
  Image,
  Link as LinkIcon,
  Trash2,
  Upload,
  Cloud,
  Save,
  Send,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { generateId } from "@/services/mock-service";
import type { Submission, SubmissionAttachment } from "@/types/submission";

interface SubmissionWorkbookProps {
  submission: Submission | undefined;
  assessmentId: string;
  studentId: string;
  classId: string;
  isOpen: boolean;
  /** Whether the assessment is past its due date — late submissions get flagged */
  isPastDue?: boolean;
  /** Callback after submission state changes */
  onSubmissionChange?: () => void;
}

const ATTACHMENT_ICONS: Record<string, typeof FileText> = {
  document: FileText,
  image: Image,
  link: LinkIcon,
  audio: FileText,
  video: FileText,
};

export function SubmissionWorkbook({
  submission,
  assessmentId,
  studentId,
  classId,
  isOpen,
  isPastDue = false,
  onSubmissionChange,
}: SubmissionWorkbookProps) {
  const addSubmission = useStore((s) => s.addSubmission);
  const updateSubmission = useStore((s) => s.updateSubmission);

  const [content, setContent] = useState(submission?.content ?? "");
  const [attachments, setAttachments] = useState<SubmissionAttachment[]>(
    submission?.attachments ?? []
  );
  const [reflection, setReflection] = useState(submission?.reflection ?? "");
  const [driveImportOpen, setDriveImportOpen] = useState(false);
  const [submitConfirm, setSubmitConfirm] = useState(false);

  const isReturned = submission?.status === "returned";
  const isSubmitted = submission?.status === "submitted" || submission?.status === "resubmitted";
  const canEdit = !isSubmitted;

  const handleSaveDraft = () => {
    const now = new Date().toISOString();

    if (submission) {
      updateSubmission(submission.id, {
        content,
        attachments,
        reflection: reflection || undefined,
        draftSavedAt: now,
        updatedAt: now,
      });
    } else {
      addSubmission({
        id: generateId("sub"),
        assessmentId,
        studentId,
        classId,
        status: "draft",
        content,
        attachments,
        reflection: reflection || undefined,
        draftSavedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    toast.success("Draft saved");
    onSubmissionChange?.();
  };

  const handleSubmit = () => {
    const now = new Date().toISOString();
    const isResubmit = isReturned;

    if (submission) {
      updateSubmission(submission.id, {
        content,
        attachments,
        reflection: reflection || undefined,
        status: isResubmit ? "resubmitted" : "submitted",
        submittedAt: now,
        ...(isResubmit ? { resubmittedAt: now } : {}),
        ...(isPastDue ? { isLate: true } : {}),
        updatedAt: now,
      });
    } else {
      addSubmission({
        id: generateId("sub"),
        assessmentId,
        studentId,
        classId,
        status: "submitted",
        content,
        attachments,
        reflection: reflection || undefined,
        submittedAt: now,
        ...(isPastDue ? { isLate: true } : {}),
        createdAt: now,
        updatedAt: now,
      });
    }

    setSubmitConfirm(false);
    toast.success(
      isPastDue
        ? isResubmit ? "Work resubmitted (late)" : "Work submitted (late)"
        : isResubmit ? "Work resubmitted" : "Work submitted"
    );
    onSubmissionChange?.();
  };

  const handleAddAttachment = (attachment: SubmissionAttachment) => {
    setAttachments((prev) => [...prev, attachment]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddManualFile = () => {
    // Simulated file upload
    const attachment: SubmissionAttachment = {
      id: generateId("att"),
      name: `Upload_${Date.now()}.pdf`,
      type: "document",
      url: `https://mock-upload.example.com/upload_${Date.now()}.pdf`,
      sourceType: "manual",
    };
    handleAddAttachment(attachment);
    toast.success("File uploaded (simulated)");
  };

  if (!isOpen) {
    // No submission at all — simple closed message
    if (!submission) {
      return (
        <Card className="p-5 gap-0 bg-muted/30">
          <p className="text-[13px] text-muted-foreground text-center">
            This assessment is no longer open for submissions.
          </p>
        </Card>
      );
    }

    // Has a draft or previous submission — show read-only so student can always access their work
    return (
      <Card className="p-5 gap-0 bg-muted/30">
        <div className="flex items-center gap-2 mb-3">
          <StatusBadge
            status={submission.status}
            variant="neutral"
            label={getStudentStatusLabel(submission.status)}
          />
          <span className="text-[11px] text-muted-foreground">
            This assessment is no longer open for submissions.
          </span>
        </div>
        {submission.content && (
          <div className="text-[13px] whitespace-pre-wrap bg-background rounded-lg p-3 mb-3">
            {submission.content}
          </div>
        )}
        {submission.attachments && submission.attachments.length > 0 && (
          <div>
            <p className="text-[12px] text-muted-foreground mb-1.5">
              Attachments ({submission.attachments.length})
            </p>
            <div className="space-y-1.5">
              {submission.attachments.map((att) => {
                const Icon = ATTACHMENT_ICONS[att.type] ?? FileText;
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-[13px] flex-1 truncate">{att.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Submission status bar */}
      {submission && (
        <Card className="p-3 gap-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge
                status={submission.status}
                variant={
                  getStudentStatusVariant(submission.status) ??
                  (submission.status === "submitted" || submission.status === "resubmitted"
                    ? "success"
                    : submission.status === "returned"
                    ? "warning"
                    : "info")
                }
                label={getStudentStatusLabel(submission.status)}
              />
              {submission.draftSavedAt && submission.status === "draft" && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Saved {format(new Date(submission.draftSavedAt), "MMM d, h:mm a")}
                </span>
              )}
              {submission.submittedAt && (submission.status === "submitted" || submission.status === "resubmitted") && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Submitted {format(new Date(submission.submittedAt), "MMM d, h:mm a")}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Late submission warning */}
      {isPastDue && canEdit && (
        <Card className="p-4 gap-0 border-[#dc2626]/20 bg-[#fef2f2]/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#dc2626] shrink-0" />
            <p className="text-[13px] text-[#dc2626]">
              This assessment is past due. Your submission will be marked as late.
            </p>
          </div>
        </Card>
      )}

      {/* Returned feedback */}
      {isReturned && submission?.teacherComment && (
        <Card className="p-4 gap-0 border-[#b45309]/30 bg-[#fef3c7]/20">
          <p className="text-[12px] font-medium text-[#b45309] uppercase tracking-wide mb-1">
            Teacher feedback on your submission
          </p>
          <p className="text-[13px]">{submission.teacherComment}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            You may revise your work and resubmit.
          </p>
        </Card>
      )}

      {/* Content area */}
      <Card className="p-5 gap-0">
        <h3 className="text-[16px] font-semibold mb-3">
          {isReturned ? "Revise & resubmit" : isSubmitted ? "Your submission" : "Your work"}
        </h3>

        {canEdit ? (
          <div className="space-y-4">
            <div>
              <Label className="text-[13px]">Submission content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your response here..."
                className="mt-1.5 text-[13px] min-h-[150px]"
              />
            </div>

            {/* Reflection prompt (for returned work) */}
            {isReturned && (
              <div>
                <Label className="text-[13px]">Reflection</Label>
                <Textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Reflect on what you've changed in this revision..."
                  className="mt-1.5 text-[13px] min-h-[80px]"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-[13px] whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
            {submission?.content || <span className="text-muted-foreground italic">No written content</span>}
          </div>
        )}

        {/* Attachments */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-[13px]">
              Attachments ({attachments.length})
            </Label>
            {canEdit && (
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={handleAddManualFile}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => setDriveImportOpen(true)}
                >
                  <Cloud className="h-3 w-3 mr-1" />
                  Import
                </Button>
              </div>
            )}
          </div>

          {attachments.length > 0 ? (
            <div className="space-y-1.5">
              {attachments.map((att) => {
                const Icon = ATTACHMENT_ICONS[att.type] ?? FileText;
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-[13px] flex-1 truncate">{att.name}</span>
                    {att.sourceType && att.sourceType !== "manual" && (
                      <Badge variant="secondary" className="text-[10px]">
                        {att.sourceType === "drive_import" ? "Drive" : "OneDrive"}
                      </Badge>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveAttachment(att.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground">No files attached yet.</p>
          )}
        </div>

        {/* Action buttons */}
        {canEdit && (
          <>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save draft
              </Button>
              <Button
                size="sm"
                onClick={() => setSubmitConfirm(true)}
                disabled={!content.trim() && attachments.length === 0}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {isReturned ? "Resubmit" : "Submit"}
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Drive import dialog */}
      <SimulatedDriveImport
        open={driveImportOpen}
        onOpenChange={setDriveImportOpen}
        onImport={handleAddAttachment}
      />

      {/* Submit confirmation */}
      <ConfirmDialog
        open={submitConfirm}
        onOpenChange={setSubmitConfirm}
        title={isReturned ? "Resubmit your work?" : "Submit your work?"}
        description={
          isReturned
            ? "Your revised work will be resubmitted to your teacher for review."
            : "Once submitted, you won't be able to edit your work unless your teacher returns it."
        }
        confirmLabel={isReturned ? "Resubmit" : "Submit"}
        onConfirm={handleSubmit}
      />
    </div>
  );
}
