"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerNavigator } from "@/lib/local/nav";

/** Lets the (non-React) save functions navigate with the app router. */
export function RouterBridge() {
  const router = useRouter();
  useEffect(() => {
    registerNavigator(router);
    return () => registerNavigator(null);
  }, [router]);
  return null;
}
