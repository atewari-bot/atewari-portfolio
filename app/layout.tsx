import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

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
    <html lang="en">
      <body className="bg-bg text-text leading-relaxed">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
