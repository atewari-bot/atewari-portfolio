import Hero from '@/components/Hero'
import ProjectsSection from '@/components/ProjectsSection'
import AboutSection from '@/components/AboutSection'
import JournalSection from '@/components/JournalSection'
import QuestionsSection from '@/components/QuestionsSection'
import CertificationsSection from '@/components/CertificationsSection'
import PublicationsSection from '@/components/PublicationsSection'
import ContactSection from '@/components/ContactSection'

export default function Home() {
  return (
    <>
      <Hero />
      <JournalSection />
      <QuestionsSection />
      <ProjectsSection />
      <AboutSection />
      <CertificationsSection />
      <PublicationsSection />
      <ContactSection />
    </>
  )
}

