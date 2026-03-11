"use client";

import { useMemo } from "react";
import { useStore } from "@/stores";
import { useStudentId } from "@/lib/hooks/use-current-user";
import { getStudentClasses } from "@/lib/student-selectors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppState } from "@/stores/types";

export function StudentClassFilter() {
  const studentId = useStudentId();
  const state = useStore() as AppState;
  const studentActiveClassId = useStore((s) => s.ui.studentActiveClassId);
  const setStudentActiveClass = useStore((s) => s.setStudentActiveClass);

  const classes = useMemo(
    () => (studentId ? getStudentClasses(state, studentId) : []),
    [state, studentId]
  );

  if (!studentId || classes.length === 0) return null;

  return (
    <Select
      value={studentActiveClassId ?? "all"}
      onValueChange={(value) => {
        setStudentActiveClass(value === "all" ? null : value);
      }}
    >
      <SelectTrigger className="w-[200px] h-9 text-[13px]">
        <SelectValue placeholder="All classes" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All classes</SelectItem>
        {classes.map((cls) => (
          <SelectItem key={cls.id} value={cls.id}>
            {cls.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
