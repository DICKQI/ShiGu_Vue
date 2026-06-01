import { blobToImageBitmap } from './imageUtils'

export interface CircleMaskOptions {
  outputSize?: number
}

export interface EllipseMaskOptions {
  outputWidth?: number
  outputHeight?: number
}

const normalizeSize = (value: number | undefined, fallback: number) => {
  const next = Number.isFinite(value) && value && value > 0 ? value : fallback
  return Math.max(1, Math.round(next))
}

const getCenteredSourceRect = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) => {
  const sw = Math.min(sourceWidth, targetWidth)
  const sh = Math.min(sourceHeight, targetHeight)

  return {
    sx: (sourceWidth - sw) / 2,
    sy: (sourceHeight - sh) / 2,
    sw,
    sh,
  }
}

export const applyCircleMaskToBlob = async (input: Blob, options: CircleMaskOptions = {}) => {
  const bitmapOrImg = await blobToImageBitmap(input)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height
  const size = normalizeSize(options.outputSize, Math.min(width, height))
  const sourceRect = getCenteredSourceRect(width, height, size, size)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    bitmapOrImg as any,
    sourceRect.sx,
    sourceRect.sy,
    sourceRect.sw,
    sourceRect.sh,
    0,
    0,
    size,
    size,
  )
  ctx.restore()

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出圆形图片失败'))), 'image/png', 0.92)
  })
  return outBlob
}

export const applyEllipseMaskToBlob = async (input: Blob, options: EllipseMaskOptions = {}) => {
  const bitmapOrImg = await blobToImageBitmap(input)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height

  const ellipseWidth = normalizeSize(options.outputWidth, width)
  const ellipseHeight = normalizeSize(options.outputHeight, height)
  const size = Math.max(ellipseWidth, ellipseHeight)
  const sourceRect = getCenteredSourceRect(width, height, ellipseWidth, ellipseHeight)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  ctx.clearRect(0, 0, size, size)

  const offsetX = (size - ellipseWidth) / 2
  const offsetY = (size - ellipseHeight) / 2

  ctx.save()
  ctx.beginPath()

  if (typeof ctx.ellipse === 'function') {
    ctx.ellipse(size / 2, size / 2, ellipseWidth / 2, ellipseHeight / 2, 0, 0, Math.PI * 2)
  } else {
    ctx.translate(size / 2, size / 2)
    ctx.scale(ellipseWidth / 2, ellipseHeight / 2)
    ctx.arc(0, 0, 1, 0, Math.PI * 2)
  }
  ctx.closePath()
  ctx.clip()

  if (typeof ctx.ellipse !== 'function') {
    ctx.restore()
    ctx.save()
  }

  ctx.drawImage(
    bitmapOrImg as any,
    sourceRect.sx,
    sourceRect.sy,
    sourceRect.sw,
    sourceRect.sh,
    offsetX,
    offsetY,
    ellipseWidth,
    ellipseHeight,
  )
  ctx.restore()

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出椭圆图片失败'))), 'image/png', 0.92)
  })
  return outBlob
}

export const applyRoundedRectMaskToBlob = async (input: File, radiusPercent: number): Promise<File> => {
  const bitmapOrImg = await blobToImageBitmap(input)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  ctx.clearRect(0, 0, width, height)

  const clampedPercent = Math.max(0, Math.min(radiusPercent, 50))
  const maxRadius = Math.min(width, height) / 2
  const radius = (clampedPercent / 100) * maxRadius

  const drawRoundedRect = (context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    const rr = Math.min(r, w / 2, h / 2)
    context.beginPath()
    context.moveTo(x + rr, y)
    context.lineTo(x + w - rr, y)
    context.arcTo(x + w, y, x + w, y + rr, rr)
    context.lineTo(x + w, y + h - rr)
    context.arcTo(x + w, y + h, x + w - rr, y + h, rr)
    context.lineTo(x + rr, y + h)
    context.arcTo(x, y + h, x, y + h - rr, rr)
    context.lineTo(x, y + rr)
    context.arcTo(x, y, x + rr, y, rr)
    context.closePath()
  }

  drawRoundedRect(ctx, 0, 0, width, height, radius)
  ctx.clip()
  ctx.drawImage(bitmapOrImg as any, 0, 0, width, height)

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出圆角矩形图片失败'))), 'image/png', 0.92)
  })

  return new File([outBlob], `main_photo_${Date.now()}.png`, { type: 'image/png' })
}

export const applyFreeCropSquareBlob = async (input: Blob) => {
  const bitmapOrImg = await blobToImageBitmap(input)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height

  const size = Math.max(width, height)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  const offsetX = (size - width) / 2
  const offsetY = (size - height) / 2
  ctx.drawImage(bitmapOrImg as any, offsetX, offsetY, width, height)

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出正方形图片失败'))), 'image/png', 0.92)
  })
  return outBlob
}

export const applyMarginToBlob = async (input: Blob, marginPercent: number) => {
  const bitmapOrImg = await blobToImageBitmap(input)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const clamped = Math.max(0, Math.min(marginPercent, 45))
  const m = clamped / 100
  const scale = Math.max(0.01, 1 - 2 * m)
  const drawW = width * scale
  const drawH = height * scale
  const dx = (width - drawW) / 2
  const dy = (height - drawH) / 2

  ctx.drawImage(bitmapOrImg as any, dx, dy, drawW, drawH)

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出边距图片失败'))), 'image/png', 0.92)
  })
  return outBlob
}
