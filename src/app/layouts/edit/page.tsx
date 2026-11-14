"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useHydrated, useLayout } from "@/lib/local/hooks";
import { LayoutBuilder } from "@/components/layout-builder/layout-builder";
import { FlashMessages } from "@/components/local/flash-messages";

function LayoutEditor() {
  const id = useSearchParams().get("id");
  const layout = useLayout(id);
  const hydrated = useHydrated();

  if (!layout) {
    if (!hydrated) return null;
    return (
      <div className="border-[1.5px] border-dashed p-12 text-center">
        <p className="text-base font-medium">Layout not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted, or it was saved in a different browser.
        </p>
        <Link href="/layouts" className="mt-4 inline-block text-sm underline">
          Back to layouts
        </Link>
      </div>
    );
  }

  return <LayoutBuilder key={layout.updatedAt} layout={layout} />;
}

export default function LayoutDetailPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/layouts"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← All layouts
      </Link>
      <Suspense fallback={null}>
        <FlashMessages />
        <LayoutEditor />
      </Suspense>
    </main>
  );
}
