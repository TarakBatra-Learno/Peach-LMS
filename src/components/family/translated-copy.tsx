"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TranslatedCopyProps {
  body: string;
  translatedBody?: string;
  translatedLanguage?: string;
  autoTranslate?: boolean;
  className?: string;
}

export function TranslatedCopy({
  body,
  translatedBody,
  translatedLanguage,
  autoTranslate = false,
  className,
}: TranslatedCopyProps) {
  const hasTranslation = Boolean(translatedBody && translatedLanguage);
  const [showTranslation, setShowTranslation] = useState(autoTranslate && hasTranslation);

  const activeBody = showTranslation && translatedBody ? translatedBody : body;

  return (
    <div className={className}>
      <p className="whitespace-pre-wrap text-[13px] leading-6 text-foreground">
        {activeBody}
      </p>
      {hasTranslation && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>
            {showTranslation ? `Translated to ${translatedLanguage}` : "Original text"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] text-[#c24e3f]"
            onClick={() => setShowTranslation((value) => !value)}
          >
            {showTranslation ? "View original" : `Translate to ${translatedLanguage}`}
          </Button>
        </div>
      )}
    </div>
  );
}
