import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/session'
import { getAllVisitors } from '@/lib/db'
import { initAdminDb } from '@/lib/admin'
import AdminActions from './AdminActions'

export const dynamic = 'force-dynamic'

function formatDate(raw: string) {
  const d = new Date(raw + (raw.endsWith('Z') ? '' : 'Z'))
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export default async function AdminPage() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn) redirect('/admin/login')

  await initAdminDb()
  const visitors = await getAllVisitors()

  const total = visitors.length
  const unique = new Set(visitors.map(v => v.fingerprint).filter(Boolean)).size
  const returning = visitors.filter(v => v.returning_visitor === 1).length

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">Visitor Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">Logged in as {session.username}</p>
        </div>
        <AdminActions />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Sessions', value: total },
          { label: 'Unique Devices', value: unique },
          { label: 'Return Visits', value: returning },
        ].map(stat => (
          <div key={stat.label} className="bg-surface border border-border rounded-card p-5">
            <p className="text-3xl font-bold text-accent">{stat.value}</p>
            <p className="text-muted text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-text">All Visits</h2>
        </div>

        {visitors.length === 0 ? (
          <p className="text-muted text-sm px-6 py-10 text-center">No visitors yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
                  {['#', 'Name', 'Browser', 'OS', 'Language', 'Timezone', 'Screen', 'Returning', 'Timestamp'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visitors.map((v, i) => (
                  <tr
                    key={v.id as number}
                    className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-4 py-3 text-muted tabular-nums">{total - i}</td>
                    <td className="px-4 py-3 font-medium text-text whitespace-nowrap">{v.name as string}</td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.browser as string) ?? '—'}</td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.os as string) ?? '—'}</td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.language as string) ?? '—'}</td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.timezone as string) ?? '—'}</td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{(v.screen_res as string) ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {v.returning_visitor === 1
                        ? <span className="text-xs bg-accent-dim text-accent px-2 py-0.5 rounded-full font-medium">Yes</span>
                        : <span className="text-xs text-muted">No</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap tabular-nums">
                      {formatDate(v.visit_time as string)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
