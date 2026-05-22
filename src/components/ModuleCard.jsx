import { useState } from 'react'
import CharacterSide from './CharacterSide'
import MusicCard from './MusicCard'
import { useIsMobile } from '../utils/useIsMobile'

const LINE          = 'rgba(0,0,0,0.09)'
const TITLE         = '#1a1a1a'
const DIM           = '#bbb'
const MUSIC_W       = 160  // desktop music panel width
const MUSIC_W_MOBILE = 90  // mobile music panel width

function hasMusic(m) {
  if (!m) return false
  if (m.iframeSrc || m.audioUrl) return true
  if (m.mode === 'custom' && (m.customData?.songName || m.customData?.coverImageBlob || m.customData?.audioBlob)) return true
  return false
}

function MusicSlot({ music }) {
  if (!music) return null
  return (
    <MusicCard
      rawUrl={music.rawUrl}
      iframeSrc={music.iframeSrc}
      audioUrl={music.audioUrl}
      coverUrl={music.coverUrl}
      customTitle={music.customTitle}
      customArtist={music.customArtist}
      mode={music.mode || 'iframe'}
      customData={music.customData}
    />
  )
}

const DIVIDER_STYLE = { width: '1px', background: LINE, alignSelf: 'stretch', flexShrink: 0 }

export default function ModuleCard({ module, onUpdate, onDelete, readOnly = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const isMobile = useIsMobile(480)
  const musicW   = isMobile ? MUSIC_W_MOBILE : MUSIC_W

  const updateChar = (side, changes) =>
    onUpdate((m) => ({ ...m, [side]: { ...m[side], ...changes } }))

  const hasMusicA     = hasMusic(module.charA.music)
  const hasMusicB     = hasMusic(module.charB.music)
  const showMusicSlot = hasMusicA || hasMusicB

  return (
    <article style={{ background: '#f0efec', padding: '18px 18px 22px', position: 'relative', borderRadius: '8px', boxShadow: '0 2px 20px rgba(0,0,0,0.22)' }}>

      {/* Edit / Delete */}
      {!readOnly && (
        <div data-export-hide style={{ position: 'absolute', top: '10px', right: '14px', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsEditing((v) => !v)}
            style={{ fontSize: '10px', letterSpacing: '0.18em', color: isEditing ? '#555' : DIM, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {isEditing ? '完成' : '编辑'}
          </button>
          <button
            onClick={onDelete}
            style={{ fontSize: '10px', color: '#d0cec9', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            删除
          </button>
        </div>
      )}

      {/* Module title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', marginTop: '4px' }}>
        <div style={{ flex: 1, height: '1px', background: LINE }} />
        {isEditing ? (
          <input
            value={module.title}
            onChange={(e) => onUpdate((m) => ({ ...m, title: e.target.value }))}
            placeholder="CP名称"
            style={{
              background: 'transparent', border: 'none', borderBottom: `1px solid ${LINE}`,
              outline: 'none', textAlign: 'center', fontSize: '15px', letterSpacing: '0.2em',
              color: TITLE, minWidth: '60px', padding: '0 4px 2px', fontFamily: 'inherit', fontWeight: 700,
            }}
          />
        ) : (
          <span style={{ fontSize: '15px', letterSpacing: '0.2em', color: TITLE, whiteSpace: 'nowrap', fontWeight: 700 }}>
            {module.title || '——'}
          </span>
        )}
        <div style={{ flex: 1, height: '1px', background: LINE }} />
      </div>

      {/* ── [♪A] [CharA] | [CharB] [♪B] ──────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: '12px', minWidth: 0 }}>
          {showMusicSlot && (
            <div style={{ width: musicW, flexShrink: 0, alignSelf: 'flex-end' }}>
              {hasMusicA && <MusicSlot music={module.charA.music} />}
            </div>
          )}
          <CharacterSide
            char={module.charA}
            side="left"
            isEditing={isEditing}
            onChange={(c) => updateChar('charA', c)}
          />
        </div>

        <div style={{ ...DIVIDER_STYLE, margin: isMobile ? '0 8px' : '0 14px' }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: '12px', minWidth: 0 }}>
          <CharacterSide
            char={module.charB}
            side="right"
            isEditing={isEditing}
            onChange={(c) => updateChar('charB', c)}
          />
          {showMusicSlot && (
            <div style={{ width: musicW, flexShrink: 0, alignSelf: 'flex-end' }}>
              {hasMusicB && <MusicSlot music={module.charB.music} />}
            </div>
          )}
        </div>

      </div>

    </article>
  )
}
