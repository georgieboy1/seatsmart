/**
 * Client-side stand-ins for the server-action helpers SynDesk used to call
 * (`redirect` and `revalidatePath` from next/*).
 *
 * The save functions in lib/{students,classes,layouts,charts}/actions.ts run
 * in the browser now, so "redirect after save" becomes a router push. The
 * router is registered once by <RouterBridge /> in the root layout; before
 * that (or in unit tests) we fall back to a plain location change.
 */
type Navigator = { push: (href: string) => void };

let navigator: Navigator | null = null;

export function registerNavigator(next: Navigator | null) {
  navigator = next;
}

export function go(href: string): void {
  if (navigator) {
    navigator.push(href);
    return;
  }
  if (typeof window !== "undefined") {
    window.location.assign(href);
  }
}

/** Build `/path?error=...` style URLs the pages already know how to show. */
export function withMessage(path: string, kind: "error" | "success", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${kind}=${encodeURIComponent(message)}`;
}
