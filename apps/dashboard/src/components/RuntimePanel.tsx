import type { RuntimeSnapshot } from '@federation-wizards/mf-plugins';

interface RuntimePanelProps {
  snapshots: RuntimeSnapshot[];
  loading: boolean;
  error: string | null;
}

export function RuntimePanel({ snapshots, loading, error }: RuntimePanelProps) {
  return (
    <section className="panel">
      <h2>Live runtime</h2>
      {loading ? <p className="muted">Loading runtime snapshots…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && snapshots.length === 0 ? (
        <p className="muted">
          No runtime snapshots yet. Start a federated host with the fwiz runtime
          inspector plugin to stream live data.
        </p>
      ) : null}
      {snapshots.map((snapshot) => (
        <article key={snapshot.hostName} className="runtime-card">
          <header>
            <strong>{snapshot.hostName}</strong>
            <span className="muted">
              {new Date(snapshot.updatedAt).toLocaleTimeString()}
            </span>
          </header>
          <p>{snapshot.remotes.length} remote(s)</p>
          <ul className="runtime-list">
            {Object.values(snapshot.shareScope).map((entry) => (
              <li key={`${snapshot.hostName}-${entry.name}`}>
                <span>{entry.name}</span>
                <span>{entry.version}</span>
                <span>{entry.loaded ? 'loaded' : 'pending'}</span>
              </li>
            ))}
          </ul>
          {snapshot.events.length > 0 ? (
            <details>
              <summary>{snapshot.events.length} recent event(s)</summary>
              <ul className="runtime-list">
                {snapshot.events.slice(-5).map((event, index) => (
                  <li key={`${event.type}-${event.timestamp}-${index}`}>
                    {event.type} at{' '}
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </article>
      ))}
    </section>
  );
}
