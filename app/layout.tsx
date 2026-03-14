import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
})
import Footer from '@/components/Footer'
import VisitorModal from '@/components/VisitorModal'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Ajay Tewari — Portfolio',
  description: 'Personal portfolio of Ajay Tewari.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="bg-bg text-text leading-relaxed font-[family-name:var(--font-nunito)]">
        <VisitorModal />
        <Nav />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
