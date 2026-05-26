import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToStudent, type StudentRow } from "@/lib/students/db";
import { serializeStudentsCsv } from "@/lib/students/csv";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.redirect(
      new URL(`/students?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  const csv = serializeStudentsCsv((data as StudentRow[]).map(rowToStudent));

  return new Response(csv, {
    headers: {
      "Content-Disposition": 'attachment; filename="syndesk-students.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
