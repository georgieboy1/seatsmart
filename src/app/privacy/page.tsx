export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
      <div className="space-y-4 text-sm leading-relaxed">
        <p><strong>Effective date: November 14, 2026</strong></p>
        <p>
          SynDesk is a free classroom seating tool made by KC Studio, a Future of the Isles
          studio. It was built so that student information never has to leave a teacher&apos;s
          device. This page explains exactly what that means.
        </p>

        <h2 className="mt-6 text-xl font-semibold">1. Your data stays in your browser</h2>
        <p>
          The classes, students, accommodations, relationships, layouts and charts you enter
          are saved in your web browser&apos;s local storage on the device you&apos;re using.
          SynDesk has no server-side database and no accounts. We never receive, see or store
          any of it.
        </p>

        <h2 className="mt-6 text-xl font-semibold">2. Files you create</h2>
        <p>
          When you download a backup or export a CSV, the file is created on your device and
          saved wherever you choose. Those files can contain sensitive student information, so
          store and share them according to your school&apos;s policies.
        </p>

        <h2 className="mt-6 text-xl font-semibold">3. No tracking</h2>
        <p>
          SynDesk does not use analytics, advertising, tracking pixels or cookies. Fonts and
          code are served with the app itself, so using SynDesk makes no requests to third
          parties.
        </p>

        <h2 className="mt-6 text-xl font-semibold">4. Hosting</h2>
        <p>
          The app&apos;s files are delivered by our hosting provider, which may keep standard
          web server logs (such as IP address, browser type and the time of the request) to
          operate and secure the service. These logs never include anything you type into
          SynDesk.
        </p>

        <h2 className="mt-6 text-xl font-semibold">5. Deleting your data</h2>
        <p>
          Because everything is stored in your browser, you are in full control. Delete
          individual students, classes or charts in the app, or clear this site&apos;s data in
          your browser settings to remove everything at once.
        </p>

        <h2 className="mt-6 text-xl font-semibold">6. Contact</h2>
        <p>
          Questions about this policy? Use the contact form at{" "}
          <a className="underline" href="https://futureoftheisles.org/about/#contact">
            futureoftheisles.org/about
          </a>
          .
        </p>
      </div>
    </main>
  );
}
