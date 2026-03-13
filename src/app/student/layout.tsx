import type { Metadata } from "next";
import { StudentShellLayout } from "@/components/student-shell/student-shell-layout";

export const metadata: Metadata = {
  title: "Student Portal",
  description: "Student-facing IB LMS demo workspace",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentShellLayout>{children}</StudentShellLayout>;
}
