"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { generateId } from "@/services/mock-service";
import { toast } from "sonner";
import {
  getStudentArtifacts,
  getStudentSubmissions,
  getStudentReports,
} from "@/lib/student-selectors";
import type { GoalEvidenceSourceType } from "@/types/goal-evidence";
import {
  FolderOpen,
  FileText,
  BookOpen,
  PenLine,
  Check,
  ArrowLeft,
  Paperclip,
} from "lucide-react";
import { format } from "date-fns";

interface GoalEvidencePickerProps {
  open: boolean;
  onClose: () => void;
  goalId: string;
  studentId: string;
}

export function GoalEvidencePicker({
  open,
  onClose,
  goalId,
  studentId,
}: GoalEvidencePickerProps) {
  const state = useStore((s) => s);
  const addGoalEvidenceLink = useStore((s) => s.addGoalEvidenceLink);

  const [step, setStep] = useState<"pick" | "reflect">("pick");
  const [selectedSourceType, setSelectedSourceType] = useState<GoalEvidenceSourceType>("portfolio_artifact");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [reflection, setReflection] = useState("");

  // Manual evidence fields
  const [manualTitle, setManualTitle] = useState("");
  const [manualMediaUrl, setManualMediaUrl] = useState("");

  const artifacts = useMemo(
    () => getStudentArtifacts(state, studentId),
    [state, studentId]
  );
  const submissions = useMemo(
    () => getStudentSubmissions(state, studentId),
    [state, studentId]
  );
  const reports = useMemo(
    () => getStudentReports(state, studentId),
    [state, studentId]
  );

  // Already-linked source IDs for this goal
  const linkedSourceIds = useMemo(() => {
    return new Set(
      state.goalEvidenceLinks
        .filter((l) => l.goalId === goalId)
        .map((l) => `${l.sourceType}:${l.sourceId}`)
    );
  }, [state.goalEvidenceLinks, goalId]);

  const isLinked = (sourceType: GoalEvidenceSourceType, sourceId: string) =>
    linkedSourceIds.has(`${sourceType}:${sourceId}`);

  const handleSelect = (sourceType: GoalEvidenceSourceType, sourceId: string, title: string) => {
    if (isLinked(sourceType, sourceId)) return;
    setSelectedSourceType(sourceType);
    setSelectedSourceId(sourceId);
    setSelectedTitle(title);
    setStep("reflect");
  };

  const handleStartManual = () => {
    setSelectedSourceType("manual");
    setSelectedSourceId("");
    setSelectedTitle("");
    setStep("reflect");
  };

  const handleSubmit = () => {
    if (!reflection.trim()) return;

    if (selectedSourceType === "manual") {
      addGoalEvidenceLink({
        id: generateId("gel"),
        goalId,
        sourceType: "manual",
        sourceId: "",
        addedAt: new Date().toISOString(),
        reflection: reflection.trim(),
        addedFromSurface: "goal_detail",
        manualTitle: manualTitle.trim() || undefined,
        manualMediaUrl: manualMediaUrl.trim() || undefined,
      });
    } else {
      if (!selectedSourceId) return;
      addGoalEvidenceLink({
        id: generateId("gel"),
        goalId,
        sourceType: selectedSourceType,
        sourceId: selectedSourceId,
        addedAt: new Date().toISOString(),
        reflection: reflection.trim(),
        addedFromSurface: "goal_detail",
      });
    }

    toast.success("Evidence added to goal");
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStep("pick");
    setSelectedSourceId(null);
    setSelectedTitle("");
    setReflection("");
    setManualTitle("");
    setManualMediaUrl("");
  };

  const isManualMode = selectedSourceType === "manual" && step === "reflect";

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[16px]">Add Evidence</SheetTitle>
        </SheetHeader>

        {step === "pick" ? (
          <div className="mt-4">
            <p className="text-[13px] text-muted-foreground mb-3">
              Attach existing work or write a new reflection.
            </p>

            <Tabs defaultValue="reflection" className="w-full">
              <TabsList className="mb-3 w-full">
                <TabsTrigger value="reflection" className="text-[12px] flex-1">
                  <PenLine className="h-3.5 w-3.5 mr-1" />
                  Reflection
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="text-[12px] flex-1">
                  <FolderOpen className="h-3.5 w-3.5 mr-1" />
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="submissions" className="text-[12px] flex-1">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Submissions
                </TabsTrigger>
                <TabsTrigger value="reports" className="text-[12px] flex-1">
                  <BookOpen className="h-3.5 w-3.5 mr-1" />
                  Reports
                </TabsTrigger>
              </TabsList>

              {/* Write your own reflection / upload media */}
              <TabsContent value="reflection">
                <div className="space-y-3">
                  <p className="text-[13px] text-muted-foreground">
                    Write a personal reflection or upload media as evidence for this goal.
                  </p>
                  <Button
                    className="w-full text-[13px]"
                    onClick={handleStartManual}
                  >
                    <PenLine className="h-3.5 w-3.5 mr-1.5" />
                    Write a reflection
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="portfolio">
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {artifacts.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground py-4 text-center">No portfolio items yet</p>
                  ) : (
                    artifacts.map((artifact) => {
                      const linked = isLinked("portfolio_artifact", artifact.id);
                      const cls = state.classes.find((c) => c.id === artifact.classId);
                      return (
                        <Card
                          key={artifact.id}
                          className={`p-3 gap-0 cursor-pointer transition-colors ${
                            linked
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => !linked && handleSelect("portfolio_artifact", artifact.id, artifact.title)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium truncate">{artifact.title}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {cls?.name} · {artifact.mediaType}
                              </p>
                            </div>
                            {linked && (
                              <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                                <Check className="h-3 w-3 mr-0.5" /> Linked
                              </Badge>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="submissions">
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {submissions.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground py-4 text-center">No submissions yet</p>
                  ) : (
                    submissions.map((sub) => {
                      const linked = isLinked("submission", sub.id);
                      const asmt = state.assessments.find((a) => a.id === sub.assessmentId);
                      const cls = state.classes.find((c) => c.id === sub.classId);
                      return (
                        <Card
                          key={sub.id}
                          className={`p-3 gap-0 cursor-pointer transition-colors ${
                            linked
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => !linked && handleSelect("submission", sub.id, asmt?.title ?? "Submission")}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium truncate">{asmt?.title ?? "Submission"}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {cls?.name} · {sub.status}
                                {sub.submittedAt && ` · ${format(new Date(sub.submittedAt), "MMM d")}`}
                              </p>
                            </div>
                            {linked && (
                              <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                                <Check className="h-3 w-3 mr-0.5" /> Linked
                              </Badge>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reports">
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {reports.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground py-4 text-center">No reports yet</p>
                  ) : (
                    reports.map((report) => {
                      const linked = isLinked("report", report.id);
                      const cls = state.classes.find((c) => c.id === report.classId);
                      return (
                        <Card
                          key={report.id}
                          className={`p-3 gap-0 cursor-pointer transition-colors ${
                            linked
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => !linked && handleSelect("report", report.id, `${cls?.name ?? "Class"} Report`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium truncate">{cls?.name ?? "Class"} Report</p>
                              <p className="text-[11px] text-muted-foreground">
                                {report.distributedAt && format(new Date(report.distributedAt), "MMM d, yyyy")}
                              </p>
                            </div>
                            {linked && (
                              <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                                <Check className="h-3 w-3 mr-0.5" /> Linked
                              </Badge>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <button
              className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setStep("pick")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to selection
            </button>

            {isManualMode ? (
              <>
                {/* Manual evidence: title + media URL + reflection */}
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Title (optional)
                  </label>
                  <Input
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Give this reflection a title..."
                    className="text-[13px] mt-1"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    <Paperclip className="h-3 w-3 inline mr-1" />
                    Media link (optional)
                  </label>
                  <Input
                    value={manualMediaUrl}
                    onChange={(e) => setManualMediaUrl(e.target.value)}
                    placeholder="Paste a link to an image, video, or file..."
                    className="text-[13px] mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Link to a photo, video, audio recording, or document that supports your reflection.
                  </p>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Your reflection *
                  </label>
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Write about what you've learned, how you've grown, or what you want to improve..."
                    className="text-[13px] mt-1 min-h-[120px]"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Linked evidence: show source summary + reflection */}
                <Card className="p-3 gap-0 bg-muted/50">
                  <p className="text-[13px] font-medium">{selectedTitle}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {selectedSourceType.replace(/_/g, " ")}
                  </p>
                </Card>

                <div>
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Why does this evidence matter to your goal? *
                  </label>
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Write about what this evidence shows about your growth..."
                    className="text-[13px] mt-1 min-h-[100px]"
                    autoFocus
                  />
                </div>
              </>
            )}

            <Button
              className="w-full text-[13px]"
              disabled={!reflection.trim()}
              onClick={handleSubmit}
            >
              {isManualMode ? "Add Reflection" : "Add Evidence"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
