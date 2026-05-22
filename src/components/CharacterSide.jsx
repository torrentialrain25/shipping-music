import { useRef, useState } from 'react'
import { parseMusicUrl, platformLabel } from '../utils/musicParser'
import CropModal from './CropModal'
import { useIsMobile } from '../utils/useIsMobile'

const C = {
  text:        '#484848',
  name:        '#111',
  dim:         '#bbb',
  imageBg:     '#dddbd6',
  inputBorder: 'rgba(0,0,0,0.14)',
  error:       '#b83232',
}

const IMG_SIZE        = 130
const IMG_SIZE_MOBILE = 90
const DESC_H          = 88

async function searchItunes(query) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return (data.results || []).map(r => ({
    title:      r.trackName      || '',
    artist:     r.artistName     || '',
    cover:      (r.artworkUrl100 || '').replace('100x100bb', '300x300bb'),
    previewUrl: r.previewUrl     || '',
    storeUrl:   r.trackViewUrl   || '',
  }))
}

export default function CharacterSide({ char, side, isEditing, onChange }) {
  const fileRef        = useRef(null)
  const customCoverRef = useRef(null)
  const customAudioRef = useRef(null)
  const isRight = side === 'right'
  // Mirror layout: charA faces right (toward center), charB faces left (toward center)
  const align = isRight ? 'left' : 'right'

  const [draft,         setDraft]         = useState(char.music?.rawUrl || '')
  const [urlError,      setUrlError]      = useState(false)
  const [cropSrc,       setCropSrc]       = useState(null)
  const [searchQuery,   setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching,     setSearching]     = useState(false)
  const [searchError,   setSearchError]   = useState(false)

  const isMobile = useIsMobile(480)
  const music    = char.music || {}
  const mode     = music.mode || 'iframe'
  const src      = music.iframeSrc || ''
  const hasMusic = src || music.audioUrl || (mode === 'custom' && (music.customData?.songName || music.customData?.coverImageBlob))
  const pLabel   = platformLabel(src) || (music.audioUrl ? 'iTunes 预览' : '')

  // ── Character image upload ─────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0]; if (!file) return
    e.target.value = ''
    const tmp = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(tmp)
      if (Math.abs(img.width / img.height - 1) < 0.04) {
        applyBlobUrl(URL.createObjectURL(file))
      } else {
        const reader = new FileReader()
        reader.onload = (ev) => setCropSrc(ev.target.result)
        reader.readAsDataURL(file)
      }
    }
    img.src = tmp
  }

  const applyBlobUrl = (url) => {
    if (char.imageBlobUrl?.startsWith('blob:')) URL.revokeObjectURL(char.imageBlobUrl)
    onChange({ imageBlobUrl: url })
  }

  // ── Custom cover upload ────────────────────────────────────────────────
  const handleCustomCover = (e) => {
    const file = e.target.files[0]; if (!file) return
    e.target.value = ''
    onChange({ music: { ...music, customData: { ...music.customData, coverImageBlob: URL.createObjectURL(file) } } })
  }

  // ── Custom audio upload ────────────────────────────────────────────────
  const handleCustomAudio = (e) => {
    const file = e.target.files[0]; if (!file) return
    e.target.value = ''
    onChange({ music: { ...music, customData: { ...music.customData, audioBlob: URL.createObjectURL(file) } } })
  }

  // ── Mode switch ────────────────────────────────────────────────────────
  const setMode = (m) => onChange({ music: { ...music, mode: m } })

  // ── iTunes search ──────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true); setSearchResults([]); setSearchError(false)
    try {
      const results = await searchItunes(searchQuery)
      setSearchResults(results)
      if (results.length === 0) setSearchError(true)
    } catch (e) {
      console.warn('[iTunes search]', e)
      setSearchError(true)
    } finally {
      setSearching(false)
    }
  }

  const selectResult = (r) => {
    setSearchResults([]); setSearchQuery(''); setDraft(''); setUrlError(false)
    onChange({
      music: {
        ...music,
        rawUrl:       r.storeUrl,
        iframeSrc:    '',
        audioUrl:     r.previewUrl,
        coverUrl:     r.cover,
        customTitle:  r.title,
        customArtist: r.artist,
        customData:   { ...music.customData, songName: r.title, artist: r.artist },
      },
    })
  }

  // ── URL import ─────────────────────────────────────────────────────────
  const importMusic = () => {
    const iframeSrc = parseMusicUrl(draft)
    if (!iframeSrc && draft.trim()) { setUrlError(true); return }
    setUrlError(false)
    onChange({ music: { ...music, rawUrl: draft, iframeSrc, audioUrl: '', coverUrl: '' } })
  }

  const clearMusic = () => {
    setDraft(''); setSearchQuery(''); setSearchResults([])
    onChange({ music: { rawUrl: '', iframeSrc: '', audioUrl: '', coverUrl: '', customTitle: '', customArtist: '', mode: 'iframe', customData: { songName: '', artist: '', coverImageBlob: null, audioBlob: null } } })
  }

  // ── Shared input style ─────────────────────────────────────────────────
  const inputStyle = (err) => ({
    flex: 1, minWidth: 0, background: 'transparent', border: 'none',
    borderBottom: `1px solid ${err ? C.error : C.inputBorder}`,
    outline: 'none', fontSize: '10px', color: C.text,
    padding: '2px 0 3px', fontFamily: 'inherit',
  })

  const btnStyle = {
    flexShrink: 0, background: 'none', border: `1px solid ${C.inputBorder}`,
    color: C.dim, fontSize: '10px', padding: '2px 8px', cursor: 'pointer', letterSpacing: '0.1em',
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onConfirm={(url) => { applyBlobUrl(url); setCropSrc(null) }}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, ...(isMobile && !isEditing && { justifyContent: 'flex-end' }) }}>

        {/* Description — fixed height spacer on desktop; collapses on mobile */}
        {isEditing ? (
          <div style={{ marginBottom: '8px' }}>
            <textarea
              value={char.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="角色描述…"
              maxLength={50}
              style={{
                width: '100%', height: DESC_H, background: 'transparent', border: 'none',
                borderBottom: `1px solid ${C.inputBorder}`, outline: 'none',
                resize: 'none', overflowY: 'hidden', fontSize: isMobile ? '8px' : '13px', lineHeight: 1.7,
                color: C.text, textAlign: align, paddingBottom: '4px', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '9px', color: C.dim, textAlign: 'right', marginTop: '2px' }}>
              {char.text.length}/50
            </div>
          </div>
        ) : isMobile ? (
          char.text ? (
            <div style={{ overflow: 'hidden', marginBottom: '4px' }}>
              <p style={{ fontSize: '8px', lineHeight: 1.7, letterSpacing: '0.08em', color: C.text, textAlign: align, whiteSpace: 'pre-wrap', margin: 0 }}>
                {char.text}
              </p>
            </div>
          ) : null
        ) : (
          <div style={{ height: DESC_H, overflow: 'hidden', marginBottom: 'auto' }}>
            {char.text && (
              <p style={{ fontSize: isMobile ? '8px' : '13px', lineHeight: 1.7, letterSpacing: '0.08em', color: C.text, textAlign: align, whiteSpace: 'pre-wrap', margin: 0 }}>
                {char.text}
              </p>
            )}
          </div>
        )}

        {/* Name — above image */}
        {isEditing ? (
          <input
            value={char.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="角色名"
            style={{
              background: 'transparent', border: 'none',
              borderBottom: `1px solid ${C.inputBorder}`,
              outline: 'none', fontSize: isMobile ? '12px' : '16px', letterSpacing: '0.05em', fontWeight: 700,
              color: C.name, textAlign: align, paddingBottom: '3px',
              width: '100%', fontFamily: 'inherit', marginBottom: '6px',
            }}
          />
        ) : char.name ? (
          <span style={{ fontSize: isMobile ? '12px' : '16px', letterSpacing: '0.05em', fontWeight: 700, color: C.name, display: 'block', textAlign: align, marginBottom: '6px' }}>
            {char.name}
          </span>
        ) : null}

        {/* Character image — bottom aligns with music card */}
        <div
          onClick={() => isEditing && fileRef.current?.click()}
          style={{
            width: '100%', maxWidth: isMobile ? IMG_SIZE_MOBILE : IMG_SIZE, aspectRatio: '1 / 1',
            background: C.imageBg, overflow: 'hidden', position: 'relative', borderRadius: '10px',
            cursor: isEditing ? 'pointer' : 'default',
            alignSelf: isRight ? 'flex-start' : 'flex-end',
          }}
        >
          {char.imageBlobUrl ? (
            <img src={char.imageBlobUrl} alt={char.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
          ) : isEditing ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: C.dim }}>点击上传</span>
            </div>
          ) : null}

          {isEditing && char.imageBlobUrl && (
            <div
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
            >
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#fff' }}>更换图片</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
        </div>

        {/* ── Music edit panel ────────────────────────────────────────────── */}
        {isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>

            {/* Mode toggle */}
            <div style={{ display: 'flex', border: `1px solid ${C.inputBorder}`, borderRadius: '4px', overflow: 'hidden' }}>
              {['iframe', 'custom'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1, padding: '4px 0', fontSize: '10px', letterSpacing: '0.08em', cursor: 'pointer', border: 'none',
                    background: mode === m ? '#484848' : 'transparent',
                    color: mode === m ? '#fff' : C.dim,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {m === 'iframe' ? '外链解析' : '完全自定义'}
                </button>
              ))}
            </div>

            {/* ── iframe mode ─────────────────────────────────────────── */}
            {mode === 'iframe' && (
              <>
                {/* Search */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchResults([]); setSearchError(false) }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="搜索歌名…"
                    style={inputStyle(false)}
                  />
                  <button onClick={handleSearch} style={btnStyle}>
                    {searching ? '…' : '搜索'}
                  </button>
                </div>
                {searchError && (
                  <span style={{ fontSize: '9px', color: C.error }}>未找到结果，请换词或粘贴链接</span>
                )}

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div style={{ border: `1px solid ${C.inputBorder}`, borderRadius: '4px', maxHeight: '155px', overflowY: 'auto', background: '#fff', position: 'relative', zIndex: 10 }}>
                    {searchResults.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => selectResult(r)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 7px', cursor: 'pointer', borderBottom: i < searchResults.length - 1 ? `1px solid ${C.inputBorder}` : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f4f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {r.cover && <img src={r.cover} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '10px', fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                          <div style={{ fontSize: '9px', color: C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.artist}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ flex: 1, height: '1px', background: C.inputBorder }} />
                  <span style={{ fontSize: '9px', color: C.dim, flexShrink: 0 }}>或粘贴链接</span>
                  <div style={{ flex: 1, height: '1px', background: C.inputBorder }} />
                </div>

                {/* URL import */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    value={draft}
                    onChange={(e) => { setDraft(e.target.value); setUrlError(false) }}
                    onKeyDown={(e) => e.key === 'Enter' && importMusic()}
                    placeholder="网易云 · Spotify · Bilibili 链接…"
                    style={inputStyle(urlError)}
                  />
                  <button onClick={importMusic} style={btnStyle}>导入</button>
                </div>
                {urlError && <span style={{ fontSize: '10px', color: C.error }}>无法识别该链接</span>}
                <span style={{ fontSize: '9px', color: C.dim }}>如遇版权受限，建议使用 Bilibili 链接</span>

                {/* Selected indicator */}
                {hasMusic && !urlError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#777' }}>✓ {pLabel} 已导入</span>
                    <button onClick={clearMusic} style={{ fontSize: '10px', color: C.dim, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      移除
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── custom mode ─────────────────────────────────────────── */}
            {mode === 'custom' && (
              <>
                {/* Cover upload */}
                <div
                  onClick={() => customCoverRef.current?.click()}
                  style={{
                    width: '100%', height: 52, background: '#e5e3de', borderRadius: '6px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative',
                  }}
                >
                  {music.customData?.coverImageBlob ? (
                    <img src={music.customData.coverImageBlob} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: C.dim }}>+ 上传封面</span>
                  )}
                  {music.customData?.coverImageBlob && (
                    <div
                      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                    >
                      <span style={{ fontSize: '10px', color: '#fff' }}>更换封面</span>
                    </div>
                  )}
                </div>
                <input ref={customCoverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCustomCover} />

                {/* Audio upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ flex: 1, fontSize: '10px', color: music.customData?.audioBlob ? '#777' : C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {music.customData?.audioBlob ? '♪ 已上传音频' : '未上传音频（仅展示）'}
                  </span>
                  <button onClick={() => customAudioRef.current?.click()} style={btnStyle}>
                    {music.customData?.audioBlob ? '更换' : '上传音频'}
                  </button>
                  {music.customData?.audioBlob && (
                    <button
                      onClick={() => onChange({ music: { ...music, customData: { ...music.customData, audioBlob: null } } })}
                      style={{ fontSize: '10px', color: C.dim, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    >
                      移除
                    </button>
                  )}
                </div>
                <input ref={customAudioRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleCustomAudio} />

                <input
                  value={music.customData?.songName || ''}
                  onChange={(e) => onChange({ music: { ...music, customData: { ...music.customData, songName: e.target.value } } })}
                  placeholder="歌曲名称"
                  style={{ ...inputStyle(false), flex: 'none', width: '100%' }}
                />
                <input
                  value={music.customData?.artist || ''}
                  onChange={(e) => onChange({ music: { ...music, customData: { ...music.customData, artist: e.target.value } } })}
                  placeholder="歌手名称"
                  style={{ ...inputStyle(false), flex: 'none', width: '100%' }}
                />

                {hasMusic && (
                  <button onClick={clearMusic} style={{ alignSelf: 'flex-start', fontSize: '10px', color: C.dim, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    清除
                  </button>
                )}
              </>
            )}

          </div>
        )}

      </div>
    </>
  )
}
