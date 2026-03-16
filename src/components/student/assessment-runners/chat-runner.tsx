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

interface ChatRunnerProps {
  assessment: Assessment;
  submission?: Submission;
  studentId: string;
  classId: string;
}

export function ChatRunner({
  assessment,
  submission,
  studentId,
  classId,
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

  const handleSend = () => {
    if (!message.trim()) return;

    const nextTranscript = [
      ...transcript,
      {
        id: generateId("chat_turn"),
        role: "student" as const,
        content: message.trim(),
        createdAt: new Date().toISOString(),
      },
    ];

    const now = new Date().toISOString();
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
        />
        <Button onClick={handleSend}>Send response</Button>
      </div>
    </Card>
  );
}
