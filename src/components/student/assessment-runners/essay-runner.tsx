"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/stores";
import { generateId } from "@/services/mock-service";
import type { Assessment } from "@/types/assessment";
import type { Submission } from "@/types/submission";
import { toast } from "sonner";
import { getDemoNow } from "@/lib/demo-time";
import { isSubmissionSubmitted } from "@/lib/submission-state";

interface EssayRunnerProps {
  assessment: Assessment;
  submission?: Submission;
  studentId: string;
  classId: string;
  isOpen: boolean;
  isPastDue?: boolean;
}

export function EssayRunner({
  assessment,
  submission,
  studentId,
  classId,
  isOpen,
  isPastDue = false,
}: EssayRunnerProps) {
  const addSubmission = useStore((s) => s.addSubmission);
  const updateSubmission = useStore((s) => s.updateSubmission);
  const [body, setBody] = useState(
    submission?.typedPayload?.essay?.body ?? submission?.content ?? ""
  );
  const alreadySubmitted = isSubmissionSubmitted(submission);
  const canSubmit = isOpen && !alreadySubmitted;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const now = getDemoNow().toISOString();
    const payload = {
      essay: {
        prompt: assessment.essayConfig?.prompt,
        body,
        wordCount: body.trim().split(/\s+/).filter(Boolean).length,
        outline: assessment.essayConfig?.scaffoldPrompts,
      },
    };

    if (submission) {
      updateSubmission(submission.id, {
        assessmentType: "essay",
        content: body,
        typedPayload: payload,
        status: "submitted",
        submittedAt: now,
        isLate: isPastDue,
        updatedAt: now,
      });
    } else {
      addSubmission({
        id: generateId("sub"),
        assessmentId: assessment.id,
        studentId,
        classId,
        assessmentType: "essay",
        status: "submitted",
        content: body,
        attachments: [],
        typedPayload: payload,
        submittedAt: now,
        isLate: isPastDue,
        createdAt: now,
        updatedAt: now,
      });
    }

    toast.success(isPastDue ? "Essay submitted late" : "Essay submitted");
  };

  return (
    <Card className="p-5 gap-0">
      <div className="flex items-center gap-2">
        <h3 className="text-[16px] font-semibold">Essay editor</h3>
        {assessment.essayConfig?.recommendedWords ? (
          <Badge variant="outline" className="text-[10px]">
            {assessment.essayConfig.recommendedWords} words suggested
          </Badge>
        ) : null}
      </div>
      <Textarea
        className="mt-4 min-h-[260px]"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Draft your response here..."
      />
      <div className="mt-4 flex justify-between text-[12px] text-muted-foreground">
        <span>{body.trim().split(/\s+/).filter(Boolean).length} words</span>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {alreadySubmitted ? "Essay submitted" : isOpen ? "Submit essay" : "Submissions closed"}
        </Button>
      </div>
    </Card>
  );
}
