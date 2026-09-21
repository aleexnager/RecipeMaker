import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { CloseIcon } from './icons'

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let controls: IScannerControls | undefined
    let cancelled = false
    let lastDetected = ''
    let lastDetectedAt = 0

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (!result) return
        const text = result.getText()
        const now = Date.now()
        // Evita disparar el mismo código repetidamente mientras la cámara sigue enfocándolo.
        if (text === lastDetected && now - lastDetectedAt < 3000) return
        lastDetected = text
        lastDetectedAt = now
        onDetected(text)
      })
      .then((c) => {
        if (cancelled) {
          c.stop()
        } else {
          controls = c
        }
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? `No se pudo acceder a la cámara: ${err.message}`
            : 'No se pudo acceder a la cámara.',
        )
      })

    return () => {
      cancelled = true
      controls?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="safe-top flex items-center justify-between p-4 text-white">
        <h2 className="text-[17px] font-semibold tracking-tight">Escanear código de barras</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="tap flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <CloseIcon className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-1/3 w-4/5">
            {(['-top-0.5 -left-0.5 rounded-tl-2xl border-t-[3px] border-l-[3px]',
              '-top-0.5 -right-0.5 rounded-tr-2xl border-t-[3px] border-r-[3px]',
              '-bottom-0.5 -left-0.5 rounded-bl-2xl border-b-[3px] border-l-[3px]',
              '-bottom-0.5 -right-0.5 rounded-br-2xl border-b-[3px] border-r-[3px]',
            ] as const).map((corner) => (
              <div key={corner} className={`absolute h-8 w-8 border-brand-400 ${corner}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="safe-bottom p-4 text-center text-sm text-white/70">
        {error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <p>Apunta la cámara al código de barras del producto.</p>
        )}
      </div>
    </div>
  )
}
