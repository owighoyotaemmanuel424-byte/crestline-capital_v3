"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container" style={{ paddingTop: 60 }}>
      <div className="card" style={{ padding: 24 }} role="alert">
        <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
        <p className="muted">
          We couldn’t load this Crestline Capital page. Please try again.
        </p>
        <button className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
