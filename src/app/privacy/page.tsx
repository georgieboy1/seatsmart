export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
      <div className="prose prose-sm prose-neutral">
        <p><strong>Effective Date: May 25, 2026</strong></p>
        <p>
          SynDesk is committed to protecting your privacy. This policy explains
          how we handle student and teacher data.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Data Ownership</h2>
        <p>
          All student data you enter is owned by you. We do not sell, share, or
          rent this data to third parties.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Data Security</h2>
        <p>
          Your data is stored securely in Supabase (PostgreSQL) and is protected
          by Row Level Security (RLS). Only your authenticated account can access
          the students and classroom layouts you create.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Cookies</h2>
        <p>
          We use essential cookies for authentication purposes only. No tracking
          pixels or third-party analytics are used in version 1.0.
        </p>
      </div>
    </main>
  );
}
