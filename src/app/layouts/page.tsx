"use client";

import { Suspense } from "react";
import { createDefaultLayout } from "@/lib/layouts/actions";
import { useLayouts } from "@/lib/local/hooks";
import { Button } from "@/components/ui/button";
import { LayoutsList } from "./layouts-list";
import { FlashMessages } from "@/components/local/flash-messages";

export default function LayoutsPage() {
  const layouts = useLayouts();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Classroom layouts
          </h1>
          <p className="text-sm text-muted-foreground">
            {layouts.length === 0
              ? "Model your classroom to get started."
              : `${layouts.length} layout${layouts.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <form action={createDefaultLayout}>
          <Button type="submit">+ New layout</Button>
        </form>
      </div>

      <Suspense fallback={null}>
        <FlashMessages />
      </Suspense>

      <LayoutsList layouts={layouts} />
    </main>
  );
}
