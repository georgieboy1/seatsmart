import { redirect } from "next/navigation";
import { getChart } from "@/lib/charts/actions";
import { getLayout } from "@/lib/layouts/actions";
import { listStudents } from "@/lib/students/actions";
import { listClasses } from "@/lib/classes/actions";
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

  const [layout, students, classes] = await Promise.all([
    getLayout(chart.layoutId),
    listStudents(),
    listClasses(),
  ]);

  if (!layout) {
    redirect("/charts?error=Referenced+layout+not+found");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <SeatingChartView 
        layout={layout} 
        students={students} 
        classes={classes}
        initialChart={chart} 
      />
    </main>
  );
}
