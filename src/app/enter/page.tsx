"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogIn } from "lucide-react";

export default function EnterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-[32px] font-bold text-[#c24e3f] tracking-tight">
            Peach
          </h1>
          <p className="text-[14px] text-muted-foreground">
            IB School Teacher Portal
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[13px] text-muted-foreground">
            Demo portal with mock data. All changes are saved locally.
          </p>
          <Button
            size="lg"
            className="w-full h-11"
            onClick={() => router.push("/dashboard")}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Enter as Teacher
          </Button>
        </div>

        <p className="text-[11px] text-text-subtle">
          Ms. Sarah Mitchell &middot; IB World School
        </p>
      </Card>
    </div>
  );
}
