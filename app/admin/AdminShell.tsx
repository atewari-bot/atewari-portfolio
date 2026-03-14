'use client'

import LeftNav from '@/components/LeftNav'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LeftNav />
      <div className="lg:pl-[220px] pb-16 lg:pb-0">
        {children}
      </div>
    </>
  )
}
