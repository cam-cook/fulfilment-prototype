import type { Flag } from '../engine'

export function FlagsPanel({ flags }: { flags: Flag[] }) {
  return (
    <section className="panel" aria-labelledby="flags-title">
      <h2 id="flags-title" className="panel-title">
        Flags
      </h2>
      {flags.length === 0 ? (
        <p className="muted small">No differences worth flagging.</p>
      ) : (
        <ul className="flags">
          {flags.map((f) => (
            <li key={f.id} className={`flag flag-${f.severity}`}>
              <strong>{f.title}</strong>
              <span>{f.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
