"use client";

import { useEffect } from "react";
import { useStore } from "@/stores";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { GradeFeedbackViewer } from "@/components/student/grade-feedback-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface GradeResultSheetProps {
  open: boolean;
  onClose: () => void;
  assessmentId: string | null;
  studentId: string;
}

export function GradeResultSheet({
  open,
  onClose,
  assessmentId,
  studentId,
}: GradeResultSheetProps) {
  const assessments = useStore((s) => s.assessments);
  const grades = useStore((s) => s.grades);
  const classes = useStore((s) => s.classes);
  const updateGrade = useStore((s) => s.updateGrade);

  const assessment = assessmentId
    ? assessments.find((a) => a.id === assessmentId)
    : null;
  const grade = assessmentId
    ? grades.find(
        (g) => g.studentId === studentId && g.assessmentId === assessmentId
      )
    : null;
  const cls = assessment ? classes.find((c) => c.id === assessment.classId) : null;

  // Mark report as seen when student opens grade result sheet
  useEffect(() => {
    if (open && grade && grade.reportStatus === "unseen") {
      updateGrade(grade.id, { reportStatus: "seen" });
    }
  }, [open, grade, updateGrade]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="sm:max-w-md">
        {assessment && grade ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-[16px]">
                {assessment.title}
              </SheetTitle>
              <SheetDescription className="space-y-1">
                {cls && (
                  <span className="block text-[13px]">{cls.name}</span>
                )}
                <span className="flex items-center gap-1.5 text-[12px]">
                  <Calendar className="h-3.5 w-3.5" />
                  Due {format(new Date(assessment.dueDate), "MMM d, yyyy")}
                </span>
                <Badge variant="outline" className="text-[11px] mt-1 w-fit capitalize">
                  {assessment.gradingMode.replace(/_/g, " ")}
                </Badge>
              </SheetDescription>
            </SheetHeader>

            <GradeFeedbackViewer grade={grade} assessment={assessment} />

            <div className="pt-4 border-t">
              <Link href={`/student/classes/${assessment.classId}/assessments/${assessment.id}`}>
                <Button variant="outline" size="sm" className="text-[13px] w-full">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  View full assessment
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-[13px]">
            Assessment not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
