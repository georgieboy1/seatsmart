import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrySampleButton } from "@/components/local/try-sample-button";

const STEPS = [
  {
    title: "Draw your room",
    body: "Rows or table groups, plus the door, windows, whiteboard and your desk.",
  },
  {
    title: "Add your students",
    body: "Type them in or paste from a spreadsheet. Note accommodations, peer supports and who shouldn't sit together.",
  },
  {
    title: "Generate and adjust",
    body: "Get a chart in seconds with a plain-English reason for every seat. Drag to swap, lock seats, then print.",
  },
];

const PROMISES = [
  "Free to use",
  "No account or sign-up",
  "Student data stays on this device",
  "Works offline once loaded",
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-16">
      <section className="flex flex-col items-start gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          SynDesk · Free classroom seating chart generator
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          A seating chart that respects every student&apos;s needs, in seconds.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          SynDesk seats students with accommodations first, keeps peer supports close and
          separates pairs that shouldn&apos;t sit together, then explains every decision.
          Everything you enter stays in this browser. Nothing is uploaded.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">Open SynDesk</Link>
          </Button>
          <TrySampleButton />
        </div>
        <ul className="flex flex-wrap gap-2">
          {PROMISES.map((promise) => (
            <li
              key={promise}
              className="border-[1.5px] border-foreground px-3 py-1 font-mono text-xs uppercase tracking-wider"
            >
              {promise}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 border-t-[1.5px] border-foreground pt-10 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <div key={step.title} className="flex flex-col gap-2">
            <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
            <h2 className="text-xl font-semibold tracking-tight">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="border-[1.5px] border-foreground p-6">
        <h2 className="mb-2 text-lg font-semibold">Where your data lives</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          SynDesk has no server and no accounts. Classes, students and charts are saved in
          this browser on this device. To move them to another computer, or to keep a copy
          safe, use <span className="font-medium text-foreground">Download backup</span> on the
          dashboard and open the file on the other device. Clearing your browser data erases
          what&apos;s stored here, so keep a backup.
        </p>
      </section>
    </main>
  );
}
