import { supabase } from './supabase'

const BUCKET = 'recipe-photos'
const FULL_SIDE = 1080
const SMALL_SIDE = 480

export type PreparedPhoto = { full: Blob; small: Blob; preview: string }

const smallPath = (path: string) => path.replace(/\.jpg$/, '-small.jpg')

export function photoUrl(path: string, size: 'full' | 'small') {
  return supabase.storage.from(BUCKET).getPublicUrl(size === 'small' ? smallPath(path) : path).data.publicUrl
}

async function resized(file: File, maxSide: number) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * scale)
    canvas.height = Math.round(image.naturalHeight * scale)
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode photo'))), 'image/jpeg', 0.75),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const [full, small] = await Promise.all([resized(file, FULL_SIDE), resized(file, SMALL_SIDE)])
  return { full, small, preview: URL.createObjectURL(small) }
}

export async function uploadPhoto(photo: PreparedPhoto) {
  const path = `${crypto.randomUUID()}.jpg`
  // Files are never overwritten (every upload gets a new name), so browsers may keep them for a year.
  const options = { contentType: 'image/jpeg', cacheControl: '31536000' }
  const bucket = supabase.storage.from(BUCKET)
  const results = await Promise.all([bucket.upload(path, photo.full, options), bucket.upload(smallPath(path), photo.small, options)])
  const failed = results.find((result) => result.error)
  if (failed) throw failed.error
  return path
}

export async function removePhoto(path: string) {
  await supabase.storage.from(BUCKET).remove([path, smallPath(path)])
}
