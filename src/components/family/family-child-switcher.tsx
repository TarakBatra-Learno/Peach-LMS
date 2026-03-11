"use client";

import { useStore } from "@/stores";
import { useParentId } from "@/lib/hooks/use-current-user";
import { getEffectiveParentStudentId, getParentChildren, getParentProfile } from "@/lib/family-selectors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FamilyChildSwitcher({ className }: { className?: string }) {
  const parentId = useParentId();
  const state = useStore((store) => store);
  const setParentActiveStudent = useStore((store) => store.setParentActiveStudent);

  const parent = parentId ? getParentProfile(state, parentId) : undefined;
  const children = parentId ? getParentChildren(state, parentId) : [];
  const effectiveChildId = parentId ? getEffectiveParentStudentId(state, parentId) : null;

  const value = effectiveChildId ?? (children.length > 1 ? "all" : children[0]?.id ?? "");

  let triggerLabel = "No children linked";
  if (children.length > 0) {
    if (value === "all") {
      triggerLabel = "All children";
    } else {
      const child = children.find((student) => student.id === value);
      triggerLabel = child ? `${child.firstName} ${child.lastName}` : "Choose a child";
    }
  }

  if (!parent || children.length === 0) {
    return null;
  }

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => setParentActiveStudent(nextValue === "all" ? null : nextValue)}
    >
      <SelectTrigger className={className ?? "w-[220px] h-8 text-[13px]"}>
        <SelectValue>{triggerLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {children.length > 1 && (
          <SelectItem value="all">
            <div className="flex flex-col">
              <span>All children</span>
              <span className="text-[11px] text-muted-foreground">
                Overview cards, messages, calendar, and notifications
              </span>
            </div>
          </SelectItem>
        )}
        {children.map((child) => (
          <SelectItem key={child.id} value={child.id}>
            <div className="flex flex-col">
              <span>{child.firstName} {child.lastName}</span>
              <span className="text-[11px] text-muted-foreground">
                {child.gradeLevel}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
