export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url)
  const q = searchParams.get('q')
  if (!q) return new Response(JSON.stringify({ error: 'missing q' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=8&country=CN`
  try {
    const r = await fetch(url)
    const data = await r.json()
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
