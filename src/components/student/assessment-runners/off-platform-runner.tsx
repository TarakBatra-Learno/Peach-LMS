"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Assessment } from "@/types/assessment";
import type { Submission } from "@/types/submission";
import { SubmissionWorkbook } from "@/components/student/submission-workbook";
import { getCanonicalSubmissionStatus } from "@/lib/submission-state";

interface OffPlatformRunnerProps {
  assessment: Assessment;
  submission?: Submission;
  assessmentId: string;
  studentId: string;
  classId: string;
  isOpen: boolean;
  isPastDue?: boolean;
}

export function OffPlatformRunner({
  assessment,
  submission,
  assessmentId,
  studentId,
  classId,
  isOpen,
  isPastDue,
}: OffPlatformRunnerProps) {
  if (assessment.offPlatformConfig?.submissionMode === "offline_mode") {
    const status = getCanonicalSubmissionStatus(submission?.status);
    const completed = status === "submitted" || assessment.status === "closed";

    return (
      <Card className="p-5 gap-0">
        <div className="flex items-center gap-2">
          <p className="text-[16px] font-semibold">Off-platform task</p>
          <Badge variant="secondary" className="text-[10px]">
            Offline mode
          </Badge>
        </div>
        <p className="mt-2 text-[13px] text-muted-foreground">
          The teacher captures evidence during the conference or practical. Students do not submit work digitally for this task.
        </p>
        <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
          <p className="text-[13px] font-medium">
            {completed ? "Completed off-platform" : "Scheduled off-platform"}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Review the instructions and be ready with your practical evidence or live response.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="p-5 gap-0">
        <div className="flex items-center gap-2">
          <p className="text-[16px] font-semibold">Off-platform workspace</p>
          <Badge variant="outline" className="text-[10px]">
            Digital submission
          </Badge>
        </div>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Submit attachments, short reflections, and supporting evidence for work completed beyond the runner itself.
        </p>
      </Card>

      <SubmissionWorkbook
        submission={submission}
        assessmentId={assessmentId}
        studentId={studentId}
        classId={classId}
        isOpen={isOpen}
        isPastDue={isPastDue}
      />
    </div>
  );
}
