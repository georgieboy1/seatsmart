import type { CellType } from "@/lib/types/layout";

export type CellMeta = {
  label: string;
  fullName: string;
  bg: string;
  border: string;
  text: string;
};

export const CELL_META: Record<CellType, CellMeta> = {
  door: {
    label: "D",
    fullName: "Door",
    bg: "bg-sky-200",
    border: "border-sky-400",
    text: "text-sky-900",
  },
  window: {
    label: "W",
    fullName: "Window",
    bg: "bg-cyan-100",
    border: "border-cyan-300",
    text: "text-cyan-900",
  },
  teacher_desk: {
    label: "TD",
    fullName: "Teacher desk",
    bg: "bg-amber-200",
    border: "border-amber-400",
    text: "text-amber-900",
  },
  whiteboard: {
    label: "WB",
    fullName: "Whiteboard",
    bg: "bg-slate-50",
    border: "border-slate-400",
    text: "text-slate-900",
  },
  charging_station: {
    label: "CS",
    fullName: "Charging station",
    bg: "bg-yellow-200",
    border: "border-yellow-400",
    text: "text-yellow-900",
  },
  perimeter: {
    label: "P",
    fullName: "Wall",
    bg: "bg-stone-300",
    border: "border-stone-400",
    text: "text-stone-700",
  },
  seat: {
    label: "S",
    fullName: "Seat",
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    text: "text-emerald-900",
  },
  empty: {
    label: "",
    fullName: "Empty",
    bg: "bg-transparent",
    border: "border-slate-200",
    text: "text-slate-400",
  },
};
