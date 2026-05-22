export default function MusicPlayer({ iframeSrc }) {
  if (!iframeSrc) return null

  return (
    <div className="w-full overflow-hidden">
      <iframe
        src={iframeSrc}
        frameBorder="0"
        allowTransparency="true"
        allow="encrypted-media"
        className="w-full block"
        style={{ height: iframeSrc.includes('type=0') ? '430px' : '86px' }}
        title="music player"
      />
    </div>
  )
}
