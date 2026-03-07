"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  FolderPlus,
} from "lucide-react";
import { generateId } from "@/services/mock-service";
import type {
  ChecklistItem,
  ChecklistSection,
  ChecklistOutcomeModel,
} from "@/types/assessment";

interface ChecklistBuilderProps {
  items: ChecklistItem[];
  sections: ChecklistSection[];
  outcomeModel: ChecklistOutcomeModel;
  onSave: (items: ChecklistItem[], sections: ChecklistSection[]) => void;
}

export function ChecklistBuilder({
  items: initialItems,
  sections: initialSections,
  outcomeModel,
  onSave,
}: ChecklistBuilderProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [sections, setSections] = useState<ChecklistSection[]>(initialSections);

  // IDs of items assigned to any section
  const assignedItemIds = new Set(sections.flatMap((s) => s.itemIds));

  // Ungrouped items (not in any section)
  const ungroupedItems = items.filter((item) => !assignedItemIds.has(item.id));

  const addItem = (sectionId?: string) => {
    const newItem: ChecklistItem = {
      id: generateId("chki"),
      label: "",
      required: true,
    };
    setItems((prev) => [...prev, newItem]);
    if (sectionId) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, itemIds: [...s.itemIds, newItem.id] }
            : s
        )
      );
    }
  };

  const updateItem = (
    id: string,
    field: keyof Omit<ChecklistItem, "id">,
    value: string | number | boolean
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    // Also remove from any section
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        itemIds: s.itemIds.filter((iid) => iid !== id),
      }))
    );
  };

  const addSection = () => {
    const newSection: ChecklistSection = {
      id: generateId("chks"),
      title: "",
      itemIds: [],
    };
    setSections((prev) => [...prev, newSection]);
  };

  const updateSectionTitle = (id: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
  };

  const removeSection = (id: string) => {
    // Items move to ungrouped — NOT deleted
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const moveItem = (
    itemId: string,
    direction: "up" | "down",
    sectionId?: string
  ) => {
    if (sectionId) {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          const idx = s.itemIds.indexOf(itemId);
          if (idx < 0) return s;
          const targetIdx = direction === "up" ? idx - 1 : idx + 1;
          if (targetIdx < 0 || targetIdx >= s.itemIds.length) return s;
          const next = [...s.itemIds];
          [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
          return { ...s, itemIds: next };
        })
      );
    } else {
      // Move ungrouped items in the main items array
      const ungroupedIds = items
        .filter((i) => !assignedItemIds.has(i.id))
        .map((i) => i.id);
      const idx = ungroupedIds.indexOf(itemId);
      if (idx < 0) return;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= ungroupedIds.length) return;
      // Swap in the main items array
      setItems((prev) => {
        const next = [...prev];
        const aIdx = next.findIndex((i) => i.id === ungroupedIds[idx]);
        const bIdx = next.findIndex((i) => i.id === ungroupedIds[targetIdx]);
        if (aIdx >= 0 && bIdx >= 0) {
          [next[aIdx], next[bIdx]] = [next[bIdx], next[aIdx]];
        }
        return next;
      });
    }
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      [next[index], next[targetIdx]] = [next[targetIdx], next[index]];
      return next;
    });
  };

  const renderItem = (
    item: ChecklistItem,
    index: number,
    listLength: number,
    sectionId?: string
  ) => (
    <div
      key={item.id}
      className="border rounded-lg p-3 space-y-2 bg-background"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-2.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <Input
            value={item.label}
            onChange={(e) => updateItem(item.id, "label", e.target.value)}
            placeholder="Checklist item label..."
            className="h-8 text-[13px]"
          />
          <Input
            value={item.helpText ?? ""}
            onChange={(e) => updateItem(item.id, "helpText", e.target.value)}
            placeholder="Help text (optional)"
            className="h-7 text-[12px] text-muted-foreground"
          />
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-1.5 text-[12px]">
              <Switch
                checked={item.required}
                onCheckedChange={(checked) =>
                  updateItem(item.id, "required", checked)
                }
                className="scale-75"
              />
              Required
            </label>
            <label className="flex items-center gap-1.5 text-[12px]">
              <Switch
                checked={item.requireEvidence ?? false}
                onCheckedChange={(checked) =>
                  updateItem(item.id, "requireEvidence", checked)
                }
                className="scale-75"
              />
              Evidence prompt
            </label>
            {outcomeModel === "score_contributing" && (
              <div className="flex items-center gap-1.5">
                <Label className="text-[12px]">Points</Label>
                <Input
                  type="number"
                  min={0}
                  value={item.points ?? 0}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      "points",
                      Math.max(0, parseInt(e.target.value) || 0)
                    )
                  }
                  className="h-7 text-[12px] w-16"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => moveItem(item.id, "up", sectionId)}
            disabled={index === 0}
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => moveItem(item.id, "down", sectionId)}
            disabled={index === listLength - 1}
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => removeItem(item.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="p-5 gap-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold">Checklist Items</h3>
          <p className="text-[12px] text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""}
            {outcomeModel === "score_contributing" && (
              <span>
                {" "}
                &middot; {items.reduce((s, i) => s + (i.points ?? 0), 0)} total
                points
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addSection}>
            <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
            Add section
          </Button>
          <Button variant="outline" size="sm" onClick={() => addItem()}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add item
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Sections with their items */}
        {sections.map((section, sIdx) => {
          const sectionItems = section.itemIds
            .map((id) => items.find((i) => i.id === id))
            .filter(Boolean) as ChecklistItem[];

          return (
            <div
              key={section.id}
              className="border rounded-lg p-3 bg-muted/30 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={section.title}
                  onChange={(e) =>
                    updateSectionTitle(section.id, e.target.value)
                  }
                  placeholder="Section heading..."
                  className="h-8 text-[13px] font-medium flex-1"
                />
                <Badge variant="outline" className="text-[11px] shrink-0">
                  {sectionItems.length} item{sectionItems.length !== 1 ? "s" : ""}
                </Badge>
                <div className="flex gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => moveSection(sIdx, "up")}
                    disabled={sIdx === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => moveSection(sIdx, "down")}
                    disabled={sIdx === sections.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => removeSection(section.id)}
                    title="Delete section (items move to ungrouped)"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {sectionItems.map((item, idx) =>
                  renderItem(item, idx, sectionItems.length, section.id)
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-[12px] w-full"
                onClick={() => addItem(section.id)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add item to section
              </Button>
            </div>
          );
        })}

        {/* Ungrouped items */}
        {ungroupedItems.length > 0 && (
          <div className="space-y-2">
            {sections.length > 0 && (
              <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">
                Ungrouped items
              </p>
            )}
            {ungroupedItems.map((item, idx) =>
              renderItem(item, idx, ungroupedItems.length)
            )}
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            No items yet. Click &quot;Add item&quot; to create your first
            checklist item.
          </div>
        )}
      </div>

      <Separator className="my-4" />

      <div className="flex justify-end">
        <Button onClick={() => onSave(items, sections)}>Save checklist</Button>
      </div>
    </Card>
  );
}
