import type { Metadata } from "next";
import { AdminShellLayout } from "@/components/admin-shell/admin-shell-layout";

export const metadata: Metadata = {
  title: "Admin Portal",
  description: "School leadership admin demo workspace",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShellLayout>{children}</AdminShellLayout>;
}
