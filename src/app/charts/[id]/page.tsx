import { redirect } from "next/navigation";
import { getChart } from "@/lib/charts/actions";
import { getLayout } from "@/lib/layouts/actions";
import { listAttendees } from "@/lib/attendees/actions";
import { listCohorts } from "@/lib/cohorts/actions";
import { SeatingChartView } from "@/components/charts/seating-chart-view";

export const dynamic = "force-dynamic";

export default async function ChartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chart = await getChart(id);

  if (!chart) {
    redirect("/charts?error=Chart+not+found");
  }

  const [layout, attendees, cohorts] = await Promise.all([
    getLayout(chart.layoutId),
    listAttendees(),
    listCohorts(),
  ]);

  if (!layout) {
    redirect("/charts?error=Referenced+layout+not+found");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <SeatingChartView 
        layout={layout} 
        attendees={attendees} 
        cohorts={cohorts}
        initialChart={chart} 
      />
    </main>
  );
}
