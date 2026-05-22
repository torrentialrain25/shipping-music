import { supabase } from './supabase'

async function imageToBase64(blobUrl, maxPx = 700, quality = 0.78) {
  return new Promise(async (resolve) => {
    try {
      const res = await fetch(blobUrl)
      const blob = await res.blob()
      const img = new Image()
      const url = URL.createObjectURL(blob)
      img.onload = () => {
        URL.revokeObjectURL(url)
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          const r = Math.min(maxPx / width, maxPx / height)
          width = Math.round(width * r)
          height = Math.round(height * r)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
      img.src = url
    } catch {
      resolve(null)
    }
  })
}

async function convertBlobUrl(blobUrl, isImage = true) {
  if (!blobUrl || !blobUrl.startsWith('blob:')) return blobUrl
  if (isImage) return imageToBase64(blobUrl)
  // Audio: keep only if small enough (<= 3MB), otherwise drop
  try {
    const res = await fetch(blobUrl)
    const blob = await res.blob()
    if (blob.size > 3 * 1024 * 1024) return null
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function createShare({ pageTitle, pageSubtitle, modules }) {
  const processed = await Promise.all(modules.map(async (mod) => {
    const [aImg, bImg, aCover, bCover, aAudio, bAudio] = await Promise.all([
      convertBlobUrl(mod.charA.imageBlobUrl),
      convertBlobUrl(mod.charB.imageBlobUrl),
      convertBlobUrl(mod.charA.music?.customData?.coverImageBlob),
      convertBlobUrl(mod.charB.music?.customData?.coverImageBlob),
      convertBlobUrl(mod.charA.music?.customData?.audioBlob, false),
      convertBlobUrl(mod.charB.music?.customData?.audioBlob, false),
    ])

    return {
      ...mod,
      charA: {
        ...mod.charA,
        imageBlobUrl: aImg,
        music: mod.charA.music ? {
          ...mod.charA.music,
          customData: { ...mod.charA.music.customData, coverImageBlob: aCover, audioBlob: aAudio },
        } : mod.charA.music,
      },
      charB: {
        ...mod.charB,
        imageBlobUrl: bImg,
        music: mod.charB.music ? {
          ...mod.charB.music,
          customData: { ...mod.charB.music.customData, coverImageBlob: bCover, audioBlob: bAudio },
        } : mod.charB.music,
      },
    }
  }))

  const { data, error } = await supabase
    .from('shares')
    .insert({ page_title: pageTitle, page_subtitle: pageSubtitle, modules: processed })
    .select('id')
    .single()

  if (error) { console.error('[table insert error]', error); throw error }
  return data.id
}

export async function getShare(id) {
  const { data, error } = await supabase.from('shares').select('*').eq('id', id).single()
  if (error) throw error
  return data
}
