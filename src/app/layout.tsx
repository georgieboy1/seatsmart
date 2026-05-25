import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
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

export const metadata: Metadata = {
  title: "SeatSmart",
  description: "Classroom seating, automated.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <div className="block lg:hidden bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-3 w-3" />
            <span>SeatSmart is optimized for desktop. Some features may be limited on mobile.</span>
          </div>
        </div>
        <TooltipProvider>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </TooltipProvider>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground bg-muted/20">
          <div className="container mx-auto flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
            <p>© 2026 SeatSmart</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
