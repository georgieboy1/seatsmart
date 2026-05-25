export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Terms of Service</h1>
      <div className="prose prose-sm prose-neutral">
        <p><strong>Last Updated: May 25, 2026</strong></p>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Use of Service</h2>
        <p>
          SynDesk is provided &quot;as is&quot; for educational purposes. We do not
          guarantee the absolute optimality of seating charts, as individual
          classroom needs may vary.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. User Responsibility</h2>
        <p>
          Teachers are responsible for the accuracy of attendee data and for
          ensuring they have the necessary permissions within their school
          district to use this tool.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Termination</h2>
        <p>
          We reserve the right to terminate accounts that violate our security
          policies or attempt to bypass system constraints.
        </p>
      </div>
    </main>
  );
}
