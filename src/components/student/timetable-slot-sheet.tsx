"use client";

import { useMemo } from "react";
import { useStore } from "@/stores";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  MapPin,
  BookOpen,
  ClipboardCheck,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { EnrichedTimetableSlot } from "@/lib/student-selectors";
import { getStudentAssessments } from "@/lib/student-selectors";
import { useReleasedAssessmentClick } from "@/lib/hooks/use-released-assessment-click";
import { GradeResultSheet } from "@/components/student/grade-result-sheet";


interface TimetableSlotSheetProps {
  slot: EnrichedTimetableSlot | null;
  open: boolean;
  onClose: () => void;
  studentId: string;
}

export function TimetableSlotSheet({
  slot,
  open,
  onClose,
  studentId,
}: TimetableSlotSheetProps) {
  const state = useStore((s) => s);
  const { handleClick, sheetProps } = useReleasedAssessmentClick(studentId);

  // All assessments for this class
  const classAssessments = useMemo(() => {
    if (!slot) return [];
    return getStudentAssessments(state, studentId, slot.classId);
  }, [state, studentId, slot]);

  // Assessments due on the same day
  const dueAssessments = useMemo(() => {
    if (!slot) return [];
    return classAssessments.filter((a) => a.dueDate.split("T")[0] === slot.date);
  }, [classAssessments, slot]);

  // Live assessments (not yet due or recently due, excluding ones already in dueAssessments)
  const liveAssessments = useMemo(() => {
    if (!slot) return [];
    const dueIds = new Set(dueAssessments.map((a) => a.id));
    return classAssessments.filter((a) => !dueIds.has(a.id));
  }, [classAssessments, dueAssessments, slot]);

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="sm:max-w-md">
          {slot ? (
            <>
              <SheetHeader>
                <SheetTitle className="text-[16px]">
                  {slot.className}
                </SheetTitle>
                <SheetDescription className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[13px]">
                    <Clock className="h-3.5 w-3.5" />
                    {slot.slotStartTime} – {slot.slotEndTime}
                  </span>
                  {slot.room && (
                    <span className="flex items-center gap-1.5 text-[12px]">
                      <MapPin className="h-3.5 w-3.5" />
                      {slot.room}
                    </span>
                  )}
                  <span className="block text-[12px]">
                    {format(new Date(slot.date + "T12:00:00"), "EEEE, MMMM d, yyyy")}
                  </span>
                </SheetDescription>
              </SheetHeader>

              {/* Lesson section */}
              <div>
                <h4 className="text-[13px] font-semibold flex items-center gap-1.5 mb-2">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  Lesson
                </h4>
                {slot.lesson ? (
                  <Card className="p-3 gap-0">
                    <p className="text-[13px] font-medium">{slot.lesson.title}</p>
                    {slot.unitTitle && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Unit: {slot.unitTitle}
                      </p>
                    )}
                    {slot.lesson.objectives && slot.lesson.objectives.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Objectives
                        </p>
                        <ul className="space-y-0.5">
                          {slot.lesson.objectives.map((obj, i) => (
                            <li key={i} className="text-[12px] text-muted-foreground">
                              • {obj}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    No lesson assigned for this slot
                  </p>
                )}
              </div>

              {/* Assessments due today */}
              {dueAssessments.length > 0 && (
                <div>
                  <h4 className="text-[13px] font-semibold flex items-center gap-1.5 mb-2">
                    <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    Due today
                  </h4>
                  <div className="space-y-2">
                    {dueAssessments.map((asmt) => (
                      <Card
                        key={asmt.id}
                        className="p-3 gap-0 cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => handleClick(asmt.id, asmt.classId)}
                      >
                        <p className="text-[13px] font-medium">{asmt.title}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span>{asmt.gradingMode.replace(/_/g, " ")}</span>
                          {asmt.totalPoints && asmt.gradingMode === "score" && (
                            <span>{asmt.totalPoints} pts</span>
                          )}
                          {asmt.gradesReleased && (
                            <Badge variant="secondary" className="text-[10px] bg-[#dcfce7] text-[#16a34a]">
                              Graded
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* All live assessments for this class */}
              {liveAssessments.length > 0 && (
                <div>
                  {dueAssessments.length > 0 && <Separator className="my-1" />}
                  <h4 className="text-[13px] font-semibold flex items-center gap-1.5 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Assessments
                  </h4>
                  <div className="space-y-2">
                    {liveAssessments.map((asmt) => (
                      <Card
                        key={asmt.id}
                        className="p-3 gap-0 cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => handleClick(asmt.id, asmt.classId)}
                      >
                        <p className="text-[13px] font-medium">{asmt.title}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span>{asmt.gradingMode.replace(/_/g, " ")}</span>
                          {asmt.totalPoints && asmt.gradingMode === "score" && (
                            <span>{asmt.totalPoints} pts</span>
                          )}
                          <span>Due {format(new Date(asmt.dueDate), "MMM d")}</span>
                          {asmt.gradesReleased && (
                            <Badge variant="secondary" className="text-[10px] bg-[#dcfce7] text-[#16a34a]">
                              Graded
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Go to class page link */}
              <div className="pt-4 border-t">
                <Link href={`/student/classes/${slot.classId}`}>
                  <Button variant="outline" size="sm" className="text-[13px] w-full">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Go to class page
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-[13px]">
              No slot selected
            </div>
          )}
        </SheetContent>
      </Sheet>
      <GradeResultSheet {...sheetProps} />
    </>
  );
}
