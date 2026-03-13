"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/stores";
import { DashboardSkeleton } from "@/components/shared/skeleton-loader";
import type { UserRole } from "@/types/auth";

function ShellLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-5xl px-6">
        <DashboardSkeleton />
      </div>
    </div>
  );
}

export function PersonaShellGuard({
  role,
  children,
}: {
  role: UserRole | UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentUser = useStore((store) => store.currentUser);
  const classes = useStore((store) => store.classes);
  const students = useStore((store) => store.students);
  const parentProfiles = useStore((store) => store.parentProfiles);
  const activeAcademicYear = useStore((store) => store.ui.activeAcademicYear);
  const activeClassId = useStore((store) => store.ui.activeClassId);
  const studentActiveClassId = useStore((store) => store.ui.studentActiveClassId);
  const parentActiveStudentId = useStore((store) => store.ui.parentActiveStudentId);
  const setActiveClass = useStore((store) => store.setActiveClass);
  const setStudentActiveClass = useStore((store) => store.setStudentActiveClass);
  const setParentActiveStudent = useStore((store) => store.setParentActiveStudent);

  const allowedRoles = useMemo(() => (Array.isArray(role) ? role : [role]), [role]);
  const linkedStudent =
    currentUser?.role === "student" && currentUser.linkedStudentId
      ? students.find((student) => student.id === currentUser.linkedStudentId)
      : null;
  const linkedParent =
    currentUser?.role === "parent" && currentUser.linkedParentId
      ? parentProfiles.find((profile) => profile.id === currentUser.linkedParentId)
      : null;

  const hasExpectedPersona =
    Boolean(currentUser?.role) &&
    allowedRoles.includes(currentUser!.role) &&
    (currentUser?.role !== "student" || Boolean(linkedStudent)) &&
    (currentUser?.role !== "parent" || Boolean(linkedParent));

  useEffect(() => {
    if (!hasExpectedPersona) {
      router.replace("/enter");
      return;
    }

    if ((currentUser?.role === "teacher" || currentUser?.role === "admin") && activeClassId) {
      const activeClass = classes.find((entry) => entry.id === activeClassId);
      if (!activeClass || activeClass.academicYear !== activeAcademicYear) {
        setActiveClass(null);
      }
    }

    if (currentUser?.role === "student" && linkedStudent && studentActiveClassId) {
      if (!linkedStudent.classIds.includes(studentActiveClassId)) {
        setStudentActiveClass(null);
      }
    }

    if (currentUser?.role === "parent" && linkedParent) {
      const linkedChildIds = linkedParent.linkedStudentIds;
      if (parentActiveStudentId && !linkedChildIds.includes(parentActiveStudentId)) {
        setParentActiveStudent(linkedChildIds.length === 1 ? linkedChildIds[0] : null);
        return;
      }
      if (!parentActiveStudentId && linkedChildIds.length === 1) {
        setParentActiveStudent(linkedChildIds[0]);
      }
    }
  }, [
    activeAcademicYear,
    activeClassId,
    allowedRoles,
    classes,
    currentUser?.role,
    hasExpectedPersona,
    linkedParent,
    linkedStudent,
    parentActiveStudentId,
    role,
    router,
    setActiveClass,
    setParentActiveStudent,
    setStudentActiveClass,
    studentActiveClassId,
  ]);

  if (!hasExpectedPersona) {
    return <ShellLoadingState />;
  }

  return <>{children}</>;
}
