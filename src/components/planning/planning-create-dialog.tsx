"use client";

import { useEffect, useMemo, useState } from "react";
import type { Class } from "@/types/class";
import type { UnitPlan } from "@/types/unit-planning";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PlanningCreateKind = "unit" | "lesson";

export interface PlanningCreateInput {
  kind: PlanningCreateKind;
  classId: string;
  unitId?: string;
  title: string;
}

interface PlanningCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: Class[];
  units: UnitPlan[];
  defaultClassId?: string | null;
  onCreate: (input: PlanningCreateInput) => void;
}

export function PlanningCreateDialog({
  open,
  onOpenChange,
  classes,
  units,
  defaultClassId,
  onCreate,
}: PlanningCreateDialogProps) {
  const [kind, setKind] = useState<PlanningCreateKind>("unit");
  const [classId, setClassId] = useState<string>("");
  const [unitId, setUnitId] = useState<string>("none");
  const [title, setTitle] = useState("");

  const availableUnits = useMemo(
    () => units.filter((unit) => unit.classId === classId).sort((a, b) => a.order - b.order),
    [classId, units]
  );

  const canCreate =
    classId.length > 0 && (kind === "unit" || (kind === "lesson" && unitId !== "none"));

  useEffect(() => {
    if (!open) return;
    setKind("unit");
    setClassId(defaultClassId ?? "");
    setUnitId("none");
    setTitle("");
  }, [defaultClassId, open]);

  const handleClose = (nextOpen: boolean) => {
    setKind("unit");
    setClassId(defaultClassId ?? "");
    setUnitId("none");
    setTitle("");
    onOpenChange(nextOpen);
  };

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate({
      kind,
      classId,
      unitId: kind === "lesson" && unitId !== "none" ? unitId : undefined,
      title: title.trim(),
    });
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create plan</DialogTitle>
          <DialogDescription>
            Create a unit plan or lesson plan from the planning hub. Every item starts by linking to a class.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-[13px] font-medium">Plan type</Label>
            <RadioGroup
              value={kind}
              onValueChange={(value) => setKind(value as PlanningCreateKind)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <label
                htmlFor="planning-kind-unit"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-muted/20 p-4"
              >
                <RadioGroupItem id="planning-kind-unit" value="unit" />
                <div>
                  <p className="text-[13px] font-medium">Unit plan</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Build a new unit with inquiry, evidence, and linked lessons.
                  </p>
                </div>
              </label>
              <label
                htmlFor="planning-kind-lesson"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-muted/20 p-4"
              >
                <RadioGroupItem id="planning-kind-lesson" value="lesson" />
                <div>
                  <p className="text-[13px] font-medium">Lesson plan</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Create a lesson directly from the hub and attach it to a class first.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="planning-linked-class" className="text-[13px] font-medium">
              Linked class
            </Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger id="planning-linked-class" aria-label="Linked class">
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="planning-title" className="text-[13px] font-medium">
              Working title
            </Label>
            <Input
              id="planning-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={kind === "unit" ? "New unit plan" : "New lesson plan"}
            />
          </div>

          {kind === "lesson" ? (
            <div className="space-y-2">
              <Label htmlFor="planning-linked-unit" className="text-[13px] font-medium">
                Existing unit
              </Label>
              <Select value={unitId} onValueChange={setUnitId} disabled={!classId}>
                <SelectTrigger id="planning-linked-unit" aria-label="Existing unit">
                  <SelectValue placeholder="Optional: attach to a unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No unit yet</SelectItem>
                  {availableUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[12px] text-muted-foreground">
                Pick the unit this lesson belongs to. Teachers can still create class-wide lessons from the class workspace later.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
