"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Printer, GraduationCap, Lock } from "lucide-react";

// Map grade strings to GPA 4.0 scale
function gradeToGpa(grade: string): number | null {
  // DP numeric grades (1-7) -> GPA
  const num = parseFloat(grade);
  if (!isNaN(num) && num >= 1 && num <= 7) {
    // 7->4.0, 6->3.7, 5->3.3, 4->2.7, 3->2.0, 2->1.3, 1->0.7
    const map: Record<number, number> = { 7: 4.0, 6: 3.7, 5: 3.3, 4: 2.7, 3: 2.0, 2: 1.3, 1: 0.7 };
    return map[Math.round(num)] ?? null;
  }
  // MYP descriptor grades
  const descriptorMap: Record<string, number> = {
    exceeding: 4.0,
    meeting: 3.0,
    approaching: 2.0,
    developing: 1.0,
    beginning: 0.5,
  };
  return descriptorMap[grade.toLowerCase()] ?? null;
}

export default function TranscriptPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const loading = useMockLoading([studentId]);

  const getStudentById = useStore((s) => s.getStudentById);
  const transcripts = useStore((s) => s.transcripts);

  const student = getStudentById(studentId);
  const studentTranscript = transcripts[studentId];

  // Compute cumulative GPA across all years/terms
  const cumulativeGpa = useMemo(() => {
    if (!studentTranscript || studentTranscript.length === 0) return null;
    let totalPoints = 0;
    let count = 0;
    for (const year of studentTranscript) {
      for (const term of year.terms) {
        for (const subject of term.subjects) {
          const gpa = gradeToGpa(subject.grade);
          if (gpa !== null) {
            totalPoints += gpa;
            count++;
          }
        }
      }
    }
    return count > 0 ? (totalPoints / count) : null;
  }, [studentTranscript]);

  // Determine if a year is "historical" (not the current year)
  const currentAcademicYear = useMemo(() => {
    if (!studentTranscript || studentTranscript.length === 0) return null;
    // Latest year is considered current
    return studentTranscript[studentTranscript.length - 1].academicYear;
  }, [studentTranscript]);

  if (loading) return <DetailSkeleton />;
  if (!student)
    return (
      <EmptyState
        icon={AlertCircle}
        title="Student not found"
        description="This student does not exist."
      />
    );

  const studentName = `${student.firstName} ${student.lastName}`;

  if (!studentTranscript || studentTranscript.length === 0)
    return (
      <div>
        <PageHeader
          title={`${studentName} \u2014 Academic Transcript`}
          description={student.gradeLevel}
        />
        <EmptyState
          icon={GraduationCap}
          title="No transcript data"
          description="Transcript records will appear here once available."
        />
      </div>
    );

  return (
    <div>
      <PageHeader
        title={`${studentName} \u2014 Academic Transcript`}
        description={student.gradeLevel}
        primaryAction={{
          label: "Print",
          onClick: () => window.print(),
          icon: Printer,
        }}
      />

      {/* GPA Summary Card */}
      {cumulativeGpa !== null && (
        <Card className="p-5 gap-0 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold mb-0.5">Cumulative GPA</h3>
              <p className="text-[12px] text-muted-foreground">
                Weighted average across all terms and subjects on a 4.0 scale
              </p>
            </div>
            <div className="text-center">
              <p className="text-[28px] font-bold text-[#c24e3f]">
                {cumulativeGpa.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">/ 4.00</p>
            </div>
          </div>
          {/* GPA bar */}
          <div className="mt-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c24e3f] rounded-full transition-all"
                style={{ width: `${Math.min((cumulativeGpa / 4.0) * 100, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-8">
        {studentTranscript.map((year) => {
          const isHistorical = year.academicYear !== currentAcademicYear;
          return (
          <div key={year.academicYear}>
            {/* Academic Year Header */}
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-[18px] font-semibold">
                {year.academicYear}
              </h2>
              {isHistorical && (
                <Badge variant="secondary" className="text-[11px] gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              )}
              <Separator className="flex-1" />
            </div>

            <div className="space-y-6">
              {year.terms.map((term) => (
                <Card
                  key={term.term}
                  className={`p-5 gap-0 ${isHistorical ? "opacity-75 pointer-events-none select-none" : ""}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-semibold">{term.term}</h3>
                      {isHistorical && (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-[11px]">
                      {term.subjects.length} subject
                      {term.subjects.length !== 1 && "s"}
                    </Badge>
                  </div>

                  {/* Subjects Table */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                            Subject
                          </th>
                          <th className="text-center py-2 px-4 font-medium text-muted-foreground">
                            Grade
                          </th>
                          <th className="text-center py-2 px-4 font-medium text-muted-foreground">
                            GPA
                          </th>
                          <th className="text-left py-2 pl-4 font-medium text-muted-foreground">
                            Comments
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {term.subjects.map((subject, idx) => {
                          const subjectGpa = gradeToGpa(subject.grade);
                          return (
                          <tr
                            key={`${term.term}-${subject.subject}-${idx}`}
                            className="border-b border-border/50"
                          >
                            <td className="py-2 pr-4 font-medium">
                              {subject.subject}
                            </td>
                            <td className="text-center py-2 px-4">
                              <span className="inline-flex items-center justify-center h-7 min-w-[28px] px-1.5 rounded-full bg-[#c24e3f]/10 text-[#c24e3f] text-[13px] font-semibold">
                                {subject.grade}
                              </span>
                            </td>
                            <td className="text-center py-2 px-4">
                              <span className="text-[13px] text-muted-foreground">
                                {subjectGpa !== null ? subjectGpa.toFixed(1) : "\u2014"}
                              </span>
                            </td>
                            <td className="py-2 pl-4 text-muted-foreground">
                              {subject.comments || "\u2014"}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Term GPA */}
                  {(() => {
                    const termGrades = term.subjects.map((s) => gradeToGpa(s.grade)).filter((g): g is number => g !== null);
                    const termGpa = termGrades.length > 0 ? termGrades.reduce((a, b) => a + b, 0) / termGrades.length : null;
                    return termGpa !== null ? (
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <span className="text-[12px] font-medium text-muted-foreground">Term GPA:</span>
                        <span className="text-[14px] font-semibold text-[#c24e3f]">{termGpa.toFixed(2)}</span>
                      </div>
                    ) : null;
                  })()}

                  {/* Attendance Summary */}
                  <Separator className="mb-3" />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                      Attendance
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-[#dcfce7] p-2.5 text-center">
                      <p className="text-[16px] font-semibold text-[#16a34a]">
                        {term.attendance.present}
                      </p>
                      <p className="text-[11px] text-[#16a34a]">Present</p>
                    </div>
                    <div className="rounded-lg bg-[#fee2e2] p-2.5 text-center">
                      <p className="text-[16px] font-semibold text-[#dc2626]">
                        {term.attendance.absent}
                      </p>
                      <p className="text-[11px] text-[#dc2626]">Absent</p>
                    </div>
                    <div className="rounded-lg bg-[#fef3c7] p-2.5 text-center">
                      <p className="text-[16px] font-semibold text-[#b45309]">
                        {term.attendance.late}
                      </p>
                      <p className="text-[11px] text-[#b45309]">Late</p>
                    </div>
                    <div className="rounded-lg bg-muted p-2.5 text-center">
                      <p className="text-[16px] font-semibold text-foreground">
                        {term.attendance.total}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Total
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
