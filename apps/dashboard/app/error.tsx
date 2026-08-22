"use client";

import { IconAlert } from "@/components/icons";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-page">
      <div className="card">
        <p className="kicker">Error</p>
        <h1 style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
          <IconAlert size={24} />
          Something went wrong
        </h1>
        <p className="muted">{error.message}</p>
        <button type="button" className="btn" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
