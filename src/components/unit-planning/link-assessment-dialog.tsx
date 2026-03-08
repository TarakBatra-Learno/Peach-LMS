"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import type { Assessment } from "@/types/assessment";

interface LinkAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessments: Assessment[];
  unitId: string;
  onLink: (assessmentIds: string[]) => void;
}

export function LinkAssessmentDialog({
  open,
  onOpenChange,
  assessments,
  unitId,
  onLink,
}: LinkAssessmentDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const unlinkedAssessments = useMemo(
    () => assessments.filter((a) => !a.unitId),
    [assessments]
  );

  const filtered = useMemo(
    () =>
      unlinkedAssessments.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
      ),
    [unlinkedAssessments, search]
  );

  const toggleSelection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    onLink(Array.from(selected));
    setSelected(new Set());
    setSearch("");
    onOpenChange(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelected(new Set());
      setSearch("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Link Assessments</DialogTitle>
          <DialogDescription>
            Select assessments to link to this unit. Only unlinked assessments
            are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assessments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[280px] border rounded-md">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[13px] text-muted-foreground py-12">
              {unlinkedAssessments.length === 0
                ? "All assessments are already linked to a unit"
                : "No assessments match your search"}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map((a) => (
                <label
                  key={a.id}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(a.id)}
                    onCheckedChange={() => toggleSelection(a.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">
                      {a.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[11px] px-1.5">
                        {a.gradingMode === "myp_criteria"
                          ? "MYP Criteria"
                          : a.gradingMode === "dp_scale"
                            ? "DP Scale"
                            : a.gradingMode.charAt(0).toUpperCase() +
                              a.gradingMode.slice(1)}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        Due {a.dueDate}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            Link {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
