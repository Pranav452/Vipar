"use client"

import createGlobe, { COBEOptions } from "cobe"
import { useEffect, useRef } from "react"

import { lanes } from "@/lib/stats"
import { ORIGIN } from "@/lib/ports"
import { cn } from "@/lib/utils"

const EMERALD: [number, number, number] = [16 / 255, 185 / 255, 129 / 255]

const maxContainers = Math.max(...lanes.map((l) => l.containers))

// One arc per trade lane, Nhava Sheva -> destination port, plus a marker at
// every port sized by container volume.
const GLOBE_CONFIG: Omit<COBEOptions, "width" | "height"> = {
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.22,
  dark: 1,
  diffuse: 1.2,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [0.3, 0.3, 0.3],
  markerColor: EMERALD,
  glowColor: [0.06, 0.06, 0.06],
  arcColor: EMERALD,
  arcWidth: 0.4,
  arcHeight: 0.4,
  markers: [
    { location: ORIGIN.coords, size: 0.08 },
    ...lanes.map((lane) => ({
      location: lane.coords,
      size: 0.035 + 0.045 * (lane.containers / maxContainers),
    })),
  ],
  arcs: lanes.map((lane) => ({
    from: ORIGIN.coords,
    to: lane.coords,
    color: EMERALD,
  })),
}

export function TradeGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const rotationOffset = useRef(0)

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      rotationOffset.current = delta / 200
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let width = canvas.offsetWidth
    let phi = 2.05 // start centred on the Indian Ocean
    let frame = 0

    const onResize = () => {
      width = canvas.offsetWidth
    }
    window.addEventListener("resize", onResize)

    const globe = createGlobe(canvas, {
      ...GLOBE_CONFIG,
      width: width * 2,
      height: width * 2,
      phi,
    })

    const render = () => {
      if (pointerInteracting.current === null) phi += 0.0028
      globe.update({
        phi: phi + rotationOffset.current,
        width: width * 2,
        height: width * 2,
      })
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)

    const reveal = setTimeout(() => {
      canvas.style.opacity = "1"
    })

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(reveal)
      window.removeEventListener("resize", onResize)
      globe.destroy()
    }
  }, [])

  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[600px]", className)}>
      <canvas
        className="size-full opacity-0 transition-opacity duration-700 [contain:layout_paint_size]"
        ref={canvasRef}
        onPointerDown={(e) => updatePointerInteraction(e.clientX - pointerInteractionMovement.current)}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) => e.touches[0] && updateMovement(e.touches[0].clientX)}
      />
    </div>
  )
}
