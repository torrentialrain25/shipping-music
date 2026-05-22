/**
 * Parse a share URL from NetEase, Spotify, or Bilibili into an embeddable iframe src.
 * Returns '' if the URL is not recognized.
 */
export function parseMusicUrl(url) {
  if (!url?.trim()) return ''
  const u = url.trim()

  // Already an embed src
  if (
    u.includes('outchain/player') ||
    u.includes('open.spotify.com/embed') ||
    u.includes('player.bilibili.com')
  ) return u

  // ── NetEase Cloud Music ─────────────────────────────────────────────────────
  // https://music.163.com/#/song?id=123456
  // https://music.163.com/song?id=123456
  // https://y.music.163.com/m/song/123456
  const neSong =
    u.match(/music\.163\.com[^?]*[#&?](?:.*\/)?song[?/](?:id=)?(\d+)/) ||
    u.match(/song\?id=(\d+)/) ||
    u.match(/\/song\/(\d+)/) ||
    (u.includes('music.163.com') && u.includes('song') && u.match(/[?&]id=(\d+)/))
  if (neSong) return `//music.163.com/outchain/player?type=2&id=${neSong[1]}&auto=0&height=66`

  const neList =
    u.match(/playlist\?id=(\d+)/) ||
    u.match(/\/playlist\/(\d+)/)
  if (neList) return `//music.163.com/outchain/player?type=0&id=${neList[1]}&auto=0&height=66`

  // ── Spotify ────────────────────────────────────────────────────────────────
  // https://open.spotify.com/track/4iJyoBOLtHqaWYs3vyWFe1
  // https://open.spotify.com/intl-zh-tw/track/4iJyoBOLtHqaWYs3vyWFe1
  const spotify = u.match(/spotify\.com(?:\/intl-[^/]+)?\/track\/([A-Za-z0-9]+)/)
  if (spotify) return `https://open.spotify.com/embed/track/${spotify[1]}?utm_source=generator&theme=0`

  // ── Bilibili ───────────────────────────────────────────────────────────────
  const bv = u.match(/bilibili\.com\/video\/(BV[A-Za-z0-9]+)/)
  if (bv) return `https://player.bilibili.com/player.html?bvid=${bv[1]}&page=1&high_quality=0&danmaku=0&autoplay=0`

  const av = u.match(/bilibili\.com\/video\/av(\d+)/i)
  if (av) return `https://player.bilibili.com/player.html?aid=${av[1]}&page=1&high_quality=0&danmaku=0&autoplay=0`

  return ''
}

/** Human-readable platform label */
export function platformLabel(src) {
  if (!src) return ''
  if (src.includes('music.163')) return '网易云'
  if (src.includes('spotify'))   return 'Spotify'
  if (src.includes('bilibili'))  return 'Bilibili'
  return ''
}

/** Platform key */
export function getPlatform(src) {
  if (!src) return null
  if (src.includes('music.163')) return 'netease'
  if (src.includes('spotify'))   return 'spotify'
  if (src.includes('bilibili'))  return 'bilibili'
  return null
}
