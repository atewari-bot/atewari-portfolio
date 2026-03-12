import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/session'
import { getAllVisitors } from '@/lib/db'
import { initAdminDb } from '@/lib/admin'
import AdminActions from './AdminActions'
import VisitorTable from './VisitorTable'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn) redirect('/admin/login')

  await initAdminDb()
  const visitors = await getAllVisitors()

  const total     = visitors.length
  const unique    = new Set(visitors.map(v => v.fingerprint).filter(Boolean)).size
  const returning = visitors.filter(v => v.returning_visitor === 1).length

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
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
          { label: 'Return Visits',  value: returning },
        ].map(stat => (
          <div key={stat.label} className="bg-surface border border-border rounded-card p-5">
            <p className="text-3xl font-bold text-accent">{stat.value}</p>
            <p className="text-muted text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <VisitorTable initialVisitors={visitors as Record<string, unknown>[]} />
    </div>
  )
}
