import Cropper from 'react-easy-crop'
import { useState, useCallback } from 'react'
import { getCroppedImg } from '../utils/cropImage'

export default function CropModal({ src, onConfirm, onCancel }) {
  const [crop,  setCrop]  = useState({ x: 0, y: 0 })
  const [zoom,  setZoom]  = useState(1)
  const [area,  setArea]  = useState(null)
  const [busy,  setBusy]  = useState(false)

  const onCropComplete = useCallback((_, pixels) => setArea(pixels), [])

  const handleConfirm = async () => {
    if (!area) return
    setBusy(true)
    try {
      const blob   = await getCroppedImg(src, area)
      const blobUrl = URL.createObjectURL(blob)
      onConfirm(blobUrl)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', flexDirection: 'column',
        background: '#050507',
      }}
    >
      {/* Hint */}
      <div
        style={{
          padding: '12px 20px',
          fontSize: '11px', letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        拖动画面调整构图 · 滚轮或滑块缩放
      </div>

      {/* Crop area */}
      <div style={{ position: 'relative', flex: 1 }}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#0a0a0c' },
            cropAreaStyle: {
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
              color: 'transparent',
            },
          }}
        />
      </div>

      {/* Controls */}
      <div
        style={{
          flexShrink: 0,
          background: '#0e0e10',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}
      >
        <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
          缩放
        </span>
        <input
          type="range" min={1} max={3} step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
        />
        <button
          onClick={onCancel}
          style={{
            flexShrink: 0,
            background: 'none',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.35)',
            padding: '6px 16px',
            fontSize: '11px', letterSpacing: '0.15em',
            cursor: 'pointer',
          }}
        >
          取消
        </button>
        <button
          onClick={handleConfirm}
          disabled={busy}
          style={{
            flexShrink: 0,
            background: busy ? 'rgba(240,239,236,0.5)' : '#f0efec',
            border: 'none',
            color: '#111',
            padding: '6px 20px',
            fontSize: '11px', letterSpacing: '0.15em',
            cursor: busy ? 'default' : 'pointer',
            fontWeight: 500,
          }}
        >
          {busy ? '处理中…' : '确认裁剪'}
        </button>
      </div>
    </div>
  )
}
