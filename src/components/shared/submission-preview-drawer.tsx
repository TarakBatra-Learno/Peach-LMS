"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { FileText, Image, Link as LinkIcon, Clock, Send, Save } from "lucide-react";
import { format } from "date-fns";
import type { Submission } from "@/types/submission";
import type { Student } from "@/types/student";
import { getCanonicalSubmissionStatus } from "@/lib/submission-state";

interface SubmissionPreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
  student: Student | null;
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
  onGradeStudent,
}: SubmissionPreviewDrawerProps) {
  if (!submission || !student) return null;

  const canonicalStatus = getCanonicalSubmissionStatus(submission.status) ?? "draft";
  const statusVariant = canonicalStatus === "submitted" ? "success" : "info";

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
                status={canonicalStatus}
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
            {submission.draftSavedAt && (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Save className="h-3.5 w-3.5" />
                Draft saved {format(new Date(submission.draftSavedAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
            )}
            {submission.submittedAt && (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Send className="h-3.5 w-3.5" />
                Submitted {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
            )}
            {!submission.draftSavedAt && !submission.submittedAt && (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Added {format(new Date(submission.createdAt), "MMM d, yyyy 'at' h:mm a")}
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

          {/* Student reflection */}
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
            {onGradeStudent && (
              <Button size="sm" onClick={onGradeStudent}>
                Open grading sheet
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
