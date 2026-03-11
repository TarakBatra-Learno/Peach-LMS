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
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ShieldOff, MessageCircle, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Student } from "@/types/student";

interface OptionsWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  assessmentTitle: string;
  onExcuse: (studentId: string) => void;
  onSendMessage?: (studentId: string, message: string) => void;
}

export function OptionsWindow({
  open,
  onOpenChange,
  student,
  assessmentTitle,
  onExcuse,
  onSendMessage,
}: OptionsWindowProps) {
  const [excuseConfirm, setExcuseConfirm] = useState(false);
  const [messageMode, setMessageMode] = useState(false);
  const [messageText, setMessageText] = useState("");

  if (!student) return null;

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setMessageMode(false);
      setMessageText("");
    }
    onOpenChange(isOpen);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (onSendMessage) {
      onSendMessage(student.id, messageText.trim());
    }
    setMessageText("");
    setMessageMode(false);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-[360px] sm:max-w-[360px]">
          <SheetHeader>
            <SheetTitle className="text-[16px]">
              {messageMode ? (
                <span className="flex items-center gap-2">
                  <button
                    onClick={() => { setMessageMode(false); setMessageText(""); }}
                    className="hover:bg-muted rounded p-0.5 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  Message {student.firstName}
                </span>
              ) : (
                <>Options: {student.firstName} {student.lastName}</>
              )}
            </SheetTitle>
            <SheetDescription className="text-[13px]">
              {messageMode
                ? "Send a direct message about this assessment."
                : assessmentTitle}
            </SheetDescription>
          </SheetHeader>

          {messageMode ? (
            <div className="space-y-4 mt-6">
              <div className="rounded-lg border border-border p-3 bg-muted/30">
                <p className="text-[11px] text-muted-foreground mb-1">Re: {assessmentTitle}</p>
                <p className="text-[12px] text-foreground">
                  To: {student.firstName} {student.lastName}
                </p>
              </div>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[120px] text-[13px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-[13px]"
                  onClick={() => { setMessageMode(false); setMessageText(""); }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-9 text-[13px]"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Send message
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10"
                onClick={() => setExcuseConfirm(true)}
              >
                <ShieldOff className="h-4 w-4 text-muted-foreground" />
                Mark as excused
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10"
                onClick={() => setMessageMode(true)}
              >
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Message student
              </Button>

              <Separator />

              <Button
                variant="ghost"
                className="w-full h-9 text-[13px]"
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={excuseConfirm}
        onOpenChange={setExcuseConfirm}
        title="Excuse student"
        description="Excusing this student will permanently clear any existing grade data. This cannot be undone."
        confirmLabel="Excuse student"
        onConfirm={() => {
          onExcuse(student.id);
          setExcuseConfirm(false);
          onOpenChange(false);
        }}
        destructive
      />
    </>
  );
}
