import { useState } from 'react'
import CinematicScrollLayer from './cinematic/CinematicScrollLayer'
import Navbar from './components/Navbar'
import CursorScroll from './components/CursorScroll'
import ContactModal from './components/ContactModal'

export default function App() {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <>
      <CinematicScrollLayer />
      <Navbar onContactOpen={() => setContactOpen(true)} />
      <CursorScroll />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}
