"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Users,
  ClipboardCheck,
  GraduationCap,
  FolderOpen,
  ShieldAlert,
  FileText,
} from "lucide-react";

const MAX_RESULTS_PER_GROUP = 5;

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const students = useStore((s) => s.students);
  const assessments = useStore((s) => s.assessments);
  const classes = useStore((s) => s.classes);
  const artifacts = useStore((s) => s.artifacts);
  const incidents = useStore((s) => s.incidents);
  const reports = useStore((s) => s.reports);
  const reportCycles = useStore((s) => s.reportCycles);

  const lowerQuery = query.toLowerCase().trim();

  const filteredStudents = useMemo(() => {
    if (!lowerQuery) return [];
    return students
      .filter((s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(lowerQuery)
      )
      .slice(0, MAX_RESULTS_PER_GROUP);
  }, [students, lowerQuery]);

  const filteredAssessments = useMemo(() => {
    if (!lowerQuery) return [];
    return assessments
      .filter((a) => a.title.toLowerCase().includes(lowerQuery))
      .slice(0, MAX_RESULTS_PER_GROUP);
  }, [assessments, lowerQuery]);

  const filteredClasses = useMemo(() => {
    if (!lowerQuery) return [];
    return classes
      .filter((c) => c.name.toLowerCase().includes(lowerQuery))
      .slice(0, MAX_RESULTS_PER_GROUP);
  }, [classes, lowerQuery]);

  const filteredArtifacts = useMemo(() => {
    if (!lowerQuery) return [];
    return artifacts
      .filter((a) => a.title.toLowerCase().includes(lowerQuery))
      .slice(0, MAX_RESULTS_PER_GROUP);
  }, [artifacts, lowerQuery]);

  const filteredIncidents = useMemo(() => {
    if (!lowerQuery) return [];
    return incidents
      .filter((i) => i.title.toLowerCase().includes(lowerQuery))
      .slice(0, MAX_RESULTS_PER_GROUP);
  }, [incidents, lowerQuery]);

  const filteredReports = useMemo(() => {
    if (!lowerQuery) return [];
    return reports
      .filter((r) => {
        const student = students.find((s) => s.id === r.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}` : "";
        return studentName.toLowerCase().includes(lowerQuery) || "report".includes(lowerQuery);
      })
      .slice(0, MAX_RESULTS_PER_GROUP);
  }, [reports, students, lowerQuery]);

  const filteredReportCycles = useMemo(() => {
    if (!lowerQuery) return [];
    return reportCycles
      .filter((c) => c.name.toLowerCase().includes(lowerQuery))
      .slice(0, MAX_RESULTS_PER_GROUP);
  }, [reportCycles, lowerQuery]);

  const hasResults =
    filteredStudents.length > 0 ||
    filteredAssessments.length > 0 ||
    filteredClasses.length > 0 ||
    filteredArtifacts.length > 0 ||
    filteredIncidents.length > 0 ||
    filteredReports.length > 0 ||
    filteredReportCycles.length > 0;

  const navigate = useCallback(
    (path: string) => {
      onOpenChange(false);
      setQuery("");
      router.push(path);
    },
    [router, onOpenChange]
  );

  const handleOpenChange = useCallback(
    (value: boolean) => {
      onOpenChange(value);
      if (!value) {
        setQuery("");
      }
    },
    [onOpenChange]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Global Search"
      description="Search across students, assessments, classes, artifacts, and incidents"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Search students, assessments, classes..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {lowerQuery && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {!lowerQuery && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Start typing to search...
          </div>
        )}

        {filteredStudents.length > 0 && (
          <CommandGroup heading="Students">
            {filteredStudents.map((student) => (
              <CommandItem
                key={student.id}
                value={`student-${student.id}-${student.firstName} ${student.lastName}`}
                onSelect={() => navigate(`/students/${student.id}`)}
              >
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>
                  {student.firstName} {student.lastName}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {student.gradeLevel}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredAssessments.length > 0 && (
          <CommandGroup heading="Assessments">
            {filteredAssessments.map((assessment) => (
              <CommandItem
                key={assessment.id}
                value={`assessment-${assessment.id}-${assessment.title}`}
                onSelect={() => navigate(`/assessments/${assessment.id}`)}
              >
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                <span>{assessment.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {assessment.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredClasses.length > 0 && (
          <CommandGroup heading="Classes">
            {filteredClasses.map((cls) => (
              <CommandItem
                key={cls.id}
                value={`class-${cls.id}-${cls.name}`}
                onSelect={() => navigate(`/classes/${cls.id}`)}
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{cls.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {cls.programme}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredArtifacts.length > 0 && (
          <CommandGroup heading="Artifacts">
            {filteredArtifacts.map((artifact) => (
              <CommandItem
                key={artifact.id}
                value={`artifact-${artifact.id}-${artifact.title}`}
                onSelect={() => navigate("/portfolio")}
              >
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span>{artifact.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {artifact.mediaType}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredIncidents.length > 0 && (
          <CommandGroup heading="Incidents">
            {filteredIncidents.map((incident) => (
              <CommandItem
                key={incident.id}
                value={`incident-${incident.id}-${incident.title}`}
                onSelect={() => navigate("/support")}
              >
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                <span>{incident.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {incident.severity}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredReportCycles.length > 0 && (
          <CommandGroup heading="Report Cycles">
            {filteredReportCycles.map((cycle) => (
              <CommandItem
                key={cycle.id}
                value={`cycle-${cycle.id}-${cycle.name}`}
                onSelect={() => navigate(`/reports/cycles/${cycle.id}`)}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{cycle.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {cycle.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredReports.length > 0 && (
          <CommandGroup heading="Reports">
            {filteredReports.map((report) => {
              const student = students.find((s) => s.id === report.studentId);
              const studentName = student
                ? `${student.firstName} ${student.lastName}`
                : "Unknown";
              return (
                <CommandItem
                  key={report.id}
                  value={`report-${report.id}-${studentName}`}
                  onSelect={() => navigate(`/reports/${report.id}`)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Report: {studentName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {report.publishState}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
