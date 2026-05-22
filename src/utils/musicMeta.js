/**
 * Fetch display metadata (title, artist, coverUrl) from music platforms.
 * All methods are best-effort; failures return empty strings.
 */

async function tryFetch(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function spotifyMeta(rawUrl) {
  // Spotify oEmbed supports CORS — no proxy needed
  const data = await tryFetch(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(rawUrl)}&format=json`
  )
  return {
    title:    data.title       || '',
    artist:   data.author_name || '',
    coverUrl: data.thumbnail_url || '',
  }
}

async function neteaseMeta(iframeSrc) {
  const songId = iframeSrc.match(/id=(\d+)/)?.[1]
  if (!songId) throw new Error('no song id')

  const api = `https://music.163.com/api/song/detail/?id=${songId}&ids=[${songId}]`
  const data = await tryFetch(`https://corsproxy.io/?${encodeURIComponent(api)}`)
  const song = data.songs?.[0]
  if (!song) throw new Error('no song data')

  return {
    title:    song.name || '',
    artist:   (song.artists || []).map(a => a.name).join(' / ') || '',
    coverUrl: song.album?.picUrl ? `${song.album.picUrl}?param=300y300` : '',
  }
}

async function bilibiliMeta(iframeSrc) {
  const bvid = iframeSrc.match(/bvid=([A-Za-z0-9]+)/)?.[1]
  if (!bvid) throw new Error('no bvid')
  const api = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
  const data = await tryFetch(`https://corsproxy.io/?${encodeURIComponent(api)}`)
  const v = data.data
  if (!v) throw new Error('no video data')
  return {
    title:    v.title       || '',
    artist:   v.owner?.name || '',
    coverUrl: v.pic         || '',
  }
}

export async function fetchMusicMeta(rawUrl, iframeSrc) {
  if (!iframeSrc) return { title: '', artist: '', coverUrl: '' }
  try {
    if (iframeSrc.includes('spotify'))   return await spotifyMeta(rawUrl)
    if (iframeSrc.includes('music.163')) return await neteaseMeta(iframeSrc)
    if (iframeSrc.includes('bilibili'))  return await bilibiliMeta(iframeSrc)
  } catch (e) {
    console.warn('[musicMeta]', e.message)
  }
  return { title: '', artist: '', coverUrl: '' }
}
