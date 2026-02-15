import Hero from '@/components/Hero'
import ProjectsSection from '@/components/ProjectsSection'
import AboutSection from '@/components/AboutSection'
import CertificationsSection from '@/components/CertificationsSection'
import ContactSection from '@/components/ContactSection'

export default function Home() {
  return (
    <>
      <Hero />
      <ProjectsSection />
      <AboutSection />
      <CertificationsSection />
      <ContactSection />
    </>
  )
}
