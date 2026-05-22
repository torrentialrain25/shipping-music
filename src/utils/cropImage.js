function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = src
  })
}

/**
 * Crop an image using canvas.
 * @param {string} src - data URL or object URL
 * @param {{ x, y, width, height }} area - pixel area from react-easy-crop
 * @returns {Promise<Blob>}
 */
export async function getCroppedImg(src, area) {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width  = area.width
  canvas.height = area.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92))
}
