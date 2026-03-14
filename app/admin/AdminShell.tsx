'use client'

import { usePathname } from 'next/navigation'
import LeftNav from '@/components/LeftNav'
import Breadcrumb from '@/components/Breadcrumb'

const PATH_LABELS: Record<string, string> = {
  '/admin':         'Dashboard',
  '/admin/login':   'Login',
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pageLabel = PATH_LABELS[pathname] ?? 'Admin'

  const items =
    pathname === '/admin/login'
      ? [{ label: 'Home', href: '/' }, { label: 'Admin', href: '/admin' }, { label: 'Login' }]
      : [{ label: 'Home', href: '/' }, { label: pageLabel }]

  return (
    <>
      <LeftNav />
      <div className="lg:pl-[220px] pb-16 lg:pb-0">
        <Breadcrumb items={items} />
        {children}
      </div>
    </>
  )
}
