import Link from "next/link";
import { listCharts } from "@/lib/charts/actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChartsPage() {
  const charts = await listCharts();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Seating Charts</h1>
          <p className="text-sm text-muted-foreground">
            {charts.length === 0
              ? "Generate your first chart to see it here."
              : `${charts.length} chart${charts.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/charts/new">
            <Plus className="mr-2 h-4 w-4" />
            New chart
          </Link>
        </Button>
      </div>

      {charts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-base font-medium">No charts yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Click <span className="font-medium">New chart</span> to generate your first assignment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {charts.map((chart) => (
            <Link key={chart.id} href={`/charts/${chart.id}`}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{chart.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(chart.updatedAt).toLocaleDateString()}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
