"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStudentClasses } from "@/lib/student-selectors";
import { ClassOverviewTab } from "@/components/student/class-overview-tab";
import { ClassWorkTab } from "@/components/student/class-work-tab";
import { ClassGradesTab } from "@/components/student/class-grades-tab";
import { ClassPortfolioTab } from "@/components/student/class-portfolio-tab";
import { ClassCommunicationTab } from "@/components/student/class-communication-tab";
import { ClassScheduleSection } from "@/components/student/class-schedule-section";
import { ClassReportsTab } from "@/components/student/class-reports-tab";
import { AlertCircle, MessageSquare } from "lucide-react";

const VALID_TABS = new Set(["overview", "assessments", "grades", "portfolio", "communication", "schedule", "reports"]);

export default function StudentClassDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const classId = params.classId as string;
  const studentId = useStudentId();
  const loading = useMockLoading([classId]);

  const state = useStore((s) => s);

  // Validate this student is enrolled in this class
  const enrolledClasses = useMemo(
    () => (studentId ? getStudentClasses(state, studentId) : []),
    [state, studentId]
  );
  const cls = enrolledClasses.find((c) => c.id === classId);

  // Tab state from URL
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => {
    if (urlTab && VALID_TABS.has(urlTab)) return urlTab;
    return "overview";
  });

  // Sync URL tab changes
  useEffect(() => {
    if (urlTab && VALID_TABS.has(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  if (loading) return <DetailSkeleton />;

  if (!studentId) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Not signed in"
        description="Please sign in as a student to view this class."
      />
    );
  }

  if (!cls) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Class not found"
        description="This class doesn't exist or you're not enrolled in it."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={cls.name}
        description={`${cls.subject} · ${cls.gradeLevel} · ${cls.academicYear}`}
      >
        <div className="flex items-center gap-3 mt-2">
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[11px]">
              {cls.programme}
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              {cls.term}
            </Badge>
            <Badge variant="secondary" className="text-[11px] capitalize">
              {cls.type}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-[12px] h-7 ml-auto"
            onClick={() => router.push(`/student/messages?startDm=${classId}`)}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            Message teacher
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClassOverviewTab cls={cls} studentId={studentId} />
        </TabsContent>

        <TabsContent value="assessments">
          <ClassWorkTab classId={classId} studentId={studentId} />
        </TabsContent>

        <TabsContent value="grades">
          <ClassGradesTab classId={classId} studentId={studentId} />
        </TabsContent>

        <TabsContent value="schedule">
          <ClassScheduleSection classId={classId} studentId={studentId} />
        </TabsContent>

        <TabsContent value="portfolio">
          <ClassPortfolioTab classId={classId} studentId={studentId} />
        </TabsContent>

        <TabsContent value="reports">
          <ClassReportsTab classId={classId} studentId={studentId} />
        </TabsContent>

        <TabsContent value="communication">
          <ClassCommunicationTab classId={classId} studentId={studentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
