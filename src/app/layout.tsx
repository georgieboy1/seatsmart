import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { TerminologyProvider } from "@/components/providers/terminology-provider";
import { getProfile } from "@/lib/attendees/profile";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Brutalist headings — sharp geometric sans, opinionated SaaS feel.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SynDesk",
  description: "Event & Wedding seating, automated.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfile();
  const workspaceType = profile?.workspaceType ?? "education";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <div className="block lg:hidden bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-3 w-3" />
            <span>SynDesk is optimized for desktop. Some features may be limited on mobile.</span>
          </div>
        </div>
        <TerminologyProvider workspaceType={workspaceType}>
          <TooltipProvider>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </TooltipProvider>
        </TerminologyProvider>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground bg-muted/20">
          <div className="container mx-auto flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
            <p>© 2026 SynDesk</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
            </div>
          </div>
        </footer>
        {/* App-wide toast surface for optimistic-UI feedback.
            Position bottom-right; the brutalist tokens cascade naturally. */}
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            className: "border-[1.5px] border-foreground rounded-none",
          }}
        />
      </body>
    </html>
  );
}
