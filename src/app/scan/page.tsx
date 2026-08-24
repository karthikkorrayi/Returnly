'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let stream: MediaStream | null = null
    let frameId: number
    let decoded = false

    function handleDecoded(text: string) {
      try {
        const url = new URL(text)
        router.push(url.pathname)
      } catch {
        router.push(text)
      }
    }

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          if (code && !decoded) {
            decoded = true
            handleDecoded(code.data)
            return
          }
        }
      }
      frameId = requestAnimationFrame(tick)
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        tick()
      } catch {
        setError('Camera access was denied or unavailable. A real physical tag scans directly with your phone\'s camera app instead.')
      }
    }

    start()

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-8 text-white">
      <h1 className="font-display text-3xl font-semibold">Scan a Returnly tag</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-white/70">
        For testing without a printed tag. A real physical tag scans directly with your phone&apos;s camera app.
      </p>
      <div className="relative mt-6 aspect-square w-full max-w-xs overflow-hidden rounded-3xl border-2 border-white/40">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {error && <p className="mt-4 max-w-xs text-center text-sm font-bold text-orange-300">{error}</p>}
    </main>
  )
}