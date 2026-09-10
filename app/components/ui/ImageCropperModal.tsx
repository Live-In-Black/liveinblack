import { useRef, useState } from 'react'
import { Button, Modal, Slider } from '@/app/components/ui'
import { ZoomIn, ZoomOut, RotateCcw, ArrowLeft, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react'

export default function ImageCropperModal({
  src,
  title,
  aspect,
  outputWidth,
  circular = false,
  onCancel,
  onConfirm,
}: {
  src: string
  title: string
  aspect: number
  outputWidth: number
  circular?: boolean
  onCancel: () => void
  onConfirm: (dataUri: string) => Promise<void> | void
}) {
  const containerSize = 300
  const previewWidth = containerSize
  const previewHeight = Math.round(containerSize / aspect)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  function move(dx: number, dy: number) {
    setOffset((current) => ({ x: current.x + dx, y: current.y + dy }))
  }

  function reset() {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  async function confirm() {
    const image = imageRef.current
    if (!image) return
    setSaving(true)
    try {
      const outputHeight = Math.round(outputWidth / aspect)
      const canvas = document.createElement('canvas')
      canvas.width = outputWidth
      canvas.height = outputHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      if (circular) {
        ctx.beginPath()
        ctx.arc(outputWidth / 2, outputHeight / 2, Math.min(outputWidth, outputHeight) / 2, 0, Math.PI * 2)
        ctx.clip()
      }
      const coverScale = Math.max(outputWidth / image.naturalWidth, outputHeight / image.naturalHeight) * zoom
      const width = image.naturalWidth * coverScale
      const height = image.naturalHeight * coverScale
      const scaleX = outputWidth / previewWidth
      const scaleY = outputHeight / previewHeight
      ctx.drawImage(image, (outputWidth - width) / 2 + offset.x * scaleX, (outputHeight - height) / 2 + offset.y * scaleY, width, height)
      await onConfirm(canvas.toDataURL('image/jpeg', 0.90))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onCancel} zIndex={3200} ariaLabel={title} maxWidth={420} contentStyle={{ padding: '24px 20px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <h2 id="image-crop-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          {title}
        </h2>
        <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
          Glisse l&apos;image pour ajuster le cadrage
        </p>
      </div>

      {/* Cadre de recadrage avec masque sombre extérieur */}
      <div
        style={{
          position: 'relative',
          width: containerSize,
          height: containerSize,
          margin: '0 auto 16px',
          borderRadius: 20,
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {/* Zone interactive draggable */}
        <div
          onPointerDown={(event) => {
            setDragging(true)
            event.currentTarget.setPointerCapture(event.pointerId)
            dragStart.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }
          }}
          onPointerMove={(event) => {
            if (dragging && dragStart.current) {
              setOffset({
                x: dragStart.current.ox + event.clientX - dragStart.current.x,
                y: dragStart.current.oy + event.clientY - dragStart.current.y,
              })
            }
          }}
          onPointerUp={() => {
            setDragging(false)
            dragStart.current = null
          }}
          style={{
            width: previewWidth,
            height: previewHeight,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: circular ? '50%' : 16,
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            boxShadow: circular ? '0 0 0 9999px rgba(0, 0, 0, 0.65)' : undefined,
            border: '2px solid rgba(var(--primary-rgb), 0.75)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={src}
            alt=""
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              userSelect: 'none',
              transformOrigin: 'center',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Grille discrète de repères tiers */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: (containerSize - previewHeight) / 2,
            width: previewWidth,
            height: previewHeight,
            pointerEvents: 'none',
            borderRadius: circular ? '50%' : 16,
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255, 255, 255, 0.12)' }} />
          <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255, 255, 255, 0.12)' }} />
          <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, background: 'rgba(255, 255, 255, 0.12)' }} />
          <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: 1, background: 'rgba(255, 255, 255, 0.12)' }} />
        </div>
      </div>

      {/* Boutons directionnels & Réinitialiser */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => move(-8, 0)}
          aria-label="Déplacer vers la gauche"
          style={nudgeButtonStyle}
        >
          <ArrowLeft size={15} />
        </button>
        <button
          type="button"
          onClick={() => move(0, -8)}
          aria-label="Déplacer vers le haut"
          style={nudgeButtonStyle}
        >
          <ArrowUp size={15} />
        </button>
        <button
          type="button"
          onClick={() => move(0, 8)}
          aria-label="Déplacer vers le bas"
          style={nudgeButtonStyle}
        >
          <ArrowDown size={15} />
        </button>
        <button
          type="button"
          onClick={() => move(8, 0)}
          aria-label="Déplacer vers la droite"
          style={nudgeButtonStyle}
        >
          <ArrowRight size={15} />
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="Réinitialiser le zoom et la position"
          title="Réinitialiser"
          style={{ ...nudgeButtonStyle, width: 'auto', padding: '0 10px', gap: 5, fontSize: 12 }}
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>

      {/* Barre de contrôle du zoom */}
      <div style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 16, border: '1px solid var(--border)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
            <ZoomOut size={14} />
            Zoom
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ZoomOut size={14} color="var(--text-faint)" />
          <Slider
            accent="teal"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Niveau de zoom"
          />
          <ZoomIn size={14} color="var(--text-faint)" />
        </div>
      </div>

      {/* Actions Valider / Annuler */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 10 }}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={saving}
          style={{ height: 36, minHeight: 36, borderRadius: 'var(--radius-control)', fontWeight: 600 }}
        >
          Annuler
        </Button>
        <Button
          type="button"
          onClick={() => void confirm()}
          loading={saving}
          loadingText="Validation…"
          style={{ height: 36, minHeight: 36, borderRadius: 'var(--radius-control)', fontWeight: 700 }}
        >
          Valider
        </Button>
      </div>
    </Modal>
  )
}

const nudgeButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text-muted)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
}
