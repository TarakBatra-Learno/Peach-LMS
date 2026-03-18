"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/stores";
import { generateId } from "@/services/mock-service";
import type { Assessment } from "@/types/assessment";
import type { ChatTranscriptTurn, Submission } from "@/types/submission";
import { toast } from "sonner";
import { getDemoNow } from "@/lib/demo-time";
import { isSubmissionSubmitted } from "@/lib/submission-state";

interface ChatRunnerProps {
  assessment: Assessment;
  submission?: Submission;
  studentId: string;
  classId: string;
  isOpen: boolean;
  isPastDue?: boolean;
}

export function ChatRunner({
  assessment,
  submission,
  studentId,
  classId,
  isOpen,
  isPastDue = false,
}: ChatRunnerProps) {
  const addSubmission = useStore((s) => s.addSubmission);
  const updateSubmission = useStore((s) => s.updateSubmission);
  const initialTranscript = useMemo<ChatTranscriptTurn[]>(() => {
    const existing = submission?.typedPayload?.chat?.transcript;
    if (existing?.length) return existing;
    return [
      {
        id: "chat_runner_system",
        role: "teacher",
        content: assessment.chatConfig?.starterPrompt ?? "Start the conversation.",
        createdAt: new Date().toISOString(),
      },
    ];
  }, [assessment.chatConfig?.starterPrompt, submission?.typedPayload?.chat?.transcript]);
  const [transcript, setTranscript] = useState<ChatTranscriptTurn[]>(initialTranscript);
  const [message, setMessage] = useState("");
  const alreadySubmitted = isSubmissionSubmitted(submission);
  const canContinue = isOpen && !alreadySubmitted;
  const studentTurnCount = transcript.filter((turn) => turn.role === "student").length;

  const handleSend = () => {
    if (!message.trim() || !canContinue) return;

    const nextTranscript = [
      ...transcript,
      {
        id: generateId("chat_turn"),
        role: "student" as const,
        content: message.trim(),
        createdAt: new Date().toISOString(),
      },
    ];

    const now = getDemoNow().toISOString();
    const payload = {
      chat: {
        transcript: nextTranscript,
        completionSummary: "Student conversation in progress.",
      },
    };

    if (submission) {
      updateSubmission(submission.id, {
        assessmentType: "chat",
        content: "Conversation in progress.",
        typedPayload: payload,
        status: "draft",
        draftSavedAt: now,
        updatedAt: now,
      });
    } else {
      addSubmission({
        id: generateId("sub"),
        assessmentId: assessment.id,
        studentId,
        classId,
        assessmentType: "chat",
        status: "draft",
        content: "Conversation in progress.",
        attachments: [],
        typedPayload: payload,
        draftSavedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    setTranscript(nextTranscript);
    setMessage("");
  };

  const handleSubmitConversation = () => {
    if (!canContinue || studentTurnCount === 0) return;
    const now = getDemoNow().toISOString();
    const payload = {
      chat: {
        transcript,
        completionSummary:
          assessment.chatConfig?.successCriteria?.length
            ? `Student addressed ${Math.min(
                assessment.chatConfig.successCriteria.length,
                studentTurnCount
              )} success criteria in the conversation.`
            : "Conversation submitted for review.",
      },
    };

    if (submission) {
      updateSubmission(submission.id, {
        assessmentType: "chat",
        content: "Conversation submitted for review.",
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
        assessmentType: "chat",
        status: "submitted",
        content: "Conversation submitted for review.",
        attachments: [],
        typedPayload: payload,
        submittedAt: now,
        isLate: isPastDue,
        createdAt: now,
        updatedAt: now,
      });
    }

    toast.success(isPastDue ? "Conversation submitted late" : "Conversation submitted");
  };

  return (
    <Card className="p-5 gap-0">
      <div className="flex items-center gap-2">
        <h3 className="text-[16px] font-semibold">Conversation</h3>
        <Badge variant="outline" className="text-[10px]">
          {assessment.chatConfig?.minimumTurns ?? 0}+ turns
        </Badge>
      </div>
      <div className="mt-4 space-y-3">
        {transcript.map((turn) => (
          <div
            key={turn.id}
            className={`rounded-xl px-4 py-3 text-[13px] ${
              turn.role === "student" ? "bg-[#c24e3f]/10 text-foreground" : "border border-border/70 bg-muted/20"
            }`}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {turn.role}
            </p>
            <p className="mt-1">{turn.content}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Continue the conversation"
          disabled={!canContinue}
        />
        <Button onClick={handleSend} disabled={!canContinue}>
          Send response
        </Button>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          onClick={handleSubmitConversation}
          disabled={!canContinue || studentTurnCount === 0}
        >
          {alreadySubmitted ? "Conversation submitted" : isOpen ? "Submit conversation" : "Submissions closed"}
        </Button>
      </div>
    </Card>
  );
}
