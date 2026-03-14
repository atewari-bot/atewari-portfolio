'use client'

import { useState } from 'react'
import LeftNav, { type PortfolioView } from './LeftNav'
import Hero from './Hero'
import ProjectsSection from './ProjectsSection'
import AboutSection from './AboutSection'
import JournalSection from './JournalSection'
import QuestionsSection from './QuestionsSection'
import CertificationsSection from './CertificationsSection'
import PublicationsSection from './PublicationsSection'
import ContactSection from './ContactSection'

export default function PortfolioLayout() {
  const [view, setView] = useState<PortfolioView>('home')

  return (
    <>
      <LeftNav view={view} onViewChange={setView} />

      {/* Content — offset for desktop sidebar, bottom padding for mobile tab bar */}
      <main className="lg:pl-[220px] pb-16 lg:pb-0 min-h-screen">
        {view === 'home' ? (
          <>
            <Hero />
            <ProjectsSection />
            <AboutSection />
            <CertificationsSection />
            <PublicationsSection />
            <ContactSection />
          </>
        ) : (
          <>
            <Hero />
            <JournalSection />
            <QuestionsSection />
          </>
        )}
      </main>
    </>
  )
}
