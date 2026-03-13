"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AdminPanel, AdminToneBadge } from "@/features/admin/components/admin-ui";
import { AdminLiveEmbed } from "@/features/admin/components/admin-live-embed";

export function AdminEmbeddedSurfacePage({
  title,
  description,
  backHref,
  backLabel,
  badges,
  panelTitle,
  panelDescription,
  embedTitle,
  embedSrc,
  minHeight = 1320,
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  badges?: React.ReactNode;
  panelTitle: string;
  panelDescription: string;
  embedTitle: string;
  embedSrc: string;
  minHeight?: number;
}) {
  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>

      <PageHeader title={title} description={description}>
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminToneBadge tone="peach">Admin workspace</AdminToneBadge>
          {badges}
        </div>
      </PageHeader>

      <AdminPanel title={panelTitle} description={panelDescription}>
        <div className="mb-4 flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href={backHref}>Return to source</Link>
          </Button>
        </div>
        <AdminLiveEmbed
          title={embedTitle}
          src={embedSrc}
          minHeight={minHeight}
        />
      </AdminPanel>
    </div>
  );
}
