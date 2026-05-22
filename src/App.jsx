import { useState, useEffect, useRef, useCallback } from 'react'
import ModuleCard from './components/ModuleCard'
import ShareModal from './components/ShareModal'
import ShareView from './pages/ShareView'
import { createShare } from './lib/shareUtils'

let _id = 1
const createModule = () => ({
  id: `m-${_id++}`,
  title: '',
  charA: { name: '', text: '', imageBlobUrl: null, music: { rawUrl: '', iframeSrc: '', audioUrl: '', coverUrl: '', customTitle: '', customArtist: '', mode: 'iframe', customData: { songName: '', artist: '', coverImageBlob: null, audioBlob: null } } },
  charB: { name: '', text: '', imageBlobUrl: null, music: { rawUrl: '', iframeSrc: '', audioUrl: '', coverUrl: '', customTitle: '', customArtist: '', mode: 'iframe', customData: { songName: '', artist: '', coverImageBlob: null, audioBlob: null } } },
})

const PAGE_BG         = '#0e0e0f'
const CARD_GAP        = '10px'
const DESIGN_W        = 880
const MOBILE_DESIGN_W = 540
const MOBILE_BP       = 480

function getShareIdFromHash() {
  const m = window.location.hash.match(/^#\/share\/([0-9a-f-]{36})$/)
  return m ? m[1] : null
}

export default function App() {
  const shareId = getShareIdFromHash()
  if (shareId) return <ShareView shareId={shareId} />

  return <Editor />
}

function Editor() {
  const [pageTitle,    setPageTitle]    = useState('天啊这简直是产品')
  const [pageSubtitle, setPageSubtitle] = useState('')
  const [editingHeader, setEditingHeader] = useState(false)
  const [modules, setModules] = useState(() => [createModule()])
  const [scale,    setScale]    = useState(1)
  const [activeDesignW, setActiveDesignW] = useState(DESIGN_W)
  const [contentH, setContentH] = useState(0)
  const [sharing,  setSharing]  = useState(false)
  const [shareUrl, setShareUrl] = useState(null)
  const innerRef = useRef(null)

  const addModule = () => setModules((p) => [...p, createModule()])

  const updateModule = useCallback((id, updater) => {
    setModules((p) => p.map((m) => (m.id === id ? updater(m) : m)))
  }, [])

  const deleteModule = useCallback((id) => {
    setModules((p) => p.filter((m) => m.id !== id))
  }, [])

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth
      const dw = vw < MOBILE_BP ? MOBILE_DESIGN_W : DESIGN_W
      setActiveDesignW(dw)
      setScale(vw < dw ? vw / dw : 1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setContentH(e.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleShare = async () => {
    setSharing(true)
    try {
      const id = await createShare({ pageTitle, pageSubtitle, modules })
      const url = `${window.location.origin}${window.location.pathname}#/share/${id}`
      setShareUrl(url)
    } catch (e) {
      console.error(e)
      alert('生成分享失败：' + (e?.message || JSON.stringify(e)))
    } finally {
      setSharing(false)
    }
  }

  const isScaled = scale < 1

  return (
    <div style={{ background: PAGE_BG, minHeight: '100svh', overflowX: 'hidden' }}>
      {shareUrl && <ShareModal shareUrl={shareUrl} contentRef={innerRef} onClose={() => setShareUrl(null)} />}

      <div
        ref={innerRef}
        style={{
          width: isScaled ? activeDesignW : '100%',
          transformOrigin: 'top left',
          transform: isScaled ? `scale(${scale})` : 'none',
          marginBottom: isScaled && contentH ? `${-(contentH * (1 - scale))}px` : 0,
        }}
      >

        {/* ── Page header ───────────────────────────────────────────── */}
        <header
          style={{
            padding: '36px 20px 28px',
            background: PAGE_BG,
            position: 'relative',
            maxWidth: '880px',
            margin: '0 auto',
          }}
        >
          {editingHeader ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <input
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="歌单标题"
                style={{
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.2)',
                  outline: 'none', color: '#fff', fontSize: '26px',
                  fontWeight: '700', letterSpacing: '0.04em',
                  width: '100%', padding: '0 0 4px', textAlign: 'center',
                }}
              />
              <input
                value={pageSubtitle}
                onChange={(e) => setPageSubtitle(e.target.value)}
                placeholder="副标题（可选）"
                style={{
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  outline: 'none', color: 'rgba(255,255,255,0.45)',
                  fontSize: '11px', letterSpacing: '0.05em',
                  width: '100%', padding: '0 0 3px', textAlign: 'center',
                }}
              />
              <button
                onClick={() => setEditingHeader(false)}
                style={{
                  alignSelf: 'flex-end', fontSize: '10px', letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.35)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '4px 0',
                }}
              >
                完成
              </button>
            </div>
          ) : (
            <div onClick={() => setEditingHeader(true)} style={{ cursor: 'pointer', textAlign: 'center' }} title="点击编辑标题">
              <h1
                style={{
                  color: '#fff', fontSize: '26px', fontWeight: '700',
                  letterSpacing: '0.04em', lineHeight: '1.2', margin: 0,
                }}
              >
                {pageTitle}
              </h1>
              {pageSubtitle && (
                <p
                  style={{
                    color: 'rgba(255,255,255,0.38)', fontSize: '11px',
                    letterSpacing: '0.05em', marginTop: '8px', lineHeight: '1.6',
                  }}
                >
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}
        </header>

        {/* ── Module list ───────────────────────────────────────────── */}
        <main
          style={{
            maxWidth: '880px',
            margin: '0 auto',
            padding: '0 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: CARD_GAP,
          }}
        >
          {modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              onUpdate={(updater) => updateModule(mod.id, updater)}
              onDelete={() => deleteModule(mod.id)}
            />
          ))}

          {/* ── Add module + Share ── */}
          <div data-export-hide style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={addModule}
              style={{
                width: '100%', padding: '14px', fontSize: '11px',
                letterSpacing: '0.3em', color: 'rgba(255,255,255,0.55)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px dashed rgba(255,255,255,0.22)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              + 添加 CP 模块
            </button>

            <button
              onClick={handleShare}
              disabled={sharing}
              style={{
                alignSelf: 'center', padding: '10px 40px', fontSize: '11px',
                letterSpacing: '0.25em',
                color: sharing ? '#aaa' : '#1a1a1a',
                background: sharing ? '#e0deda' : '#f0efec',
                border: 'none', borderRadius: '6px',
                boxShadow: sharing ? 'none' : '0 2px 10px rgba(0,0,0,0.15)',
                cursor: sharing ? 'default' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit', fontWeight: 600,
              }}
            >
              {sharing ? '上传中…' : '生成分享'}
            </button>
          </div>
        </main>

      </div>
    </div>
  )
}
