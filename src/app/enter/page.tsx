"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogIn, GraduationCap } from "lucide-react";
import { useStore } from "@/stores";
import { useState } from "react";
import { TEACHER_ID } from "@/types/auth";
import type { CurrentUser } from "@/types/auth";

const TEACHER_USER: CurrentUser = {
  id: TEACHER_ID,
  name: "Ms. Sarah Mitchell",
  role: "teacher",
};

export default function EnterPage() {
  const router = useRouter();
  const students = useStore((s) => s.students);
  const switchPersona = useStore((s) => s.switchPersona);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Show first 10 students for the picker
  const availableStudents = students.slice(0, 10);

  const handleEnterAsTeacher = () => {
    switchPersona(TEACHER_USER);
    router.push("/dashboard");
  };

  const handleEnterAsStudent = () => {
    if (!selectedStudentId) return;
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const studentUser: CurrentUser = {
      id: `user_${student.id}`,
      name: `${student.firstName} ${student.lastName}`,
      role: "student",
      linkedStudentId: student.id,
    };
    switchPersona(studentUser);
    router.push("/student/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
      <div className="w-full max-w-2xl px-4">
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-bold text-[#c24e3f] tracking-tight">
            Peach
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            IB School Learning Platform
          </p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Demo portal with mock data. All changes are saved locally.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Teacher Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#fff2f0] p-2.5">
                <LogIn className="h-5 w-5 text-[#c24e3f]" />
              </div>
              <div>
                <h2 className="text-[16px] font-semibold">Teacher</h2>
                <p className="text-[12px] text-muted-foreground">Ms. Sarah Mitchell</p>
              </div>
            </div>

            <p className="text-[13px] text-muted-foreground">
              Full access to all classes, assessments, grades, reports, and administration.
            </p>

            <Button
              className="w-full h-10"
              onClick={handleEnterAsTeacher}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Enter as Teacher
            </Button>
          </Card>

          {/* Student Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#fff2f0] p-2.5">
                <GraduationCap className="h-5 w-5 text-[#c24e3f]" />
              </div>
              <div>
                <h2 className="text-[16px] font-semibold">Student</h2>
                <p className="text-[12px] text-muted-foreground">Select a student persona</p>
              </div>
            </div>

            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-full h-9 text-[13px]">
                <SelectValue placeholder="Choose a student..." />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                    <span className="ml-2 text-muted-foreground text-[11px]">
                      ({s.classIds.length} class{s.classIds.length !== 1 ? "es" : ""})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="w-full h-10"
              onClick={handleEnterAsStudent}
              disabled={!selectedStudentId}
              variant={selectedStudentId ? "default" : "outline"}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Enter as Student
            </Button>
          </Card>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          IB World School &middot; Demo Prototype
        </p>
      </div>
    </div>
  );
}
