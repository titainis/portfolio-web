import { useState } from 'react'
import CinematicScrollLayer from './cinematic/CinematicScrollLayer'
import Navbar from './components/Navbar'
import CursorScroll from './components/CursorScroll'
import ContactModal from './components/ContactModal'
import Preloader from './components/Preloader'
import { LanguageProvider } from './context/LanguageContext'

export default function App() {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <LanguageProvider>
      <CinematicScrollLayer onContactOpen={() => setContactOpen(true)} />
      <Navbar onContactOpen={() => setContactOpen(true)} />
      <CursorScroll />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <Preloader />
    </LanguageProvider>
  )
}
