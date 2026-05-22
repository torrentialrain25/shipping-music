import { useEffect, useState } from 'react'
import { getShare } from '../lib/shareUtils'
import ModuleCard from '../components/ModuleCard'

const PAGE_BG = '#0e0e0f'

export default function ShareView({ shareId }) {
  const [share, setShare]   = useState(null)
  const [error, setError]   = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getShare(shareId)
      .then(setShare)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [shareId])

  if (loading) return (
    <div style={{ background: PAGE_BG, minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '0.2em' }}>加载中…</span>
    </div>
  )

  if (error || !share) return (
    <div style={{ background: PAGE_BG, minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '0.2em' }}>链接已失效或不存在</span>
    </div>
  )

  return (
    <div style={{ background: PAGE_BG, minHeight: '100svh' }}>
      <header style={{ padding: '36px 20px 28px', maxWidth: '880px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.2, margin: 0 }}>
          {share.page_title || '代餐歌单'}
        </h1>
        {share.page_subtitle && (
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px', letterSpacing: '0.05em', marginTop: '8px', lineHeight: 1.6 }}>
            {share.page_subtitle}
          </p>
        )}
      </header>

      <main style={{ maxWidth: '880px', margin: '0 auto', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(share.modules || []).map((mod) => (
          <ModuleCard
            key={mod.id}
            module={mod}
            readOnly
            onUpdate={() => {}}
            onDelete={() => {}}
          />
        ))}
      </main>

      <footer style={{ textAlign: 'center', padding: '32px 20px', color: 'rgba(255,255,255,0.15)', fontSize: '10px', letterSpacing: '0.15em' }}>
        由 Shipping Music 生成
      </footer>
    </div>
  )
}
