import { useRef } from 'react'
import TextCursorProximity from './text-cursor-proximity'

interface ProximityTextProps {
  text: string
  className?: string
  style?: React.CSSProperties
  radius?: number
  scale?: number
}

// Thin convenience wrapper around TextCursorProximity: every call site needs
// its own containerRef + the same "scale up near the cursor" styles map, so
// this just wires that up once instead of repeating it at every usage.
export default function ProximityText({
  text,
  className,
  style,
  radius = 70,
  scale = 1.18,
}: ProximityTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="inline-block">
      {/* key={text}: TextCursorProximity calls useMotionValue/useTransform
          once per letter, so a different-length string (e.g. swapping to a
          translation) changes how many hooks it calls on the *same*
          instance — a real Rules-of-Hooks violation, not just a lint
          warning, and it crashes the tree. Keying on the text forces a
          clean remount instead of an in-place re-render whenever it changes. */}
      <TextCursorProximity
        key={text}
        label={text}
        containerRef={containerRef}
        radius={radius}
        falloff="gaussian"
        className={className}
        style={style}
        styles={{ transform: { from: 'scale(1)', to: `scale(${scale})` } }}
      />
    </div>
  )
}
