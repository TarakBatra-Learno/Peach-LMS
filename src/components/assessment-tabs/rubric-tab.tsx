"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, Check } from "lucide-react";
import { generateId } from "@/services/mock-service";
import { toast } from "sonner";
import type { Assessment, SimpleCriterion } from "@/types/assessment";

interface RubricTabProps {
  assessment: Assessment;
  onUpdateAssessment: (id: string, updates: Partial<Assessment>) => void;
}

export function RubricTab({ assessment, onUpdateAssessment }: RubricTabProps) {
  const hasRubric =
    (assessment.rubric && assessment.rubric.length > 0) ||
    (assessment.rubricCriteria && assessment.rubricCriteria.length > 0);

  const [mode, setMode] = useState<"view" | "edit">(hasRubric ? "view" : "edit");

  const [rubricCriteria, setRubricCriteria] = useState<SimpleCriterion[]>(
    () => assessment.rubricCriteria ?? []
  );

  const addCriterion = () => {
    setRubricCriteria((prev) => [
      ...prev,
      {
        id: generateId("crit"),
        name: "",
        description: "",
        maxScore: assessment.gradingMode === "myp_criteria" ? 8 : 10,
      },
    ]);
  };

  const updateCriterion = (
    id: string,
    field: keyof Omit<SimpleCriterion, "id">,
    value: string | number
  ) => {
    setRubricCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeCriterion = (id: string) => {
    setRubricCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const moveCriterion = (index: number, direction: "up" | "down") => {
    setRubricCriteria((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleDoneEditing = () => {
    onUpdateAssessment(assessment.id, { rubricCriteria });
    toast.success("Rubric saved");
    setMode("view");
  };

  // ----- Edit mode -----
  if (mode === "edit") {
    // Show full rubric matrix preview if template has been applied
    const hasFullRubricPreview = assessment.rubric && assessment.rubric.length > 0;

    return (
      <Card className="p-5 gap-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold">Rubric criteria</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              onClick={addCriterion}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add criterion
            </Button>
            <Button
              size="sm"
              className="h-8 text-[12px]"
              onClick={handleDoneEditing}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Done Editing
            </Button>
          </div>
        </div>

        {/* Full rubric matrix preview (from template) */}
        {hasFullRubricPreview && (
          <div className="space-y-3 mb-4 pb-4 border-b border-border/50">
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Rubric preview</p>
            {assessment.rubric!.map((criterion) => (
              <div key={criterion.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[13px] font-semibold">{criterion.title}</h4>
                  <Badge variant="secondary" className="text-[10px]">
                    Weight: {criterion.weight}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
                  {criterion.levels.map((level) => (
                    <div
                      key={level.id}
                      className="rounded border border-border/50 p-2 bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-semibold">{level.label}</span>
                        <span className="text-[10px] text-muted-foreground">{level.points} pts</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{level.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {rubricCriteria.length === 0 && !hasFullRubricPreview ? (
          <div className="text-center py-8">
            <p className="text-[13px] text-muted-foreground mb-3">
              No criteria defined yet. Add your first criterion to build
              the rubric.
            </p>
            <Button variant="outline" size="sm" onClick={addCriterion}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add criterion
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rubricCriteria.length > 0 && !hasFullRubricPreview && (
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Criteria</p>
            )}
            {rubricCriteria.map((criterion, index) => (
              <div
                key={criterion.id}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <div className="flex flex-col gap-1 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={index === 0}
                    onClick={() => moveCriterion(index, "up")}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={index === rubricCriteria.length - 1}
                    onClick={() => moveCriterion(index, "down")}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px] gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Name
                    </Label>
                    <Input
                      value={criterion.name}
                      onChange={(e) =>
                        updateCriterion(criterion.id, "name", e.target.value)
                      }
                      placeholder="Criterion name"
                      className="h-8 text-[13px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Description
                    </Label>
                    <Input
                      value={criterion.description}
                      onChange={(e) =>
                        updateCriterion(
                          criterion.id,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Brief description"
                      className="h-8 text-[13px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Max score
                    </Label>
                    <Input
                      type="number"
                      value={criterion.maxScore}
                      onChange={(e) =>
                        updateCriterion(
                          criterion.id,
                          "maxScore",
                          parseInt(e.target.value) || 0
                        )
                      }
                      min={1}
                      className="h-8 text-[13px]"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0 mt-5"
                  onClick={() => removeCriterion(criterion.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  // ----- View mode -----
  const hasFullRubric = assessment.rubric && assessment.rubric.length > 0;
  const hasSimpleCriteria =
    assessment.rubricCriteria && assessment.rubricCriteria.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[12px]"
          onClick={() => setMode("edit")}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Edit Rubric
        </Button>
      </div>

      {/* Full rubric matrix view (RubricCriterion[] with levels) */}
      {hasFullRubric &&
        assessment.rubric!.map((criterion) => (
          <Card key={criterion.id} className="p-5 gap-0">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[14px] font-semibold">{criterion.title}</h4>
              <Badge variant="secondary" className="text-[11px]">
                Weight: {criterion.weight}%
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {criterion.levels.map((level) => (
                <div
                  key={level.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold">
                      {level.label}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {level.points} pts
                    </Badge>
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    {level.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ))}

      {/* Simple criteria view (SimpleCriterion[] without levels) */}
      {!hasFullRubric && hasSimpleCriteria && (
        <Card className="p-5 gap-0">
          <h3 className="text-[16px] font-semibold mb-4">Rubric criteria</h3>
          <div className="space-y-3">
            {assessment.rubricCriteria!.map((criterion) => (
              <div
                key={criterion.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-[13px] font-medium">{criterion.name}</p>
                  {criterion.description && (
                    <p className="text-[12px] text-muted-foreground">
                      {criterion.description}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-[11px] shrink-0">
                  Max: {criterion.maxScore}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No rubric data at all */}
      {!hasFullRubric && !hasSimpleCriteria && (
        <Card className="p-5 gap-0">
          <div className="text-center py-8">
            <p className="text-[13px] text-muted-foreground mb-3">
              No rubric criteria defined yet. Click &quot;Edit Rubric&quot; to add
              criteria.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
