import type { Metadata } from "next";
import { TeacherShellLayout } from "@/components/shell/teacher-shell-layout";

export const metadata: Metadata = {
  title: "Teacher Portal",
  description: "Teacher-facing IB LMS demo workspace",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <TeacherShellLayout>{children}</TeacherShellLayout>;
}
