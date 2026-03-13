import type { Metadata } from "next";
import { FamilyShellLayout } from "@/components/family-shell/family-shell-layout";

export const metadata: Metadata = {
  title: "Family Portal",
  description: "Family-facing IB LMS demo workspace",
};

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return <FamilyShellLayout>{children}</FamilyShellLayout>;
}
