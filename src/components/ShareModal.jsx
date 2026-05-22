import { useState, useRef } from 'react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { toCanvas } from 'html-to-image'

export default function ShareModal({ shareUrl, contentRef, onClose }) {
  const [copied,    setCopied]    = useState(false)
  const [exporting, setExporting] = useState(false)
  const qrExportRef = useRef(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportImage = async () => {
    if (!contentRef?.current) return
    setExporting(true)
    try {
      const el = contentRef.current

      // 1. Directly mutate the live DOM — no hidden iframe clone, no font race
      const hideNodes = [...el.querySelectorAll('[data-export-hide]')]
      const showNodes = [...el.querySelectorAll('[data-export-show]')]
      const hidePrev  = hideNodes.map(n => n.style.display)
      const showPrev  = showNodes.map(n => n.style.display)
      hideNodes.forEach(n => { n.style.display = 'none' })
      showNodes.forEach(n => { n.style.display = n.getAttribute('data-export-show') || 'block' })

      // 2. Remove scale transform so we capture at design resolution
      const prevTransform    = el.style.transform
      const prevWidth        = el.style.width
      const prevMarginBottom = el.style.marginBottom
      el.style.transform    = 'none'
      el.style.width        = '100%'
      el.style.marginBottom = '0'

      // 3. Capture — html-to-image inlines fonts as base64, no font loading race
      const mainCanvas = await toCanvas(el, {
        pixelRatio: 2,
        backgroundColor: '#0e0e0f',
        skipAutoScale: false,
      })

      // 4. Restore live DOM immediately
      el.style.transform    = prevTransform
      el.style.width        = prevWidth
      el.style.marginBottom = prevMarginBottom
      hideNodes.forEach((n, i) => { n.style.display = hidePrev[i] })
      showNodes.forEach((n, i) => { n.style.display = showPrev[i] })

      // 5. Composite: main content + dark footer with QR code
      const qrCanvas = qrExportRef.current?.querySelector('canvas')
      const QR_SIZE  = 120
      const FOOTER_H = QR_SIZE + 40

      const final = document.createElement('canvas')
      final.width  = mainCanvas.width
      final.height = mainCanvas.height + FOOTER_H
      const ctx = final.getContext('2d')

      ctx.fillStyle = '#0e0e0f'
      ctx.fillRect(0, 0, final.width, final.height)
      ctx.drawImage(mainCanvas, 0, 0)

      if (qrCanvas) {
        const PAD  = 24
        const x    = PAD
        const y    = mainCanvas.height + (FOOTER_H - QR_SIZE) / 2
        const QPAD = 10

        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.beginPath()
        ctx.roundRect(x - QPAD, y - QPAD, QR_SIZE + QPAD * 2, QR_SIZE + QPAD * 2, 8)
        ctx.fill()
        ctx.drawImage(qrCanvas, x, y, QR_SIZE, QR_SIZE)
      }

      const link = document.createElement('a')
      link.download = 'shipping-music.png'
      link.href = final.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error(e)
      alert('导出失败：' + e.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Hidden QR canvas used only for image export */}
      <div ref={qrExportRef} style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}>
        <QRCodeCanvas value={shareUrl} size={300} level="M" />
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '320px', width: '100%' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', margin: 0, letterSpacing: '0.1em' }}>分享歌单</h2>

        <div style={{ padding: '12px', background: '#f5f4f2', borderRadius: '8px' }}>
          <QRCodeSVG value={shareUrl} size={180} level="M" />
        </div>

        <p style={{ fontSize: '10px', color: '#999', textAlign: 'center', margin: 0, wordBreak: 'break-all', lineHeight: 1.6 }}>
          {shareUrl}
        </p>

        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            onClick={copy}
            style={{ flex: 1, padding: '10px', fontSize: '11px', letterSpacing: '0.12em', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {copied ? '已复制 ✓' : '复制链接'}
          </button>
          <button
            onClick={exportImage}
            disabled={exporting}
            style={{ flex: 1, padding: '10px', fontSize: '11px', letterSpacing: '0.12em', background: exporting ? '#f5f4f2' : '#f0efec', color: exporting ? '#bbb' : '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: exporting ? 'default' : 'pointer', fontFamily: 'inherit' }}
          >
            {exporting ? '生成中…' : '导出图片'}
          </button>
        </div>

        <button
          onClick={onClose}
          style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
        >
          关闭
        </button>
      </div>
    </div>
  )
}
