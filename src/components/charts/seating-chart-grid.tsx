"use client";

import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useState } from "react";
import type { ClassroomLayout, CellType } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import type { SeatExplanation } from "@/lib/seating/types";
import { CELL_META } from "@/components/layout-builder/cell-meta";
import { SeatItem } from "./seat-item";

type Props = {
  layout: ClassroomLayout;
  attendees: Attendee[];
  unassignedAttendees: Attendee[];
  assignments: Record<string, string>;
  lockedSeats: Record<string, string>;
  explanations: Record<string, SeatExplanation[]>;
  onSwap: (fromSeatKey: string, toSeatKey: string) => void;
  onLockToggle: (seatKey: string) => void;
  onClear: (seatKey: string) => void;
  onAssign: (seatKey: string, attendeeId: string) => void;
};

export function SeatingChartGrid({
  layout,
  attendees,
  unassignedAttendees,
  assignments,
  lockedSeats,
  explanations,
  onSwap,
  onLockToggle,
  onClear,
  onAssign,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const attendeesById = new Map(attendees.map((g) => [g.id, g]));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      onSwap(active.id as string, over.id as string);
    }
  };

  const renderCell = (cell: CellType, r: number, c: number) => {
    // Use the same "row,column" key format the seating algorithm produces.
    // See positionKey() in src/lib/seating/geometry.ts.
    const seatKey = `${r},${c}`;
    if (cell === "seat") {
      const attendeeId = assignments[seatKey];
      const attendee = attendeeId ? attendeesById.get(attendeeId) : undefined;
      const isLocked = !!lockedSeats[seatKey];

      return (
        <SeatItem
          key={seatKey}
          seatKey={seatKey}
          attendee={attendee}
          unassignedAttendees={unassignedAttendees}
          isLocked={isLocked}
          explanations={explanations[seatKey]}
          onLockToggle={onLockToggle}
          onClear={onClear}
          onAssign={onAssign}
        />
      );
    }

    const meta = CELL_META[cell];
    return (
      <div
        key={seatKey}
        className={`aspect-square flex items-center justify-center rounded-sm border text-[10px] font-bold ${meta.bg} ${meta.border} ${meta.text} opacity-50`}
      >
        {meta.label}
      </div>
    );
  };

  const columns = layout.grid[0]?.length ?? 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        id="seating-chart-grid"
        role="grid"
        aria-label="Interactive seating chart grid. Drag attendees to swap seats."
        className="inline-grid gap-1 p-4 bg-muted/20 rounded-xl border"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 3.5rem))` }}
      >
        {layout.grid.flatMap((row, r) => row.map((cell, c) => renderCell(cell, r, c)))}
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="w-14 h-14 bg-primary/20 border-2 border-primary rounded-md flex items-center justify-center animate-pulse">
             <div className="w-full h-full bg-card rounded p-1 shadow-xl scale-110 border-2 border-primary">
                <span className="text-[10px] font-bold">
                  {attendeesById.get(assignments[activeId])?.name}
                </span>
             </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
