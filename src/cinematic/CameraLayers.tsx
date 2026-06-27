import type { RefObject } from 'react'

/**
 * Optional real imagery. Drop direct image URLs here; empty strings fall back
 * to the built-in cinematic gradients.
 */
const TRAIN_IMAGE = '/train_window.png'
const LANDSCAPE_IMAGE = '/landscape_view.jpg'

interface CameraLayersProps {
  landscapeRef: RefObject<HTMLDivElement>
  hazeRef: RefObject<HTMLDivElement>
  trainRef: RefObject<HTMLDivElement>
}

/**
 * The depth stack. Three independent FIXED layers, each its own DOM node with
 * its own GSAP transform target — they never share an animated transform
 * parent, so foreground and background move on completely separate systems.
 *
 *   z 0  landscape (background)  — scales / drifts (forward dolly)
 *   z 5  haze       (mid)        — atmospheric opacity during motion peak
 *   z 10 train      (foreground) — recedes / blurs / fades, locked in place
 */
export default function CameraLayers({
  landscapeRef,
  hazeRef,
  trainRef,
}: CameraLayersProps) {
  return (
    <>
      <div
        ref={landscapeRef}
        className="cinema-landscape"
        style={
          LANDSCAPE_IMAGE
            ? { backgroundImage: `url(${LANDSCAPE_IMAGE})` }
            : undefined
        }
      />
      <div ref={hazeRef} className="camera-haze" aria-hidden />
      <div
        ref={trainRef}
        className={`cinema-train${TRAIN_IMAGE ? '' : ' cinema-train--fallback'}`}
        style={
          TRAIN_IMAGE ? { backgroundImage: `url(${TRAIN_IMAGE})` } : undefined
        }
      />
    </>
  )
}
