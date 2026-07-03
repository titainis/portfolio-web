import { Suspense, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

const MODEL_PATH = '/models/torii-gate.glb'

// Camera dolly range: far away while the cover is still closed, close up
// (but not so close the frame crops it) once fully revealed.
const CAMERA_START_Z = 20
const CAMERA_END_Z = 6

// Bridge between the DOM scroll world and the R3F render loop: the
// ScrollTrigger below writes into this on scroll and CameraRig reads it
// every frame. A plain mutable object (not React state) so neither side
// triggers re-renders at scroll speed.
export const scrollProgress = { value: 0 }

function CameraRig() {
  useFrame(({ camera }) => {
    const distance = THREE.MathUtils.lerp(
      CAMERA_START_Z,
      CAMERA_END_Z,
      scrollProgress.value,
    )
    // Dolly along the current view ray (the orbit target is the origin)
    // instead of assigning position.z directly — a raw z write would fight
    // OrbitControls as soon as the user drags the gate off-axis, ballooning
    // the orbit radius and jamming the rotation.
    camera.position.setLength(distance)
  })
  return null
}

function GateModel() {
  const gltf = useGLTF(MODEL_PATH)
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    // Center the model on the origin and scale it to fit a 3x3x3 box
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    const maxDimension = Math.max(size.x, size.y, size.z)
    const scale = maxDimension > 0 ? 3 / maxDimension : 1

    gltf.scene.position.sub(center)
    group.scale.setScalar(scale)
  }, [gltf.scene])

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  )
}

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    // Visibility gate. A fixed section can't be hidden by the hero, because
    // the hero is itself a stack of FIXED layers behind a transparent
    // in-flow spacer — no static z-order can put the (opaque, permanent)
    // landscape above the gate during the intro AND below it at the reveal.
    // So the gate stays hidden until the WORK cover scrolls on screen — from
    // that point it sits safely behind WORK/About's opaque z-30 until the
    // phase-2 slide uncovers it. Scrolling back above WORK re-hides it so
    // it never bleeds through the hero or the intro layers.
    const trigger = ScrollTrigger.create({
      trigger: '#work',
      start: 'top bottom',
      onEnter: () => gsap.set(section, { autoAlpha: 1 }),
      onLeaveBack: () => gsap.set(section, { autoAlpha: 0 }),
    })

    return () => trigger.kill()
  }, [])

  return (
    // Permanently fixed, filling the viewport — it never occupies document
    // flow, so it can sit directly behind WORK (z-30) at all times. WORK's
    // own pin (in WorkSection.tsx) is extended to slide itself away via
    // xPercent:-100 once its gallery finishes scrubbing, which is what
    // actually performs the reveal; this section just needs to already be
    // here, one z-index lower, the whole time. Its own scrollProgress
    // (imported by WorkSection) drives the camera dolly below.
    //
    // z-[25]: above the fixed .cinematic-ui-overlay (z-20 — an empty hero
    // overlay the intro timeline leaves pointer-events:auto; anything below
    // it never receives a drag), below the WORK cover (z-30). Starts
    // visibility:hidden inline so it can't flash over the hero before the
    // gating effect above runs.
    <section
      id="contact"
      ref={sectionRef}
      className="fixed inset-0 z-[25] overflow-hidden"
      style={{ visibility: 'hidden', opacity: 0 }}
    >
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <video
          src="/videos/water-drop.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      </div>

      {/* Subtle dark overlay so white text stays readable over the water highlights */}
      <div className="absolute inset-0 z-[1] bg-black/30" />

      {/* 3D background — pure backdrop, all pointer input lands here */}
      <div className="absolute inset-0 z-10">
        <Canvas
          className="h-screen w-screen"
          camera={{ position: [0, 0, CAMERA_START_Z], fov: 45 }}
          gl={{ alpha: true }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={3} />
          <directionalLight position={[-5, 3, -5]} intensity={1} />
          <Suspense fallback={null}>
            <GateModel />
          </Suspense>
          <CameraRig />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            autoRotate={false}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </div>

      {/* Text overlay — pointer-events-none lets drags pass straight
          through to the canvas so the gate can be spun from anywhere. */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-4xl font-normal leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          WANT TO WORK ON SOMETHING?
        </h2>
        <p className="mt-6 text-sm uppercase tracking-widest text-white/50 sm:text-base">
          CONTACT US
        </p>
      </div>
    </section>
  )
}

useGLTF.preload(MODEL_PATH)
