/** Grey placeholder blocks while data loads (no spinner flashing; static if reduced motion is on) */
export function Skeleton({ lines = 3, chart = false }: { lines?: number; chart?: boolean }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading">
      {chart && <div className="sk sk-chart" />}
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="sk sk-line" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <main className="wrap" style={{ paddingTop: 40 }}>
      <div className="sk sk-title" />
      <div className="grid">
        <div className="card"><Skeleton chart /></div>
        <div className="card"><Skeleton lines={5} /></div>
      </div>
    </main>
  );
}
