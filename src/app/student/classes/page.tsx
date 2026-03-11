"use client";

import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { BookOpen, Users, Clock, ClipboardCheck } from "lucide-react";
import { getStudentClasses, getStudentAssessments } from "@/lib/student-selectors";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppState } from "@/stores/types";

function ClassCardSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-5 w-40 mb-2" />
      <Skeleton className="h-4 w-24 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </Card>
  );
}

export default function StudentClassesPage() {
  const studentId = useStudentId();
  const state = useStore() as AppState;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!studentId) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Classes" />
        <EmptyState
          icon={BookOpen}
          title="No student selected"
          description="Go to the entry page to select a student persona."
        />
      </div>
    );
  }

  const classes = getStudentClasses(state, studentId);

  if (!ready) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ClassCardSkeleton />
          <ClassCardSkeleton />
          <ClassCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        description={`${classes.length} enrolled class${classes.length !== 1 ? "es" : ""}`}
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classes"
          description="You are not enrolled in any classes yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const assessments = getStudentAssessments(state, studentId, cls.id);
            const classStudentCount = cls.studentIds.length;
            const scheduleSlots = cls.schedule.length;

            return (
              <Link key={cls.id} href={`/student/classes/${cls.id}`}>
                <Card className="p-5 hover:border-[#c24e3f]/30 hover:shadow-sm transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-[16px] font-semibold text-foreground leading-tight">
                      {cls.name}
                    </h3>
                    <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                      {cls.programme}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-muted-foreground mb-3">{cls.subject}</p>

                  <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      {assessments.length} assessments
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {classStudentCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {scheduleSlots} slots/wk
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
