// Fired by WorkSection's pin ScrollTrigger the instant its phase-2 slide-off
// finishes — the single source of truth for "CONTACT is fully reached,"
// since only that trigger knows its own total (gallery + reveal) scroll
// distance. ContactSection listens for this once and never hides again.
export const CONTACT_REVEALED = 'contact:revealed'
