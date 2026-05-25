import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToAttendee, type AttendeeRow } from "@/lib/attendees/db";
import { serializeAttendeesCsv } from "@/lib/attendees/csv";

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
    .from("attendees")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.redirect(
      new URL(`/attendees?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  const csv = serializeAttendeesCsv((data as AttendeeRow[]).map(rowToAttendee));

  return new Response(csv, {
    headers: {
      "Content-Disposition": 'attachment; filename="seatsmart-attendees.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
