'use client'

import { useState, useEffect } from 'react'
import LeftNav, { type PortfolioView } from './LeftNav'
import Breadcrumb from './Breadcrumb'
import Hero from './Hero'
import ProjectsSection from './ProjectsSection'
import AboutSection from './AboutSection'
import JournalSection from './JournalSection'
import QuestionsSection from './QuestionsSection'
import CertificationsSection from './CertificationsSection'
import PublicationsSection from './PublicationsSection'
import ContactSection from './ContactSection'

export default function PortfolioLayout() {
  // Read ?tab from URL so admin can deep-link back to Journal tab
  const [view, setView] = useState<PortfolioView>('home')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'journal') setView('journal')
  }, [])

  return (
    <>
      <LeftNav view={view} onViewChange={setView} />

      {/* div (not main) — root layout already wraps everything in <main> */}
      <div className="lg:pl-[220px] pb-16 lg:pb-0 min-h-screen">
        <Breadcrumb items={
          view === 'journal'
            ? [{ label: 'Home', href: '/' }, { label: 'Journal' }]
            : [{ label: 'Home' }]
        } />

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
      </div>
    </>
  )
}
