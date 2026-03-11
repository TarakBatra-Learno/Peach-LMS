"use client";

import { useStore } from "@/stores";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { computeUnreleasedGradesCount } from "@/lib/selectors/grade-selectors";
import { Users, ClipboardCheck, FolderOpen, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ClassesPage() {
  const loading = useMockLoading();
  const router = useRouter();
  const classes = useStore((s) => s.classes);
  const assessments = useStore((s) => s.assessments);
  const grades = useStore((s) => s.grades);
  const artifacts = useStore((s) => s.artifacts);

  if (loading) return <><PageHeader title="Classes" /><CardGridSkeleton count={3} /></>;

  return (
    <div>
      <PageHeader title="Classes" description="Your assigned classes this term" />
      {classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classes assigned"
          description="Classes will appear here once they are assigned to your account."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const classAssessments = assessments.filter((a) => a.classId === cls.id);
            const liveAssessments = classAssessments.filter((a) => a.status === "live" || a.status === "published");
            const publishedCount = liveAssessments.length;
            // Find assessments that require marking (have unreleased grades)
            const assessmentsNeedingMarking = liveAssessments
              .map((asmt) => {
                const asmtGrades = grades.filter((g) => g.assessmentId === asmt.id);
                const count = computeUnreleasedGradesCount(asmtGrades, asmt.id);
                return { asmt, count };
              })
              .filter((x) => x.count > 0);
            const totalUnreleased = assessmentsNeedingMarking.reduce((sum, x) => sum + x.count, 0);
            // If exactly one assessment needs marking, link directly to it; otherwise link to the assessments tab
            const requireMarkingHref =
              assessmentsNeedingMarking.length === 1
                ? `/assessments/${assessmentsNeedingMarking[0].asmt.id}?classId=${cls.id}`
                : `/classes/${cls.id}?tab=assessments`;
            const pendingArtifacts = artifacts.filter(
              (a) => a.classId === cls.id && a.approvalStatus === "pending"
            ).length;

            return (
              <Link key={cls.id} href={`/classes/${cls.id}`}>
                <Card className="p-5 gap-0 h-full hover:shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:border-border/80 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[16px] font-semibold">{cls.name}</h3>
                      <p className="text-[13px] text-muted-foreground">{cls.subject}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-[11px]">{cls.programme}</Badge>
                      <StatusBadge status={cls.type} showIcon={false} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {cls.studentIds.length} students
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      {publishedCount} assessments
                    </span>
                    {pendingArtifacts > 0 && (
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3.5 w-3.5" />
                        {pendingArtifacts} to review
                      </span>
                    )}
                  </div>
                  {totalUnreleased > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-3">
                      <button
                        className="inline-flex items-center"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(requireMarkingHref);
                        }}
                      >
                        <Badge className="bg-[#dbeafe] text-[#2563eb] border-[#2563eb]/20 text-[11px] font-medium hover:bg-[#bfdbfe] transition-colors cursor-pointer">
                          {totalUnreleased} Require Marking →
                        </Badge>
                      </button>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
