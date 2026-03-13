"use client";

import { useStore } from "@/stores";
import type { CurrentUser } from "@/types/auth";

export function useCurrentUser(): CurrentUser | null {
  return useStore((s) => s.currentUser);
}

export function useIsStudent(): boolean {
  const user = useCurrentUser();
  return user?.role === "student";
}

export function useIsTeacher(): boolean {
  const user = useCurrentUser();
  return user?.role === "teacher";
}

export function useIsParent(): boolean {
  const user = useCurrentUser();
  return user?.role === "parent";
}

export function useIsAdmin(): boolean {
  const user = useCurrentUser();
  return user?.role === "admin";
}

export function useStudentId(): string | null {
  const user = useCurrentUser();
  if (user?.role === "student" && user.linkedStudentId) {
    return user.linkedStudentId;
  }
  return null;
}

export function useParentId(): string | null {
  const user = useCurrentUser();
  if (user?.role === "parent" && user.linkedParentId) {
    return user.linkedParentId;
  }
  return null;
}
