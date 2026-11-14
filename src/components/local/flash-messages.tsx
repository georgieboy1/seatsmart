"use client";

import { useSearchParams } from "next/navigation";

/** Shows the ?error= / ?success= messages the save functions redirect with. */
export function FlashMessages() {
  const params = useSearchParams();
  const error = params.get("error");
  const success = params.get("success");
  return (
    <>
      {error && (
        <div role="alert" className="mb-6 border-[1.5px] border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="mb-6 border-[1.5px] border-green-700 bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      )}
    </>
  );
}
