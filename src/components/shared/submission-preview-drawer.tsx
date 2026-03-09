"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { FileText, Image, Link as LinkIcon, Clock, Send, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Submission, SubmissionAttachment } from "@/types/submission";
import type { Student } from "@/types/student";

interface SubmissionPreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
  student: Student | null;
  onReturnWithFeedback: (submissionId: string, comment: string) => void;
  onGradeStudent?: () => void;
}

const ATTACHMENT_ICONS: Record<string, typeof FileText> = {
  document: FileText,
  image: Image,
  link: LinkIcon,
  audio: FileText,
  video: FileText,
};

export function SubmissionPreviewDrawer({
  open,
  onOpenChange,
  submission,
  student,
  onReturnWithFeedback,
  onGradeStudent,
}: SubmissionPreviewDrawerProps) {
  const [returnComment, setReturnComment] = useState("");
  const [showReturnForm, setShowReturnForm] = useState(false);

  if (!submission || !student) return null;

  const handleReturn = () => {
    if (!returnComment.trim()) {
      toast.error("Please add feedback before returning");
      return;
    }
    onReturnWithFeedback(submission.id, returnComment.trim());
    setReturnComment("");
    setShowReturnForm(false);
    onOpenChange(false);
    toast.success(`Submission returned to ${student.firstName} ${student.lastName}`);
  };

  const statusVariant =
    submission.status === "submitted" || submission.status === "resubmitted"
      ? "success"
      : submission.status === "returned"
      ? "warning"
      : submission.status === "draft"
      ? "info"
      : "neutral";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[16px]">
            {student.firstName} {student.lastName}&apos;s Submission
          </SheetTitle>
          <SheetDescription className="text-[13px]">
            <span className="flex items-center gap-2">
              <StatusBadge
                status={submission.status}
                variant={statusVariant}
              />
              {submission.isLate && (
                <Badge className="bg-[#fee2e2] text-[#dc2626] border-transparent text-[10px]">
                  Late
                </Badge>
              )}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Timeline */}
          <div className="space-y-2">
            {submission.submittedAt && (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Submitted {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
            )}
            {submission.returnedAt && (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                Returned {format(new Date(submission.returnedAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
            )}
            {submission.resubmittedAt && (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Send className="h-3.5 w-3.5" />
                Resubmitted {format(new Date(submission.resubmittedAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
            )}
          </div>

          <Separator />

          {/* Submission content */}
          <div>
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Submission content
            </p>
            {submission.content ? (
              <div className="text-[13px] whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
                {submission.content}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground italic">No written content.</p>
            )}
          </div>

          {/* Attachments */}
          {submission.attachments.length > 0 && (
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Attachments ({submission.attachments.length})
              </p>
              <div className="space-y-1.5">
                {submission.attachments.map((att) => {
                  const Icon = ATTACHMENT_ICONS[att.type] ?? FileText;
                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-[13px] flex-1 truncate">{att.name}</span>
                      {att.sourceType && att.sourceType !== "manual" && (
                        <Badge variant="secondary" className="text-[10px]">
                          {att.sourceType === "drive_import" ? "Drive" : "OneDrive"}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student reflection (if resubmission) */}
          {submission.reflection && (
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Student reflection
              </p>
              <div className="text-[13px] whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
                {submission.reflection}
              </div>
            </div>
          )}

          {/* Previous teacher comment */}
          {submission.teacherComment && (
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Your previous feedback
              </p>
              <div className="text-[13px] whitespace-pre-wrap bg-[#fef3c7]/30 rounded-lg p-3 border border-[#b45309]/20">
                {submission.teacherComment}
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            {/* Return with feedback form */}
            {(submission.status === "submitted" || submission.status === "resubmitted") && (
              <>
                {showReturnForm ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[13px]">Feedback for student</Label>
                      <Textarea
                        value={returnComment}
                        onChange={(e) => setReturnComment(e.target.value)}
                        placeholder="Provide feedback on what needs to be revised..."
                        className="mt-1.5 text-[13px] min-h-[80px]"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleReturn} disabled={!returnComment.trim()}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Return with feedback
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setShowReturnForm(false); setReturnComment(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReturnForm(true)}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Return with feedback
                  </Button>
                )}
              </>
            )}

            {/* Grade student button */}
            {onGradeStudent && (
              <Button size="sm" onClick={onGradeStudent}>
                Grade this student
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
