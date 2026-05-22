import { useState, useEffect, useRef } from 'react'
import { Play, Pause, ExternalLink, Music } from 'lucide-react'
import { getPlatform } from '../utils/musicParser'
import { fetchMusicMeta } from '../utils/musicMeta'

const ACCENT = '#8a8a8a'

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function Slider({ value, onChange, disabled }) {
  return (
    <div style={{ position: 'relative', height: '10px', display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', width: '100%', height: '2px', background: ACCENT, opacity: disabled ? 0.08 : 0.18, borderRadius: '1px' }} />
      {!disabled && <div style={{ position: 'absolute', height: '2px', background: ACCENT, borderRadius: '1px', width: `${value}%` }} />}
      <input
        type="range" min={0} max={100} step={0.2} value={value}
        onChange={e => !disabled && onChange(Number(e.target.value))}
        disabled={disabled}
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: disabled ? 'default' : 'pointer', margin: 0, zIndex: 5 }}
      />
    </div>
  )
}

function VerticalCard({ displayTitle, displayArtist, displayCover, hasAudio, canPlay, playing, progress, rawUrl, onToggle, onSeek }) {
  return (
    <div style={{
      background: '#fafaf8',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: '10px',
      overflow: 'hidden',
      width: '100%',
      boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
    }}>

      {/* Square cover */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#e2e0db' }}>
        {displayCover
          ? <img src={displayCover} alt={displayTitle} crossOrigin="anonymous"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music size={24} color={ACCENT} style={{ opacity: 0.28 }} />
            </div>
        }
        {rawUrl && (
          <a href={rawUrl} target="_blank" rel="noopener noreferrer"
            style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.30)', borderRadius: '3px', padding: '2px 4px', lineHeight: 0 }}>
            <ExternalLink size={9} color="#fff" style={{ opacity: 0.9 }} />
          </a>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{
          fontSize: '11px', fontWeight: 600, color: '#2e2e2e',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.3, marginBottom: '2px',
        }}>
          {displayTitle}
        </div>
        <div style={{
          fontSize: '10px', color: '#999',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.3, marginBottom: '7px',
        }}>
          {displayArtist}
        </div>

        <Slider value={progress} onChange={onSeek} disabled={!hasAudio || !canPlay} />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
          {hasAudio && !canPlay ? (
            <span style={{ fontSize: '9px', color: '#b55', lineHeight: '18px' }}>播放失败</span>
          ) : (
            <button onClick={hasAudio ? onToggle : undefined}
              style={{ background: 'none', border: 'none', cursor: hasAudio ? 'pointer' : 'default', color: ACCENT, opacity: hasAudio ? 1 : 0.2, padding: 0, display: 'flex' }}>
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MusicCard({
  rawUrl, iframeSrc, audioUrl, coverUrl, customTitle, customArtist,
  mode = 'iframe',
  customData,
}) {
  const platform = getPlatform(iframeSrc)

  const [meta,     setMeta]     = useState({ title: '', artist: '', coverUrl: '' })
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [canPlay,  setCanPlay]  = useState(true)
  const audioRef = useRef(null)

  useEffect(() => {
    if (audioUrl && coverUrl && customTitle) return
    if (!iframeSrc && !rawUrl) return
    fetchMusicMeta(rawUrl, iframeSrc).then(m => setMeta(m))
  }, [iframeSrc, rawUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const isCustom = mode === 'custom'

  const displayTitle  = isCustom ? (customData?.songName || '——') : (customTitle  || meta.title  || '——')
  const displayArtist = isCustom ? (customData?.artist   || '——') : (customArtist || meta.artist || '——')
  const displayCover  = isCustom ? (customData?.coverImageBlob || null) : (coverUrl || meta.coverUrl)

  const songId = iframeSrc?.match(/id=(\d+)/)?.[1]
  const effectiveAudioUrl = isCustom
    ? (customData?.audioBlob || null)
    : (audioUrl || (platform === 'netease' && songId
        ? `https://corsproxy.io/?url=${encodeURIComponent(`https://music.163.com/song/media/outer/url?id=${songId}.mp3`)}`
        : null))

  useEffect(() => {
    if (!effectiveAudioUrl) return
    const a = new Audio()
    a.src = effectiveAudioUrl
    audioRef.current = a
    setCanPlay(true); setPlaying(false); setProgress(0)

    const onTime = () => { if (a.duration) setProgress(a.currentTime / a.duration * 100) }
    const onEnd  = () => { setPlaying(false); setProgress(0) }
    const onErr  = () => setCanPlay(false)

    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended',      onEnd)
    a.addEventListener('error',      onErr)

    return () => {
      a.pause(); a.src = ''
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended',      onEnd)
      a.removeEventListener('error',      onErr)
    }
  }, [effectiveAudioUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = () => {
    const a = audioRef.current; if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play().then(() => setPlaying(true)).catch(() => setCanPlay(false)) }
  }

  const seek = (val) => {
    setProgress(val)
    if (audioRef.current?.duration) audioRef.current.currentTime = (val / 100) * audioRef.current.duration
  }

  // ── Vertical card (custom or direct audio) ──────────────────────────────
  if (isCustom || effectiveAudioUrl) {
    return (
      <VerticalCard
        displayTitle={displayTitle}
        displayArtist={displayArtist}
        displayCover={displayCover}
        hasAudio={!!effectiveAudioUrl}
        canPlay={canPlay}
        playing={playing}
        progress={progress}
        rawUrl={rawUrl}
        onToggle={togglePlay}
        onSeek={seek}
      />
    )
  }

  // ── Third-party iframe ───────────────────────────────────────────────────
  if (iframeSrc) {
    const iframeH = platform === 'bilibili' ? 148 : 80
    const exportCover = meta.coverUrl || coverUrl || null
    return (
      <div style={{ position: 'relative', height: iframeH, borderRadius: '10px', overflow: 'hidden' }}>
        {/* Static fallback: cover fills the card, title overlaid at bottom.
            A horizontal layout breaks at narrow widths (90px mobile), so we
            use a full-bleed cover with a gradient text bar instead. */}
        <div
          data-export-show="block"
          style={{
            display: 'none', position: 'absolute', inset: 0,
            background: '#e2e0db', overflow: 'hidden',
          }}
        >
          {exportCover && (
            <img src={exportCover} crossOrigin="anonymous" alt={displayTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 7px 5px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.68))',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              {displayTitle}
            </div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.72)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
              {displayArtist}
            </div>
          </div>
        </div>
        <iframe
          data-export-hide
          src={iframeSrc}
          frameBorder="0"
          allowTransparency="true"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          scrolling="no"
          style={{ width: '100%', height: '100%', display: 'block' }}
          title="music player"
        />
      </div>
    )
  }

  return null
}
