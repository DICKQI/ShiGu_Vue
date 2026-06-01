import { blobToImageBitmap } from './imageUtils'

export type Affine2DMatrix = {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

const computeAffineFromTriangles = (
  src1: { x: number; y: number },
  src2: { x: number; y: number },
  src3: { x: number; y: number },
  dst1: { x: number; y: number },
  dst2: { x: number; y: number },
  dst3: { x: number; y: number },
): Affine2DMatrix => {
  const x1 = src1.x
  const y1 = src1.y
  const x2 = src2.x
  const y2 = src2.y
  const x3 = src3.x
  const y3 = src3.y

  const X1 = dst1.x
  const Y1 = dst1.y
  const X2 = dst2.x
  const Y2 = dst2.y
  const X3 = dst3.x
  const Y3 = dst3.y

  const den = x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)
  if (!Number.isFinite(den) || Math.abs(den) < 1e-8) {
    return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
  }

  const a = (X1 * (y2 - y3) + X2 * (y3 - y1) + X3 * (y1 - y2)) / den
  const b = (Y1 * (y2 - y3) + Y2 * (y3 - y1) + Y3 * (y1 - y2)) / den
  const c = (X1 * (x3 - x2) + X2 * (x1 - x3) + X3 * (x2 - x1)) / den
  const d = (Y1 * (x3 - x2) + Y2 * (x1 - x3) + Y3 * (x2 - x1)) / den
  const e =
    (X1 * (x2 * y3 - x3 * y2) + X2 * (x3 * y1 - x1 * y3) + X3 * (x1 * y2 - x2 * y1)) / den
  const f =
    (Y1 * (x2 * y3 - x3 * y2) + Y2 * (x3 * y1 - x1 * y3) + Y3 * (x1 * y2 - x2 * y1)) / den

  return { a, b, c, d, e, f }
}

const normalizeRotation = (rotation: number) => {
  if (!Number.isFinite(rotation)) return 0
  let next = rotation % 360
  if (next > 180) next -= 360
  if (next <= -180) next += 360
  return Math.abs(next) < 1e-8 ? 0 : next
}

const getRotationTrig = (rotation: number) => {
  const rad = (normalizeRotation(rotation) * Math.PI) / 180
  const rawCos = Math.cos(rad)
  const rawSin = Math.sin(rad)
  return {
    rad,
    cos: Math.abs(rawCos) < 1e-10 ? 0 : rawCos,
    sin: Math.abs(rawSin) < 1e-10 ? 0 : rawSin,
  }
}

const getRotatedBounds = (width: number, height: number, rotation: number) => {
  const { cos, sin } = getRotationTrig(rotation)
  return {
    width: Math.max(1, Math.ceil(Math.abs(width * cos) + Math.abs(height * sin))),
    height: Math.max(1, Math.ceil(Math.abs(width * sin) + Math.abs(height * cos))),
  }
}

const canvasToPngBlob = async (canvas: HTMLCanvasElement, errorMessage: string): Promise<Blob> => {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(errorMessage))), 'image/png', 0.92)
  })
}

