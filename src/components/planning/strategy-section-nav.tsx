"use client";

import { ChevronRight } from "lucide-react";

interface StrategySectionNavProps {
  sections: readonly { value: string; label: string }[];
  activeSection: string;
  onSelectSection: (section: string) => void;
}

export function StrategySectionNav({
  sections,
  activeSection,
  onSelectSection,
}: StrategySectionNavProps) {
  return (
    <div className="mt-4 space-y-2">
      {sections.map((section) => (
        <button
          key={section.value}
          type="button"
          onClick={() => onSelectSection(section.value)}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors ${
            activeSection === section.value
              ? "bg-[#fff2f0] text-[#c24e3f]"
              : "hover:bg-muted text-foreground"
          }`}
        >
          {section.label}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
