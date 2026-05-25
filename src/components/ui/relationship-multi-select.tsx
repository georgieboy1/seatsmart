"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Option = { id: string; name: string };

type Props = {
  /** The form-field name used on the hidden inputs so this component
   *  works inside a `<form action=...>` without extra wiring. */
  name: string;
  options: Option[];
  selectedIds: string[];
  /** Ids the user can't pick (e.g. they're in the opposite list).
   *  Renders disabled with the given hint as the secondary label. */
  excludedIds?: string[];
  excludedHint?: string;
  /** Placeholder for the open-the-picker button. */
  placeholder?: string;
  /** Placeholder text when no items are selected. */
  emptyLabel?: string;
  onChange: (ids: string[]) => void;
};

/**
 * Token / tag multi-select with a search-able dropdown.
 *
 * Replaces the previous checkbox-grid "wall of names" pattern:
 * the user types in the search input, picks options as chips, and
 * removes them via × on each chip.
 *
 * Renders one `<input type="hidden" name={name}>` per selected id
 * so the surrounding `<form>` posts the values via standard FormData
 * (no separate JS wiring needed in the server action).
 */
export function RelationshipMultiSelect({
  name,
  options,
  selectedIds,
  excludedIds = [],
  excludedHint = "Unavailable",
  placeholder = "Add a person…",
  emptyLabel = "No one selected",
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedSet = new Set(selectedIds);
  const excludedSet = new Set(excludedIds);
  const optionsById = new Map(options.map((o) => [o.id, o]));

  const add = (id: string) => {
    if (selectedSet.has(id) || excludedSet.has(id)) return;
    onChange([...selectedIds, id]);
  };

  const remove = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      <div className="min-h-9 border-[1.5px] border-foreground bg-background p-1.5 flex flex-wrap gap-1">
        {selectedIds.length === 0 ? (
          <span className="self-center px-1.5 text-xs text-muted-foreground">
            {emptyLabel}
          </span>
        ) : (
          selectedIds.map((id) => {
            const opt = optionsById.get(id);
            const label = opt?.name ?? id;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 border border-foreground bg-muted px-2 py-0.5 text-xs"
              >
                {label}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  aria-label={`Remove ${label}`}
                  className="-mr-1 p-0.5 hover:bg-foreground/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* Search-able add */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start font-normal"
          >
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search…" />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isSelected = selectedSet.has(opt.id);
                  const isExcluded = excludedSet.has(opt.id);
                  return (
                    <CommandItem
                      key={opt.id}
                      value={opt.name}
                      disabled={isExcluded}
                      onSelect={() => {
                        if (isExcluded) return;
                        if (isSelected) remove(opt.id);
                        else add(opt.id);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex-1">{opt.name}</span>
                      {isExcluded && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {excludedHint}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Hidden inputs ship the selected ids as FormData on submit. */}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
