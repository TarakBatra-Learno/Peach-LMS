"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useStore } from "@/stores";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { CardGridSkeleton } from "@/components/shared/skeleton-loader";
import { useMockLoading } from "@/lib/hooks/use-mock-loading";
import { generateId } from "@/services/mock-service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Users,
  BarChart3,
  TrendingUp,
  GraduationCap,
  ClipboardCheck,
  User,
  Target,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { GradeRecord } from "@/types/gradebook";
import type { Assessment } from "@/types/assessment";
import type { LearningGoal } from "@/types/assessment";
import type { Student } from "@/types/student";
import {
  GRADING_MODE_LABELS,
  getGradeCellDisplay,
  getGradePercentage,
} from "@/lib/grade-helpers";

const MYP_CRITERIA_LABELS = ["A", "B", "C", "D"] as const;

export default function GradebookPage() {
  const loading = useMockLoading();
  const classes = useStore((s) => s.classes);
  const students = useStore((s) => s.students);
  const assessments = useStore((s) => s.assessments);
  const grades = useStore((s) => s.grades);
  const learningGoals = useStore((s) => s.learningGoals);
  const getClassById = useStore((s) => s.getClassById);
  const getStudentsByClassId = useStore((s) => s.getStudentsByClassId);
  const getStudentById = useStore((s) => s.getStudentById);
  const getGradesByAssessment = useStore((s) => s.getGradesByAssessment);
  const getGradesByStudent = useStore((s) => s.getGradesByStudent);
  const addGrade = useStore((s) => s.addGrade);
  const updateGrade = useStore((s) => s.updateGrade);

  const activeClassId = useStore((s) => s.ui.activeClassId);

  // Class view state — sync with global class switcher
  const [selectedClassId, setSelectedClassId] = useState(activeClassId || "");
  useEffect(() => {
    setSelectedClassId(activeClassId || "");
  }, [activeClassId]);
  // Student view state
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Grading sheet state
  const [gradingOpen, setGradingOpen] = useState(false);
  const [gradingStudentId, setGradingStudentId] = useState("");
  const [gradingAssessmentId, setGradingAssessmentId] = useState("");
  const [gradingScore, setGradingScore] = useState("");
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [gradingIsMissing, setGradingIsMissing] = useState(false);
  const [gradingMypScores, setGradingMypScores] = useState<
    Record<string, number>
  >({});
  const [gradingDpGrade, setGradingDpGrade] = useState("4");

  // Weight categories state for analytics
  const [showWeights, setShowWeights] = useState(false);
  const [weightCategories, setWeightCategories] = useState<
    Record<string, number>
  >({
    score: 50,
    myp_criteria: 25,
    dp_scale: 25,
  });

  // Class view data
  const selectedClass = selectedClassId
    ? getClassById(selectedClassId)
    : undefined;
  const classStudents = selectedClassId
    ? getStudentsByClassId(selectedClassId)
    : [];
  const classAssessments = useMemo(
    () =>
      assessments.filter(
        (a) => a.classId === selectedClassId && a.status === "published"
      ),
    [assessments, selectedClassId]
  );

  // Student view data
  const selectedStudent = selectedStudentId
    ? getStudentById(selectedStudentId)
    : undefined;
  const studentGrades = selectedStudentId
    ? getGradesByStudent(selectedStudentId)
    : [];
  const studentAssessments = useMemo(() => {
    if (!selectedStudentId) return [];
    const studentAssessmentIds = new Set(
      studentGrades.map((g) => g.assessmentId)
    );
    // Also include published assessments from student's classes that are not yet graded
    const studentObj = getStudentById(selectedStudentId);
    if (!studentObj) return [];
    const classAssms = assessments.filter(
      (a) =>
        studentObj.classIds.includes(a.classId) && a.status === "published"
    );
    classAssms.forEach((a) => studentAssessmentIds.add(a.id));
    return assessments.filter((a) => studentAssessmentIds.has(a.id));
  }, [selectedStudentId, studentGrades, assessments, getStudentById]);

  // Analytics data
  const analytics = useMemo(() => {
    const allValidGrades = grades.filter(
      (g) => !g.isMissing && g.score != null
    );
    const totalGraded = grades.filter((g) => !g.isMissing).length;
    const totalMissing = grades.filter((g) => g.isMissing).length;

    // Overall average (score-based grades)
    let overallAvg = "N/A";
    if (allValidGrades.length > 0) {
      const percentages = allValidGrades
        .map((g) => {
          const asmt = assessments.find((a) => a.id === g.assessmentId);
          if (asmt?.totalPoints && g.score != null)
            return (g.score / asmt.totalPoints) * 100;
          if (g.score != null) return g.score;
          return null;
        })
        .filter((v): v is number => v !== null);
      if (percentages.length > 0) {
        overallAvg = `${Math.round(
          percentages.reduce((s, v) => s + v, 0) / percentages.length
        )}%`;
      }
    }

    // Grade distribution
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    allValidGrades.forEach((g) => {
      const asmt = assessments.find((a) => a.id === g.assessmentId);
      if (!asmt) return;
      const pct = getGradePercentage(g, asmt);
      if (pct === null) return;
      if (pct >= 85) distribution.excellent++;
      else if (pct >= 70) distribution.good++;
      else if (pct >= 50) distribution.fair++;
      else distribution.poor++;
    });

    const totalDistributed = Object.values(distribution).reduce(
      (s, v) => s + v,
      0
    );

    return {
      overallAvg,
      totalGraded,
      totalMissing,
      distribution,
      totalDistributed,
    };
  }, [grades, assessments]);

  // Standards/mastery data: for each learning goal, compute per-student mastery
  const masteryData = useMemo(() => {
    if (!selectedClassId) return { goals: [], matrix: new Map<string, Map<string, { avg: number; level: string }>>() };
    // Filter learning goals that are linked to at least one class assessment
    const linkedGoalIds = new Set(
      classAssessments.flatMap((a) => a.learningGoalIds ?? [])
    );
    const goals = learningGoals.filter((g) => linkedGoalIds.has(g.id));

    // matrix: goalId -> studentId -> { avg, level }
    const matrix = new Map<string, Map<string, { avg: number; level: string }>>();
    for (const goal of goals) {
      const studentMap = new Map<string, { avg: number; level: string }>();
      // Assessments linked to this goal
      const goalAssessments = classAssessments.filter(
        (a) => a.learningGoalIds?.includes(goal.id)
      );
      for (const student of classStudents) {
        const percentages: number[] = [];
        for (const asmt of goalAssessments) {
          const grade = grades.find(
            (g) => g.studentId === student.id && g.assessmentId === asmt.id
          );
          const pct = getGradePercentage(grade, asmt);
          if (pct !== null) percentages.push(pct);
        }
        if (percentages.length > 0) {
          const avg = Math.round(
            percentages.reduce((s, v) => s + v, 0) / percentages.length
          );
          const isDP = selectedClass?.programme === "DP";
          let level = "Beginning";
          if (isDP) {
            // DP thresholds: 86%+ Exceeding, 57%+ Meeting, 43%+ Approaching
            if (avg >= 86) level = "Exceeding";
            else if (avg >= 57) level = "Meeting";
            else if (avg >= 43) level = "Approaching";
          } else {
            // MYP thresholds
            if (avg >= 85) level = "Exceeding";
            else if (avg >= 65) level = "Meeting";
            else if (avg >= 45) level = "Approaching";
          }
          studentMap.set(student.id, { avg, level });
        }
      }
      matrix.set(goal.id, studentMap);
    }
    return { goals, matrix };
  }, [selectedClassId, classAssessments, classStudents, learningGoals, grades]);

  // Bar chart data: grade distribution by decile ranges for selected class
  const classBarChartData = useMemo(() => {
    if (!selectedClassId) return [];
    const buckets = [
      { range: "0-9", min: 0, max: 9, count: 0 },
      { range: "10-19", min: 10, max: 19, count: 0 },
      { range: "20-29", min: 20, max: 29, count: 0 },
      { range: "30-39", min: 30, max: 39, count: 0 },
      { range: "40-49", min: 40, max: 49, count: 0 },
      { range: "50-59", min: 50, max: 59, count: 0 },
      { range: "60-69", min: 60, max: 69, count: 0 },
      { range: "70-79", min: 70, max: 79, count: 0 },
      { range: "80-89", min: 80, max: 89, count: 0 },
      { range: "90-100", min: 90, max: 100, count: 0 },
    ];
    for (const asmt of classAssessments) {
      for (const student of classStudents) {
        const grade = grades.find(
          (g) => g.studentId === student.id && g.assessmentId === asmt.id
        );
        const pct = getGradePercentage(grade, asmt);
        if (pct === null) continue;
        const bucket = buckets.find((b) => pct >= b.min && pct <= b.max);
        if (bucket) bucket.count++;
      }
    }
    return buckets.map((b) => ({ range: b.range, students: b.count }));
  }, [selectedClassId, classAssessments, classStudents, grades]);

  // Class average for the selected class
  const classAvgData = useMemo(() => {
    if (!selectedClassId) return { unweighted: null as number | null, weighted: null as number | null };
    // Unweighted average: simple mean of all grade percentages in this class
    const allPcts: number[] = [];
    // Per grading mode: collect percentages
    const modePcts: Record<string, number[]> = {};
    for (const asmt of classAssessments) {
      for (const student of classStudents) {
        const grade = grades.find(
          (g) => g.studentId === student.id && g.assessmentId === asmt.id
        );
        const pct = getGradePercentage(grade, asmt);
        if (pct !== null) {
          allPcts.push(pct);
          if (!modePcts[asmt.gradingMode]) modePcts[asmt.gradingMode] = [];
          modePcts[asmt.gradingMode].push(pct);
        }
      }
    }
    const unweighted =
      allPcts.length > 0
        ? Math.round(allPcts.reduce((s, v) => s + v, 0) / allPcts.length)
        : null;

    // Weighted average
    let weighted: number | null = null;
    const modes = Object.keys(modePcts);
    if (modes.length > 0) {
      let totalWeight = 0;
      let weightedSum = 0;
      for (const mode of modes) {
        const w = weightCategories[mode] ?? 0;
        const modeAvg =
          modePcts[mode].reduce((s, v) => s + v, 0) / modePcts[mode].length;
        weightedSum += modeAvg * w;
        totalWeight += w;
      }
      if (totalWeight > 0) {
        weighted = Math.round(weightedSum / totalWeight);
      }
    }

    return { unweighted, weighted };
  }, [selectedClassId, classAssessments, classStudents, grades, weightCategories]);

  const openGradingSheet = (studentId: string, assessmentId: string) => {
    const asmt = assessments.find((a) => a.id === assessmentId);
    if (!asmt) return;

    const existingGrade = grades.find(
      (g) => g.studentId === studentId && g.assessmentId === assessmentId
    );

    setGradingStudentId(studentId);
    setGradingAssessmentId(assessmentId);
    setGradingIsMissing(existingGrade?.isMissing ?? false);
    setGradingFeedback(existingGrade?.feedback ?? "");

    if (asmt.gradingMode === "score") {
      setGradingScore(existingGrade?.score?.toString() ?? "");
    } else if (asmt.gradingMode === "dp_scale") {
      setGradingDpGrade(existingGrade?.dpGrade?.toString() ?? "4");
    } else if (asmt.gradingMode === "myp_criteria") {
      const existing: Record<string, number> = {};
      existingGrade?.mypCriteriaScores?.forEach((c) => {
        existing[c.criterion] = c.level;
      });
      setGradingMypScores(existing);
    }

    setGradingOpen(true);
  };

  const handleSaveGrade = () => {
    const asmt = assessments.find((a) => a.id === gradingAssessmentId);
    const student = getStudentById(gradingStudentId);
    if (!asmt || !student) return;

    const existingGrade = grades.find(
      (g) =>
        g.studentId === gradingStudentId &&
        g.assessmentId === gradingAssessmentId
    );
    const now = new Date().toISOString();

    const baseGrade: Partial<GradeRecord> = {
      assessmentId: asmt.id,
      studentId: gradingStudentId,
      classId: asmt.classId,
      gradingMode: asmt.gradingMode,
      feedback: gradingFeedback.trim() || undefined,
      isMissing: gradingIsMissing,
      gradedAt: now,
    };

    if (!gradingIsMissing) {
      if (asmt.gradingMode === "score") {
        baseGrade.score = parseInt(gradingScore) || 0;
        baseGrade.totalPoints = asmt.totalPoints;
      } else if (asmt.gradingMode === "dp_scale") {
        baseGrade.dpGrade = parseInt(gradingDpGrade) || 4;
      } else if (asmt.gradingMode === "myp_criteria") {
        baseGrade.mypCriteriaScores = MYP_CRITERIA_LABELS.map((c) => ({
          criterionId: `crit_${c}`,
          criterion: c,
          level: gradingMypScores[c] ?? 0,
        }));
      }
    }

    if (existingGrade) {
      updateGrade(existingGrade.id, baseGrade);
      toast.success(
        `Grade updated for ${student.firstName} ${student.lastName}`
      );
    } else {
      addGrade({
        id: generateId("grade"),
        ...baseGrade,
      } as GradeRecord);
      toast.success(
        `Grade saved for ${student.firstName} ${student.lastName}`
      );
    }

    setGradingOpen(false);
  };

  const gradingAssessment = assessments.find(
    (a) => a.id === gradingAssessmentId
  );
  const gradingStudentObj = getStudentById(gradingStudentId);

  if (loading)
    return (
      <>
        <PageHeader title="Gradebook" />
        <CardGridSkeleton count={4} />
      </>
    );

  return (
    <div>
      <PageHeader
        title="Gradebook"
        description="View and manage grades across all classes"
      />

      <Tabs defaultValue="class" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="class">Class view</TabsTrigger>
          <TabsTrigger value="student">Student view</TabsTrigger>
          {selectedClassId && (
            <TabsTrigger value="standards">Standards</TabsTrigger>
          )}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Class View Tab */}
        <TabsContent value="class">
          <div className="mb-4">
            <Select
              value={selectedClassId}
              onValueChange={setSelectedClassId}
            >
              <SelectTrigger className="w-[280px] h-9 text-[13px]">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} &middot; {c.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedClassId ? (
            <EmptyState
              icon={BookOpen}
              title="Select a class"
              description="Choose a class above to view its gradebook."
            />
          ) : classAssessments.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No published assessments"
              description="This class has no published assessments to show in the gradebook."
            />
          ) : (
            <Card className="p-0 gap-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[12px] font-medium min-w-[180px] sticky left-0 bg-background z-10">
                        Student
                      </TableHead>
                      {classAssessments.map((asmt) => (
                        <TableHead
                          key={asmt.id}
                          className="text-[12px] font-medium text-center min-w-[90px]"
                        >
                          <Link
                            href={`/assessments/${asmt.id}`}
                            className="hover:text-[#c24e3f] transition-colors"
                            title={`${asmt.title}\nDue: ${asmt.dueDate ? format(parseISO(asmt.dueDate), "MMM d, yyyy") : "No date"}\nMode: ${GRADING_MODE_LABELS[asmt.gradingMode]}`}
                          >
                            {asmt.title.length > 14
                              ? `${asmt.title.slice(0, 14)}...`
                              : asmt.title}
                          </Link>
                          <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                            {GRADING_MODE_LABELS[asmt.gradingMode]}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-[12px] font-medium text-center min-w-[80px]">
                        Average
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classStudents.map((student) => {
                      // Calculate per-student average
                      const studentPercentages = classAssessments
                        .map((asmt) => {
                          const grade = grades.find(
                            (g) =>
                              g.studentId === student.id &&
                              g.assessmentId === asmt.id
                          );
                          return getGradePercentage(grade, asmt);
                        })
                        .filter((v): v is number => v !== null);
                      const studentAvg =
                        studentPercentages.length > 0
                          ? Math.round(
                              studentPercentages.reduce((s, v) => s + v, 0) /
                                studentPercentages.length
                            )
                          : null;

                      return (
                        <TableRow key={student.id}>
                          <TableCell className="sticky left-0 bg-background z-10">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-[#c24e3f]/10 flex items-center justify-center text-[11px] font-semibold text-[#c24e3f]">
                                {student.firstName[0]}
                                {student.lastName[0]}
                              </div>
                              <Link
                                href={`/students/${student.id}?classId=${selectedClassId}`}
                                className="text-[13px] font-medium hover:text-[#c24e3f] transition-colors"
                              >
                                {student.firstName} {student.lastName}
                              </Link>
                            </div>
                          </TableCell>
                          {classAssessments.map((asmt) => {
                            const grade = grades.find(
                              (g) =>
                                g.studentId === student.id &&
                                g.assessmentId === asmt.id
                            );
                            const display = getGradeCellDisplay(grade, asmt);
                            return (
                              <TableCell
                                key={asmt.id}
                                className="text-center"
                              >
                                <button
                                  onClick={() =>
                                    openGradingSheet(student.id, asmt.id)
                                  }
                                  className={`text-[12px] font-medium px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer ${
                                    grade?.isMissing
                                      ? "text-[#dc2626]"
                                      : grade
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {display}
                                </button>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <span
                              className={`text-[12px] font-semibold ${
                                studentAvg !== null
                                  ? studentAvg >= 70
                                    ? "text-[#16a34a]"
                                    : studentAvg >= 50
                                      ? "text-[#b45309]"
                                      : "text-[#dc2626]"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {studentAvg !== null ? `${studentAvg}%` : "-"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Student View Tab */}
        <TabsContent value="student">
          <div className="mb-4">
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
            >
              <SelectTrigger className="w-[280px] h-9 text-[13px]">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedStudentId ? (
            <EmptyState
              icon={User}
              title="Select a student"
              description="Choose a student above to view their grades across all classes."
            />
          ) : studentAssessments.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No assessments"
              description="This student has no assessments to display."
            />
          ) : (
            <div>
              {/* Student summary */}
              {selectedStudent && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-[#c24e3f]/10 flex items-center justify-center text-[13px] font-semibold text-[#c24e3f]">
                    {selectedStudent.firstName[0]}
                    {selectedStudent.lastName[0]}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {selectedStudent.gradeLevel} &middot;{" "}
                      {selectedStudent.classIds.length} classes
                    </p>
                  </div>
                </div>
              )}

              <Card className="p-0 gap-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[12px] font-medium">
                        Assessment
                      </TableHead>
                      <TableHead className="text-[12px] font-medium">
                        Class
                      </TableHead>
                      <TableHead className="text-[12px] font-medium">
                        Mode
                      </TableHead>
                      <TableHead className="text-[12px] font-medium">
                        Grade
                      </TableHead>
                      <TableHead className="text-[12px] font-medium">
                        Due date
                      </TableHead>
                      <TableHead className="text-[12px] font-medium">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentAssessments.map((asmt) => {
                      const cls = getClassById(asmt.classId);
                      const grade = studentGrades.find(
                        (g) => g.assessmentId === asmt.id
                      );
                      const display = getGradeCellDisplay(grade, asmt);
                      return (
                        <TableRow key={asmt.id}>
                          <TableCell>
                            <Link
                              href={`/assessments/${asmt.id}`}
                              className="text-[13px] font-medium hover:text-[#c24e3f] transition-colors"
                            >
                              {asmt.title}
                            </Link>
                          </TableCell>
                          <TableCell className="text-[13px] text-muted-foreground">
                            {cls?.name ?? "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[11px]"
                            >
                              {GRADING_MODE_LABELS[asmt.gradingMode]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-[13px] font-medium ${
                                grade?.isMissing
                                  ? "text-[#dc2626]"
                                  : grade
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {display}
                            </span>
                          </TableCell>
                          <TableCell className="text-[12px] text-muted-foreground">
                            {format(parseISO(asmt.dueDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {grade ? (
                              grade.isMissing ? (
                                <StatusBadge status="missing" />
                              ) : (
                                <StatusBadge status="completed" />
                              )
                            ) : (
                              <StatusBadge status="pending" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Standards / Mastery Tab */}
        {selectedClassId && (
          <TabsContent value="standards">
            {masteryData.goals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No linked learning goals"
                description="No published assessments in this class are linked to learning goals."
              />
            ) : (
              <Card className="p-0 gap-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[12px] font-medium min-w-[200px] sticky left-0 bg-background z-10">
                          Learning goal
                        </TableHead>
                        {classStudents.map((student) => (
                          <TableHead
                            key={student.id}
                            className="text-[12px] font-medium text-center min-w-[100px]"
                          >
                            <Link
                              href={`/students/${student.id}?classId=${selectedClassId}`}
                              className="hover:text-[#c24e3f] transition-colors"
                            >
                              {student.firstName} {student.lastName.charAt(0)}.
                            </Link>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masteryData.goals.map((goal) => {
                        const studentMap = masteryData.matrix.get(goal.id);
                        return (
                          <TableRow key={goal.id}>
                            <TableCell className="sticky left-0 bg-background z-10">
                              <div>
                                <p className="text-[13px] font-medium">
                                  {goal.code}
                                </p>
                                <p className="text-[11px] text-muted-foreground leading-tight">
                                  {goal.title.length > 40
                                    ? `${goal.title.slice(0, 40)}...`
                                    : goal.title}
                                </p>
                              </div>
                            </TableCell>
                            {classStudents.map((student) => {
                              const entry = studentMap?.get(student.id);
                              if (!entry) {
                                return (
                                  <TableCell
                                    key={student.id}
                                    className="text-center text-[12px] text-muted-foreground"
                                  >
                                    -
                                  </TableCell>
                                );
                              }
                              const colorMap: Record<string, string> = {
                                Exceeding:
                                  "bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20",
                                Meeting:
                                  "bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/20",
                                Approaching:
                                  "bg-[#b45309]/10 text-[#b45309] border-[#b45309]/20",
                                Beginning:
                                  "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20",
                              };
                              return (
                                <TableCell
                                  key={student.id}
                                  className="text-center"
                                >
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0.5 ${
                                      colorMap[entry.level] ?? ""
                                    }`}
                                  >
                                    {entry.level}
                                  </Badge>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Overall average"
              value={analytics.overallAvg}
              icon={BarChart3}
            />
            <StatCard
              label="Total graded"
              value={analytics.totalGraded}
              icon={ClipboardCheck}
            />
            <StatCard
              label="Missing"
              value={analytics.totalMissing}
              icon={Users}
            />
            <StatCard
              label="Assessments"
              value={assessments.filter((a) => a.status === "published").length}
              icon={GraduationCap}
            />
          </div>

          {/* Class average summary card (selected class) */}
          {selectedClassId && selectedClass && (
            <Card className="p-5 gap-0 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[16px] font-semibold">
                  {selectedClass.name} &mdash; class average
                </h3>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[12px] text-muted-foreground">Unweighted</p>
                  <p className={`text-[22px] font-bold ${
                    classAvgData.unweighted !== null
                      ? classAvgData.unweighted >= 70
                        ? "text-[#16a34a]"
                        : classAvgData.unweighted >= 50
                          ? "text-[#b45309]"
                          : "text-[#dc2626]"
                      : "text-muted-foreground"
                  }`}>
                    {classAvgData.unweighted !== null ? `${classAvgData.unweighted}%` : "N/A"}
                  </p>
                </div>
                {showWeights && classAvgData.weighted !== null && (
                  <div>
                    <p className="text-[12px] text-muted-foreground">Weighted</p>
                    <p className={`text-[22px] font-bold ${
                      classAvgData.weighted >= 70
                        ? "text-[#16a34a]"
                        : classAvgData.weighted >= 50
                          ? "text-[#b45309]"
                          : "text-[#dc2626]"
                    }`}>
                      {`${classAvgData.weighted}%`}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Grade distribution bar chart (selected class) */}
          {selectedClassId && (
            <Card className="p-5 gap-0 mb-6">
              <h3 className="text-[16px] font-semibold mb-4">
                Grade distribution &mdash; {selectedClass?.name ?? "Class"}
              </h3>
              {classBarChartData.every((d) => d.students === 0) ? (
                <p className="text-[13px] text-muted-foreground">
                  No grade data available for this class yet.
                </p>
              ) : (
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={classBarChartData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                        }}
                        labelFormatter={(label) => `Range: ${String(label)}%`}
                        formatter={(value: number | undefined) => [
                          value ?? 0,
                          "Students",
                        ]}
                      />
                      <Bar
                        dataKey="students"
                        fill="#c24e3f"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          )}

          {/* Weight categories */}
          {selectedClassId && (
            <Card className="p-5 gap-0 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] font-semibold">Weight categories</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-[12px] text-muted-foreground">
                    Enable weights
                  </Label>
                  <Switch checked={showWeights} onCheckedChange={setShowWeights} />
                </div>
              </div>
              {showWeights && (
                <div className="space-y-3">
                  {Object.entries(GRADING_MODE_LABELS).map(([mode, label]) => {
                    // Only show modes that exist in the class assessments
                    const exists = classAssessments.some(
                      (a) => a.gradingMode === mode
                    );
                    if (!exists) return null;
                    return (
                      <div key={mode} className="flex items-center gap-3">
                        <Label className="text-[13px] w-[120px] shrink-0">
                          {label}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={weightCategories[mode] ?? 0}
                          onChange={(e) =>
                            setWeightCategories((prev) => ({
                              ...prev,
                              [mode]: Math.max(
                                0,
                                Math.min(100, parseInt(e.target.value) || 0)
                              ),
                            }))
                          }
                          className="h-8 text-[13px] w-20"
                        />
                        <span className="text-[12px] text-muted-foreground">%</span>
                      </div>
                    );
                  })}
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Total:{" "}
                    {Object.entries(weightCategories)
                      .filter(([mode]) =>
                        classAssessments.some((a) => a.gradingMode === mode)
                      )
                      .reduce((s, [, v]) => s + v, 0)}
                    %
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Grade distribution progress bars */}
          <Card className="p-5 gap-0 mb-6">
            <h3 className="text-[16px] font-semibold mb-4">
              Overall grade distribution
            </h3>
            {analytics.totalDistributed === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No grade data available yet.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium">
                        Excellent (85%+)
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        {analytics.distribution.excellent} students (
                        {Math.round(
                          (analytics.distribution.excellent /
                            analytics.totalDistributed) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                    <Progress
                      value={
                        (analytics.distribution.excellent /
                          analytics.totalDistributed) *
                        100
                      }
                      className="h-2 [&>div]:bg-[#16a34a]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium">
                        Good (70-84%)
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        {analytics.distribution.good} students (
                        {Math.round(
                          (analytics.distribution.good /
                            analytics.totalDistributed) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                    <Progress
                      value={
                        (analytics.distribution.good /
                          analytics.totalDistributed) *
                        100
                      }
                      className="h-2 [&>div]:bg-[#2563eb]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium">
                        Fair (50-69%)
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        {analytics.distribution.fair} students (
                        {Math.round(
                          (analytics.distribution.fair /
                            analytics.totalDistributed) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                    <Progress
                      value={
                        (analytics.distribution.fair /
                          analytics.totalDistributed) *
                        100
                      }
                      className="h-2 [&>div]:bg-[#b45309]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium">
                        Needs improvement (&lt;50%)
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        {analytics.distribution.poor} students (
                        {Math.round(
                          (analytics.distribution.poor /
                            analytics.totalDistributed) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                    <Progress
                      value={
                        (analytics.distribution.poor /
                          analytics.totalDistributed) *
                        100
                      }
                      className="h-2 [&>div]:bg-[#dc2626]"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Per-class summary */}
          <Card className="p-5 gap-0">
            <h3 className="text-[16px] font-semibold mb-4">
              Class averages
            </h3>
            {classes.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No classes available.
              </p>
            ) : (
              <div className="space-y-3">
                {classes.map((cls) => {
                  const classGrades = grades.filter(
                    (g) => g.classId === cls.id && !g.isMissing
                  );
                  const percentages = classGrades
                    .map((g) => {
                      const asmt = assessments.find(
                        (a) => a.id === g.assessmentId
                      );
                      if (!asmt) return null;
                      return getGradePercentage(g, asmt);
                    })
                    .filter((v): v is number => v !== null);
                  const avg =
                    percentages.length > 0
                      ? Math.round(
                          percentages.reduce((s, v) => s + v, 0) /
                            percentages.length
                        )
                      : null;
                  const publishedCount = assessments.filter(
                    (a) =>
                      a.classId === cls.id && a.status === "published"
                  ).length;

                  return (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <Link
                          href={`/classes/${cls.id}`}
                          className="text-[13px] font-medium hover:text-[#c24e3f] transition-colors"
                        >
                          {cls.name}
                        </Link>
                        <p className="text-[12px] text-muted-foreground">
                          {cls.subject} &middot; {publishedCount} assessments
                          &middot; {cls.studentIds.length} students
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[14px] font-semibold ${
                            avg !== null
                              ? avg >= 70
                                ? "text-[#16a34a]"
                                : avg >= 50
                                  ? "text-[#b45309]"
                                  : "text-[#dc2626]"
                              : "text-muted-foreground"
                          }`}
                        >
                          {avg !== null ? `${avg}%` : "N/A"}
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          {classGrades.length} graded
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grading Sheet (shared across tabs) */}
      <Sheet open={gradingOpen} onOpenChange={setGradingOpen}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle className="text-[16px]">
              Grade: {gradingStudentObj?.firstName}{" "}
              {gradingStudentObj?.lastName}
            </SheetTitle>
            <SheetDescription className="text-[13px]">
              {gradingAssessment?.title} &middot;{" "}
              {gradingAssessment
                ? GRADING_MODE_LABELS[gradingAssessment.gradingMode]
                : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            {/* Mark as missing */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[13px] font-medium">
                  Mark as missing
                </Label>
                <p className="text-[12px] text-muted-foreground">
                  Student did not submit this assessment
                </p>
              </div>
              <Switch
                checked={gradingIsMissing}
                onCheckedChange={setGradingIsMissing}
              />
            </div>

            <Separator />

            {/* Score mode */}
            {gradingAssessment?.gradingMode === "score" &&
              !gradingIsMissing && (
                <div className="space-y-1.5">
                  <Label className="text-[13px]">
                    Score{" "}
                    {gradingAssessment.totalPoints &&
                      `(out of ${gradingAssessment.totalPoints})`}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={gradingScore}
                      onChange={(e) => setGradingScore(e.target.value)}
                      placeholder="0"
                      min={0}
                      max={gradingAssessment.totalPoints}
                      className="h-9 text-[13px] w-24"
                    />
                    {gradingAssessment.totalPoints && (
                      <span className="text-[13px] text-muted-foreground">
                        / {gradingAssessment.totalPoints}
                      </span>
                    )}
                  </div>
                  {gradingAssessment.totalPoints &&
                    gradingScore &&
                    parseInt(gradingScore) > 0 && (
                      <p className="text-[12px] text-muted-foreground">
                        {Math.round(
                          (parseInt(gradingScore) /
                            gradingAssessment.totalPoints) *
                            100
                        )}
                        %
                      </p>
                    )}
                </div>
              )}

            {/* MYP Criteria mode */}
            {gradingAssessment?.gradingMode === "myp_criteria" &&
              !gradingIsMissing && (
                <div className="space-y-4">
                  <Label className="text-[13px] font-medium">
                    MYP Criteria levels (1-8)
                  </Label>
                  {MYP_CRITERIA_LABELS.map((criterion) => {
                    const mypCrit =
                      gradingAssessment.mypCriteria?.find(
                        (c) => c.criterion === criterion
                      );
                    return (
                      <div key={criterion} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-[13px]">
                            Criterion {criterion}
                            {mypCrit ? `: ${mypCrit.title}` : ""}
                          </Label>
                          <Badge variant="outline" className="text-[11px]">
                            Level {gradingMypScores[criterion] ?? 0}
                          </Badge>
                        </div>
                        <Select
                          value={(
                            gradingMypScores[criterion] ?? 0
                          ).toString()}
                          onValueChange={(v) =>
                            setGradingMypScores((prev) => ({
                              ...prev,
                              [criterion]: parseInt(v),
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 text-[13px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 9 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i === 0
                                  ? "Not assessed (0)"
                                  : `Level ${i}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}

            {/* DP Scale mode */}
            {gradingAssessment?.gradingMode === "dp_scale" &&
              !gradingIsMissing && (
                <div className="space-y-1.5">
                  <Label className="text-[13px]">DP Grade (1-7)</Label>
                  <Select
                    value={gradingDpGrade}
                    onValueChange={setGradingDpGrade}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} -{" "}
                          {
                            [
                              "",
                              "Very poor",
                              "Poor",
                              "Mediocre",
                              "Satisfactory",
                              "Good",
                              "Very good",
                              "Excellent",
                            ][n]
                          }
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            <Separator />

            {/* Feedback */}
            <div className="space-y-1.5">
              <Label className="text-[13px]">Feedback</Label>
              <Textarea
                value={gradingFeedback}
                onChange={(e) => setGradingFeedback(e.target.value)}
                placeholder="Add feedback for the student..."
                className="text-[13px] min-h-[100px]"
              />
            </div>

            {/* Save button */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setGradingOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSaveGrade}>
                Save grade
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
