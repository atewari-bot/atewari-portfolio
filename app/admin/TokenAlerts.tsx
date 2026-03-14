import { checkAllTokens, type TokenStatus } from '@/lib/tokenHealth'

const SEVERITY: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  ok:      { bg: 'rgba(63,185,80,0.05)',  border: 'rgba(63,185,80,0.2)',  dot: '#3fb950', label: 'OK' },
  warning: { bg: 'rgba(210,153,34,0.08)', border: 'rgba(210,153,34,0.25)', dot: '#d2993a', label: 'Expiring soon' },
  error:   { bg: 'rgba(248,81,73,0.07)',  border: 'rgba(248,81,73,0.25)', dot: '#f85149', label: 'Action required' },
}

function severity(s: TokenStatus): keyof typeof SEVERITY {
  if (!s.ok) return 'error'
  if (s.daysLeft !== undefined && s.daysLeft <= 14) return 'warning'
  return 'ok'
}

export default async function TokenAlerts() {
  const statuses = await checkAllTokens()
  const issues = statuses.filter(s => severity(s) !== 'ok')

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          System Health
        </span>
        {issues.length === 0 ? (
          <span style={{ fontSize: 11, background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.2)', color: '#3fb950', borderRadius: 99, padding: '1px 8px' }}>
            All healthy
          </span>
        ) : (
          <span style={{ fontSize: 11, background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.25)', color: '#f85149', borderRadius: 99, padding: '1px 8px' }}>
            {issues.length} issue{issues.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {statuses.map(s => {
          const sev = severity(s)
          const style = SEVERITY[sev]
          return (
            <div
              key={s.name}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: style.bg, border: `1px solid ${style.border}`,
                borderRadius: 8, padding: '10px 14px',
              }}
            >
              {/* Status dot */}
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: style.dot, flexShrink: 0,
                boxShadow: sev !== 'ok' ? `0 0 6px ${style.dot}` : 'none',
              }} />

              {/* Service name */}
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', minWidth: 56, flexShrink: 0 }}>
                {s.name}
              </span>

              {/* Divider */}
              <span style={{ color: '#30363d', flexShrink: 0 }}>·</span>

              {/* Message */}
              <span style={{ fontSize: 12, color: sev === 'ok' ? '#8b949e' : '#e6edf3', flex: 1 }}>
                {s.message}
              </span>

              {/* Badge */}
              <span style={{
                fontSize: 10, fontWeight: 700, color: style.dot,
                background: style.bg, border: `1px solid ${style.border}`,
                borderRadius: 99, padding: '2px 8px', flexShrink: 0,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {style.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
