import type { Submission, SubmissionLifecycleStatus } from "@/types/submission";

export type CanonicalSubmissionStatus = "draft" | "submitted";

export function getCanonicalSubmissionStatus(
  status: SubmissionLifecycleStatus | null | undefined
): CanonicalSubmissionStatus | null {
  switch (status) {
    case "draft":
    case "returned":
      return "draft";
    case "submitted":
    case "resubmitted":
      return "submitted";
    default:
      return null;
  }
}

export function isSubmissionSubmitted(
  submission: Pick<Submission, "status"> | null | undefined
): boolean {
  return getCanonicalSubmissionStatus(submission?.status) === "submitted";
}

export function isSubmissionDraft(
  submission: Pick<Submission, "status"> | null | undefined
): boolean {
  return getCanonicalSubmissionStatus(submission?.status) === "draft";
}
