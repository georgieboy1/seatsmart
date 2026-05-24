import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-semibold tracking-tight">SeatSmart</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Classroom seating, automated. Model your room once, enter your roster, and
        get an optimized chart in seconds.
      </p>
      <Button size="lg">Get started</Button>
    </main>
  );
}
