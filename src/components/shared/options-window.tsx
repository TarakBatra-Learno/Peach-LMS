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
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ShieldOff, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { Student } from "@/types/student";

interface OptionsWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  assessmentTitle: string;
  onExcuse: (studentId: string) => void;
}

export function OptionsWindow({
  open,
  onOpenChange,
  student,
  assessmentTitle,
  onExcuse,
}: OptionsWindowProps) {
  const [excuseConfirm, setExcuseConfirm] = useState(false);

  if (!student) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[360px] sm:max-w-[360px]">
          <SheetHeader>
            <SheetTitle className="text-[16px]">
              Options: {student.firstName} {student.lastName}
            </SheetTitle>
            <SheetDescription className="text-[13px]">
              {assessmentTitle}
            </SheetDescription>
          </SheetHeader>

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
              onClick={() => {
                toast.info("DM feature coming soon");
                onOpenChange(false);
              }}
            >
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              Message student
            </Button>

            <Separator />

            <Button
              variant="ghost"
              className="w-full h-9 text-[13px]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
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
