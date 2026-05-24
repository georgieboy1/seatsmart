import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          We sent you a verification link. Click it to finish creating your
          account, then return here to log in.
        </p>
        <Link href="/login" className="text-sm font-medium underline">
          Back to log in
        </Link>
      </div>
    </main>
  );
}
