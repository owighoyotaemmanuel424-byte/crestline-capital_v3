export default function Loading() {
  return (
    <main className="container" style={{ paddingTop: 60 }}>
      <div
        className="card"
        style={{ padding: 24 }}
        role="status"
        aria-live="polite"
        aria-label="Loading Crestline Capital workspace"
      >
        Loading your secure Crestline Capital workspace…
      </div>
    </main>
  );
}
