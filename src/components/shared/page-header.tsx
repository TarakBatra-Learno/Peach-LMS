"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "destructive";
}

interface PageHeaderProps {
  title: string;
  description?: string;
  primaryAction?: PageHeaderAction;
  secondaryActions?: PageHeaderAction[];
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-[24px] font-semibold leading-[1.2] text-foreground tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[14px] text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {primaryAction && (
          <Button onClick={primaryAction.onClick} size="sm">
            {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-1.5" />}
            {primaryAction.label}
          </Button>
        )}
        {secondaryActions && secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {secondaryActions.map((action) => (
                <DropdownMenuItem key={action.label} onClick={action.onClick}>
                  {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
