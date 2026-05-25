"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import type { ClassroomLayout } from "@/lib/types/layout";
import {
  deleteLayout,
  duplicateLayout,
  renameLayout,
} from "@/lib/layouts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * A single layout row on /layouts. The main body (name + dimensions)
 * is a Link to the builder. A kebab on the right opens quick actions
 * (Rename / Duplicate / Delete) so users don't have to enter the
 * builder just to rename or remove a layout.
 */
export function LayoutListItem({ layout }: { layout: ClassroomLayout }) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  return (
    <li className="flex items-stretch border-[1.5px] border-foreground bg-card transition-colors hover:bg-accent">
      <Link href={`/layouts/${layout.id}`} className="flex-1 p-4">
        <p className="font-medium">{layout.name}</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {layout.type === "traditional"
            ? `${layout.rows ?? 0} × ${layout.columns ?? 0} traditional`
            : `${layout.numGroups ?? 0} groups of ${layout.attendeesPerGroup ?? 0}`}
        </p>
      </Link>

      <div className="flex items-center border-l-[1.5px] border-foreground px-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions for ${layout.name}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsRenameOpen(true)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await duplicateLayout(layout.id);
              }}
            >
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={async () => {
                if (
                  window.confirm(
                    `Delete "${layout.name}"? This cannot be undone.`,
                  )
                ) {
                  await deleteLayout(layout.id);
                }
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename layout</DialogTitle>
          </DialogHeader>
          {/* onSubmit closes the dialog optimistically; the bound
              server action runs against the new value, then revalidates. */}
          <form
            action={renameLayout.bind(null, layout.id)}
            onSubmit={() => setIsRenameOpen(false)}
            className="space-y-4"
          >
            <Input
              name="name"
              defaultValue={layout.name}
              required
              maxLength={100}
              autoFocus
              aria-label="Layout name"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRenameOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </li>
  );
}
