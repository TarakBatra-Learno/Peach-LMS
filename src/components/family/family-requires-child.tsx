"use client";

import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { getParentChildren } from "@/lib/family-selectors";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface FamilyRequiresChildProps {
  title: string;
  description: string;
}

export function FamilyRequiresChild({
  title,
  description,
}: FamilyRequiresChildProps) {
  const parentId = useParentId();
  const state = useStore((store) => store);
  const setParentActiveStudent = useStore((store) => store.setParentActiveStudent);

  const children = parentId ? getParentChildren(state, parentId) : [];

  return (
    <div className="rounded-[18px] border border-border bg-card p-4">
      <EmptyState
        icon={Users}
        title={title}
        description={description}
      />
      {children.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {children.map((child) => (
            <Button
              key={child.id}
              variant="outline"
              size="sm"
              onClick={() => setParentActiveStudent(child.id)}
            >
              {child.firstName} {child.lastName}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
