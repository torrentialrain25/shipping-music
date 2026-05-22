export default async function handler(req, res) {
  const { q } = req.query
  if (!q) return res.status(400).json({ error: 'missing q' })

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=8&country=CN`
  try {
    const r = await fetch(url)
    const data = await r.json()
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.json(data)
  } catch (e) {
    return res.status(502).json({ error: e.message })
  }
}
