import { redirect } from "next/navigation";

export default function GradebookRedirect() {
  redirect("/classes");
}
