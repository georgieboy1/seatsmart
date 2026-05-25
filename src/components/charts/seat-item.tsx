"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Student } from "@/lib/types/student";
import type { SeatExplanation } from "@/lib/seating/types";
import { 
  Lock, 
  Unlock,
  Trash2,
  UserPlus,
  DoorOpen, 
  UserRound, 
  Zap, 
  ArrowUp, 
  Eye, 
  Ear,
  Ban,
  LucideIcon
} from "lucide-react";
import { Accommodation } from "@/lib/students/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import { cn } from "@/lib/utils";

const ACCOMMODATION_ICONS: Record<Accommodation, LucideIcon> = {
  near_door: DoorOpen,
  near_teacher: UserRound,
  near_charging: Zap,
  front_of_room: ArrowUp,
  vision_front: Eye,
  hearing_left: Ear,
  hearing_right: Ear,
  away_from_window: Ban,
};

type Props = {
  seatKey: string;
  student?: Student;
  unassignedStudents: Student[];
  isLocked?: boolean;
  explanations?: SeatExplanation[];
  onLockToggle?: (seatKey: string) => void;
  onClear?: (seatKey: string) => void;
  onAssign?: (seatKey: string, studentId: string) => void;
};

export function SeatItem({ 
  seatKey, 
  student, 
  unassignedStudents,
  isLocked, 
  explanations,
  onLockToggle,
  onClear,
  onAssign
}: Props) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { 
    attributes, 
    listeners, 
    setNodeRef: setDraggableNodeRef, 
    transform, 
    isDragging 
  } = useDraggable({
    id: seatKey,
    disabled: isLocked || !student,
    data: { seatKey, student }
  });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: seatKey,
    data: { seatKey, student }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const content = (
    <div
      ref={setDroppableNodeRef}
      role="gridcell"
      aria-label={student ? `Seat for ${student.name}` : "Empty seat"}
      className={cn(
        "relative aspect-square rounded-md border-2 p-1 transition-colors",
        isOver ? "border-primary bg-primary/10" : "border-muted-foreground/20 bg-card",
        !student && "bg-muted/50 border-dashed"
      )}
    >
      {student ? (
        <div
          ref={setDraggableNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          role="button"
          aria-grabbed={isDragging}
          aria-label={`Draggable student ${student.name}. ${isLocked ? "Locked." : "Drag to swap."}`}
          className={cn(
            "flex h-full w-full flex-col items-center justify-between text-center cursor-grab active:cursor-grabbing",
            isDragging && "opacity-0"
          )}
        >
          <div className="flex w-full justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLockToggle?.(seatKey);
              }}
              aria-label={isLocked ? `Unlock ${student.name}` : `Lock ${student.name} in this seat`}
              className="p-0.5 hover:bg-muted rounded"
            >
              <Lock className={cn("h-3 w-3", isLocked ? "text-primary fill-primary" : "text-muted-foreground/30")} />
            </button>
            <div className="flex gap-0.5">
              {student.accommodations.slice(0, 2).map((acc) => {
                const Icon = ACCOMMODATION_ICONS[acc] || UserRound;
                return (
                  <Tooltip key={acc}>
                    <TooltipTrigger asChild>
                      <Icon className="h-3 w-3 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">{acc.replace(/_/g, " ")}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[10px] font-medium leading-tight line-clamp-2 px-0.5">
                {student.name}
              </span>
            </TooltipTrigger>
            {explanations && explanations.length > 0 && (
              <TooltipContent side="bottom" className="max-w-[200px]">
                <div className="space-y-1">
                  <p className="font-semibold text-xs mb-1">Placement reasons:</p>
                  {explanations.map((exp, i) => (
                    <p key={i} className="text-[10px] leading-tight text-muted-foreground">
                      • {exp.reason}
                    </p>
                  ))}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
            <PopoverTrigger asChild>
              <button 
                className="flex h-full w-full items-center justify-center hover:bg-muted/50 transition-colors rounded"
                aria-label="Assign student to this seat"
              >
                <UserPlus className="h-4 w-4 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-64" side="bottom" align="start">
              <Command>
                <CommandInput placeholder="Search student..." />
                <CommandList>
                  <CommandEmpty>No students found.</CommandEmpty>
                  <CommandGroup heading="Unassigned Students">
                    {unassignedStudents.length > 0 ? (
                      unassignedStudents.map((s) => (
                        <CommandItem
                          key={s.id}
                          onSelect={() => {
                            onAssign?.(seatKey, s.id);
                            setIsPickerOpen(false);
                          }}
                        >
                          {s.name}
                        </CommandItem>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs text-muted-foreground">All students from your roster are currently placed in the chart.</p>
                      </div>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {content}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {student ? (
          <>
            <ContextMenuItem onClick={() => onLockToggle?.(seatKey)}>
              {isLocked ? (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  <span>Unlock seat</span>
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Lock seat</span>
                </>
              )}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onClear?.(seatKey)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Clear seat</span>
            </ContextMenuItem>
          </>
        ) : (
          <ContextMenuItem onClick={() => setIsPickerOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Assign student</span>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
