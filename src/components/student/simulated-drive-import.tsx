"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, Link as LinkIcon, CheckCircle2, Cloud } from "lucide-react";
import type { SubmissionAttachment } from "@/types/submission";
import { generateId } from "@/services/mock-service";

interface SimulatedDriveImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (attachment: SubmissionAttachment) => void;
}

const MOCK_DRIVE_FILES = [
  { name: "Essay Draft - Final.docx", type: "document" as const, source: "drive_import" as const },
  { name: "Lab Report - Chemistry.pdf", type: "document" as const, source: "drive_import" as const },
  { name: "Research Presentation.pptx", type: "document" as const, source: "drive_import" as const },
  { name: "Project Photo 1.jpg", type: "image" as const, source: "drive_import" as const },
  { name: "Art Portfolio Scan.png", type: "image" as const, source: "drive_import" as const },
  { name: "Bibliography Links.docx", type: "document" as const, source: "drive_import" as const },
];

const MOCK_ONEDRIVE_FILES = [
  { name: "Math Homework Week 5.xlsx", type: "document" as const, source: "onedrive_import" as const },
  { name: "Book Review Essay.docx", type: "document" as const, source: "onedrive_import" as const },
  { name: "Science Diagram.png", type: "image" as const, source: "onedrive_import" as const },
  { name: "History Timeline.pptx", type: "document" as const, source: "onedrive_import" as const },
];

const FILE_ICONS: Record<string, typeof FileText> = {
  document: FileText,
  image: Image,
  link: LinkIcon,
};

export function SimulatedDriveImport({ open, onOpenChange, onImport }: SimulatedDriveImportProps) {
  const [selectedTab, setSelectedTab] = useState<"google" | "onedrive">("google");
  const [selectedFile, setSelectedFile] = useState<number | null>(null);

  const files = selectedTab === "google" ? MOCK_DRIVE_FILES : MOCK_ONEDRIVE_FILES;

  const handleImport = () => {
    if (selectedFile === null) return;
    const file = files[selectedFile];
    const attachment: SubmissionAttachment = {
      id: generateId("att"),
      name: file.name,
      type: file.type,
      url: `https://mock-${selectedTab}.example.com/${file.name.replace(/ /g, "_").toLowerCase()}`,
      sourceType: file.source,
    };
    onImport(attachment);
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from cloud storage</DialogTitle>
          <DialogDescription>
            Select a file to attach to your submission.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={selectedTab === "google" ? "default" : "outline"}
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => { setSelectedTab("google"); setSelectedFile(null); }}
          >
            <Cloud className="h-3.5 w-3.5 mr-1.5" />
            Google Drive
          </Button>
          <Button
            variant={selectedTab === "onedrive" ? "default" : "outline"}
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => { setSelectedTab("onedrive"); setSelectedFile(null); }}
          >
            <Cloud className="h-3.5 w-3.5 mr-1.5" />
            OneDrive
          </Button>
        </div>

        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {files.map((file, i) => {
            const Icon = FILE_ICONS[file.type] ?? FileText;
            return (
              <button
                key={i}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                  selectedFile === i
                    ? "bg-[#fff2f0] border border-[#c24e3f]/30"
                    : "hover:bg-muted border border-transparent"
                }`}
                onClick={() => setSelectedFile(i)}
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-[13px] flex-1 truncate">{file.name}</span>
                {selectedFile === i && (
                  <CheckCircle2 className="h-4 w-4 text-[#c24e3f] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleImport} disabled={selectedFile === null}>
            Import file
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
