"use client";

import { Button } from "@/components/ui/button";
import { loadSampleData } from "@/lib/local/sample";
import { go } from "@/lib/local/nav";

export function TrySampleButton({
  label = "Try it with a sample class",
  variant = "outline",
  size = "lg",
}: {
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => {
        const { layoutId, classId } = loadSampleData();
        go(`/charts/new?layoutId=${layoutId}&classId=${classId}`);
      }}
    >
      {label}
    </Button>
  );
}
