"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, X } from "lucide-react";
import type { Programme } from "@/types/common";
import type { LearningGoal } from "@/types/assessment";
import type { UnitStrategy, ConceptualFraming } from "@/types/unit-planning";

interface StrategyEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: UnitStrategy;
  programme: Programme;
  learningGoals: LearningGoal[];
  onSave: (strategy: UnitStrategy) => void;
}

export function StrategyEditDrawer({
  open,
  onOpenChange,
  strategy,
  programme,
  learningGoals,
  onSave,
}: StrategyEditDrawerProps) {
  const draftKey = JSON.stringify({
    goals: strategy.learningGoals,
    standards: strategy.linkedStandardIds,
    framing: strategy.conceptualFraming,
    assessmentApproach: strategy.assessmentApproach,
    differentiationNotes: strategy.action?.differentiationNotes,
    learningArc: strategy.learningArc,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {open ? (
        <StrategyEditDrawerForm
          key={draftKey}
          onOpenChange={onOpenChange}
          strategy={strategy}
          programme={programme}
          learningGoals={learningGoals}
          onSave={onSave}
        />
      ) : null}
    </Sheet>
  );
}

type StrategyEditDrawerFormProps = Omit<StrategyEditDrawerProps, "open">;

function StrategyEditDrawerForm({
  onOpenChange,
  strategy,
  programme,
  learningGoals,
  onSave,
}: StrategyEditDrawerFormProps) {
  const [goals, setGoals] = useState<string[]>(() => [...strategy.learningGoals]);
  const [newGoal, setNewGoal] = useState("");
  const [linkedStandardIds, setLinkedStandardIds] = useState<string[]>(() => [
    ...strategy.linkedStandardIds,
  ]);
  const [framing, setFraming] = useState<ConceptualFraming>(
    () => ({ ...strategy.conceptualFraming })
  );
  const [assessmentApproach, setAssessmentApproach] = useState(
    () => strategy.assessmentApproach || ""
  );
  const [differentiationNotes, setDifferentiationNotes] = useState(
    () => strategy.action?.differentiationNotes || ""
  );
  const [learningArc, setLearningArc] = useState(() => strategy.learningArc || "");

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals((prev) => [...prev, newGoal.trim()]);
      setNewGoal("");
    }
  };

  const removeGoal = (index: number) => {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleStandard = (id: string) => {
    setLinkedStandardIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave({
      learningGoals: goals,
      linkedStandardIds,
      conceptualFraming: framing,
      assessmentApproach: assessmentApproach || undefined,
      action: {
        ...(strategy.action ?? {}),
        differentiationNotes: differentiationNotes || undefined,
        resourceLinks: strategy.action?.resourceLinks,
      },
      learningArc: learningArc || undefined,
    });
    onOpenChange(false);
  };

  return (
    <SheetContent className="w-[480px] sm:max-w-[480px] p-0 flex flex-col">
      <SheetHeader className="px-6 pt-6 pb-4">
        <SheetTitle>Edit Unit Strategy</SheetTitle>
      </SheetHeader>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-6 pb-6">
            {/* Learning Goals */}
            <div className="space-y-2">
              <Label className="text-[13px]">Learning Goals</Label>
              <div className="space-y-1.5">
                {goals.map((goal, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted text-[13px]"
                  >
                    <span className="flex-1">{goal}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => removeGoal(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a learning goal..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGoal()}
                  className="text-[13px]"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addGoal}
                  disabled={!newGoal.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Conceptual Framing */}
            <div className="space-y-3">
              <Label className="text-[13px] font-semibold">
                Conceptual Framing ({programme})
              </Label>
              {(programme === "MYP" || programme === "general") && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-muted-foreground">
                      Key Concept
                    </Label>
                    <Input
                      value={framing.keyConcept || ""}
                      onChange={(e) =>
                        setFraming((f) => ({ ...f, keyConcept: e.target.value }))
                      }
                      placeholder="e.g., Systems, Change, Relationships"
                      className="text-[13px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-muted-foreground">
                      Related Concepts
                    </Label>
                    <Input
                      value={(framing.relatedConcepts || []).join(", ")}
                      onChange={(e) =>
                        setFraming((f) => ({
                          ...f,
                          relatedConcepts: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }))
                      }
                      placeholder="Comma-separated: Balance, Interaction"
                      className="text-[13px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-muted-foreground">
                      Global Context
                    </Label>
                    <Input
                      value={framing.globalContext || ""}
                      onChange={(e) =>
                        setFraming((f) => ({
                          ...f,
                          globalContext: e.target.value,
                        }))
                      }
                      placeholder="e.g., Globalization and sustainability"
                      className="text-[13px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-muted-foreground">
                      Statement of Inquiry
                    </Label>
                    <Textarea
                      value={framing.statementOfInquiry || ""}
                      onChange={(e) =>
                        setFraming((f) => ({
                          ...f,
                          statementOfInquiry: e.target.value,
                        }))
                      }
                      placeholder="How does your key concept connect to the content?"
                      className="text-[13px] min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-muted-foreground">
                      ATL Focus
                    </Label>
                    <Input
                      value={(framing.atlFocus || []).join(", ")}
                      onChange={(e) =>
                        setFraming((f) => ({
                          ...f,
                          atlFocus: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }))
                      }
                      placeholder="Comma-separated: Communication, Research"
                      className="text-[13px]"
                    />
                  </div>
                </>
              )}
              {programme === "DP" && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-muted-foreground">
                      TOK Connection
                    </Label>
                    <Textarea
                      value={framing.tokConnection || ""}
                      onChange={(e) =>
                        setFraming((f) => ({
                          ...f,
                          tokConnection: e.target.value,
                        }))
                      }
                      placeholder="How does this connect to Theory of Knowledge?"
                      className="text-[13px] min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] text-muted-foreground">
                      CAS Opportunity
                    </Label>
                    <Textarea
                      value={framing.casOpportunity || ""}
                      onChange={(e) =>
                        setFraming((f) => ({
                          ...f,
                          casOpportunity: e.target.value,
                        }))
                      }
                      placeholder="Any CAS connections for this unit?"
                      className="text-[13px] min-h-[60px]"
                    />
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Standards Mapping */}
            <div className="space-y-2">
              <Label className="text-[13px]">Standards & Skills</Label>
              <div className="flex flex-wrap gap-1.5">
                {learningGoals.map((lg) => (
                  <Badge
                    key={lg.id}
                    variant={
                      linkedStandardIds.includes(lg.id) ? "default" : "outline"
                    }
                    className="cursor-pointer text-[11px] px-2 py-0.5"
                    onClick={() => toggleStandard(lg.id)}
                  >
                    {lg.code}
                  </Badge>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Click to toggle. {linkedStandardIds.length} selected.
              </p>
            </div>

            <Separator />

            {/* Text fields */}
            <div className="space-y-1.5">
              <Label className="text-[13px]">Assessment Approach</Label>
              <Textarea
                value={assessmentApproach}
                onChange={(e) => setAssessmentApproach(e.target.value)}
                placeholder="How will learning be assessed in this unit?"
                className="text-[13px] min-h-[60px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Differentiation Notes</Label>
              <Textarea
                value={differentiationNotes}
                onChange={(e) => setDifferentiationNotes(e.target.value)}
                placeholder="Differentiation strategies for diverse learners..."
                className="text-[13px] min-h-[60px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Learning Arc</Label>
              <Textarea
                value={learningArc}
                onChange={(e) => setLearningArc(e.target.value)}
                placeholder="Narrative arc of the unit: how do lessons build?"
                className="text-[13px] min-h-[60px]"
              />
            </div>
        </div>
      </ScrollArea>

      <SheetFooter className="px-6 py-4 border-t">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Strategy</Button>
      </SheetFooter>
    </SheetContent>
  );
}