const drawRotatedToCanvas = (
  source: CanvasImageSource,
  width: number,
  height: number,
  rotation: number,
) => {
  const bounds = getRotatedBounds(width, height, rotation)
  const canvas = document.createElement('canvas')
  canvas.width = bounds.width
  canvas.height = bounds.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  ctx.clearRect(0, 0, bounds.width, bounds.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const { rad } = getRotationTrig(rotation)
  ctx.save()
  ctx.translate(bounds.width / 2, bounds.height / 2)
  if (rad !== 0) {
    ctx.rotate(rad)
  }
  ctx.drawImage(source, -width / 2, -height / 2, width, height)
  ctx.restore()

  return canvas
}

export const applyRotateToBlob = async (input: Blob, rotation: number): Promise<Blob> => {
  const bitmapOrImg = await blobToImageBitmap(input)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height
  const canvas = drawRotatedToCanvas(bitmapOrImg as any, width, height, rotation)
  return await canvasToPngBlob(canvas, 'Failed to export rotated image')
}

export interface TransformState {
  rotation: number
  perspectiveHorizontal: number
  perspectiveVertical: number
}

const isTransformIdentity = (state: TransformState) => {
  return !state.rotation && !state.perspectiveHorizontal && !state.perspectiveVertical
}

export const applyPerspectiveAndRotateToBlob = async (
  input: Blob,
  transformState: TransformState,
): Promise<Blob> => {
  const hVal = transformState.perspectiveHorizontal ?? 0
  const vVal = transformState.perspectiveVertical ?? 0
  const rotDeg = transformState.rotation ?? 0

  if (isTransformIdentity(transformState)) {
    return input
  }

  if (!hVal && !vVal) {
    return await applyRotateToBlob(input, rotDeg)
  }

  const bitmapOrImg = await blobToImageBitmap(input)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height

  const srcCx = width / 2
  const srcCy = height / 2
  const focal = Math.max(width, height) * 1.25
  const maxAngleRad = (Math.PI * 45) / 180
  const angleY = (hVal / 100) * maxAngleRad
  const angleX = (vVal / 100) * maxAngleRad

  const cosY = Math.cos(angleY)
  const sinY = Math.sin(angleY)
  const cosX = Math.cos(angleX)
  const sinX = Math.sin(angleX)

  const projectPointRelative = (x: number, y: number) => {
    const X = x - srcCx
    const Y = y - srcCy
    const Z = 0

    const X1 = X * cosY - Z * sinY
    const Z1 = X * sinY + Z * cosY

    const Y2 = Y * cosX + Z1 * sinX
    const Z2 = -Y * sinX + Z1 * cosX

    const denom = focal + Z2
    const safeDenom = Math.abs(denom) < 1e-4 ? (denom >= 0 ? 1e-4 : -1e-4) : denom
    const scale = focal / safeDenom

    return {
      x: X1 * scale,
      y: Y2 * scale,
    }
  }

  const corners = [
    projectPointRelative(0, 0),
    projectPointRelative(width, 0),
    projectPointRelative(width, height),
    projectPointRelative(0, height),
  ]
  const minX = Math.min(...corners.map((p) => p.x))
  const maxX = Math.max(...corners.map((p) => p.x))
  const minY = Math.min(...corners.map((p) => p.y))
  const maxY = Math.max(...corners.map((p) => p.y))
  const padding = 2
  const canvasWidth = Math.max(1, Math.ceil(maxX - minX + padding * 2))
  const canvasHeight = Math.max(1, Math.ceil(maxY - minY + padding * 2))
  const offsetX = -minX + padding
  const offsetY = -minY + padding

  const projectPoint = (x: number, y: number) => {
    const point = projectPointRelative(x, y)
    return {
      x: point.x + offsetX,
      y: point.y + offsetY,
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const stripCount = 64
  const stripW = width / stripCount

  for (let i = 0; i < stripCount; i++) {
    const x0 = i * stripW
    const x1 = (i + 1) * stripW
    const sw = x1 - x0
    if (sw <= 0) continue

    const p00 = projectPoint(x0, 0)
    const p10 = projectPoint(x1, 0)
    const p01 = projectPoint(x0, height)
    const p11 = projectPoint(x1, height)

    {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(p00.x, p00.y)
      ctx.lineTo(p10.x, p10.y)
      ctx.lineTo(p11.x, p11.y)
      ctx.closePath()
      ctx.clip()

      const m = computeAffineFromTriangles(
        { x: x0, y: 0 },
        { x: x1, y: 0 },
        { x: x1, y: height },
        { x: p00.x, y: p00.y },
        { x: p10.x, y: p10.y },
        { x: p11.x, y: p11.y },
      )

      ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f)
      ctx.drawImage(bitmapOrImg as any, x0, 0, sw, height, x0, 0, sw, height)
      ctx.restore()
    }

    {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(p00.x, p00.y)
      ctx.lineTo(p11.x, p11.y)
      ctx.lineTo(p01.x, p01.y)
      ctx.closePath()
      ctx.clip()

      const m = computeAffineFromTriangles(
        { x: x0, y: 0 },
        { x: x1, y: height },
        { x: x0, y: height },
        { x: p00.x, y: p00.y },
        { x: p11.x, y: p11.y },
        { x: p01.x, y: p01.y },
      )

      ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f)
      ctx.drawImage(bitmapOrImg as any, x0, 0, sw, height, x0, 0, sw, height)
      ctx.restore()
    }
  }

  if (!rotDeg) {
    return await canvasToPngBlob(canvas, 'Failed to export perspective image')
  }

  const finalCanvas = drawRotatedToCanvas(canvas, canvasWidth, canvasHeight, rotDeg)
  return await canvasToPngBlob(finalCanvas, 'Failed to export transformed image')
}
