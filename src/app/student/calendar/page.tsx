"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DashboardSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentCalendar } from "@/components/student/student-calendar";
import { StudentTimetableView } from "@/components/student/student-timetable-view";
import { Calendar, Clock } from "lucide-react";

export default function StudentCalendarPage() {
  const studentId = useStudentId();
  const loading = useMockLoading([]);
  const [activeTab, setActiveTab] = useState("calendar");

  if (loading) return <DashboardSkeleton />;

  if (!studentId) {
    return (
      <EmptyState
        icon={Calendar}
        title="Not signed in"
        description="Please sign in as a student to view your calendar."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Calendar & Timetable"
        description="Your schedule, deadlines, and class sessions"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="calendar">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="timetable">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Timetable
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <StudentCalendar studentId={studentId} />
        </TabsContent>

        <TabsContent value="timetable">
          <StudentTimetableView studentId={studentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
