import type { Class, NewClass } from "@/lib/types/class";

export type ClassRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ClassInsert = Omit<ClassRow, "id" | "created_at" | "updated_at">;

export function rowToClass(row: ClassRow): Class {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function classToInsert(newClass: NewClass, userId: string): ClassInsert {
  return {
    user_id: userId,
    name: newClass.name,
  };
}
