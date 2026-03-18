"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/stores";
import { generateId } from "@/services/mock-service";
import type { Assessment } from "@/types/assessment";
import type { Submission } from "@/types/submission";
import { toast } from "sonner";
import { getDemoNow } from "@/lib/demo-time";
import { isSubmissionSubmitted } from "@/lib/submission-state";

interface QuizRunnerProps {
  assessment: Assessment;
  submission?: Submission;
  studentId: string;
  classId: string;
  isOpen: boolean;
  isPastDue?: boolean;
}

export function QuizRunner({
  assessment,
  submission,
  studentId,
  classId,
  isOpen,
  isPastDue = false,
}: QuizRunnerProps) {
  const addSubmission = useStore((s) => s.addSubmission);
  const updateSubmission = useStore((s) => s.updateSubmission);
  const initialResponses = useMemo(() => {
    const payload = submission?.typedPayload?.quiz;
    return Object.fromEntries(
      (payload?.responses ?? []).map((response) => [response.questionId, response.response])
    ) as Record<string, string | string[]>;
  }, [submission?.typedPayload?.quiz]);
  const [responses, setResponses] = useState<Record<string, string | string[]>>(initialResponses);
  const alreadySubmitted = isSubmissionSubmitted(submission);
  const canSubmit = isOpen && !alreadySubmitted;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const now = getDemoNow().toISOString();
    const payload = {
      quiz: {
        questionCount: assessment.quizConfig?.questions.length ?? 0,
        responses: (assessment.quizConfig?.questions ?? []).map((question) => ({
          questionId: question.id,
          response: responses[question.id] ?? "",
        })),
      },
    };

    if (submission) {
      updateSubmission(submission.id, {
        assessmentType: "quiz",
        content: "Quiz attempt saved from the runner.",
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
        assessmentType: "quiz",
        status: "submitted",
        content: "Quiz attempt saved from the runner.",
        attachments: [],
        typedPayload: payload,
        submittedAt: now,
        isLate: isPastDue,
        createdAt: now,
        updatedAt: now,
      });
    }

    toast.success(isPastDue ? "Quiz submitted late" : "Quiz submitted");
  };

  return (
    <Card className="p-5 gap-0">
      <div className="flex items-center gap-2">
        <h3 className="text-[16px] font-semibold">Quiz runner</h3>
        <Badge variant="outline" className="text-[10px]">
          {assessment.quizConfig?.questions.length ?? 0} questions
        </Badge>
      </div>
      <div className="mt-4 space-y-4">
        {(assessment.quizConfig?.questions ?? []).map((question, index) => (
          <div key={question.id} className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <Label className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
              Question {index + 1}
            </Label>
            <p className="mt-1 text-[13px] font-medium">{question.prompt}</p>
            <Input
              className="mt-3"
              value={Array.isArray(responses[question.id]) ? (responses[question.id] as string[]).join(", ") : (responses[question.id] as string | undefined) ?? ""}
              onChange={(event) => setResponses((current) => ({ ...current, [question.id]: event.target.value }))}
              placeholder="Enter your answer"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {alreadySubmitted ? "Quiz submitted" : isOpen ? "Submit quiz" : "Submissions closed"}
        </Button>
      </div>
    </Card>
  );
}
