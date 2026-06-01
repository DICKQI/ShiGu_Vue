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

const clampPerspectiveValue = (value: number) => {
  if (!Number.isFinite(value)) return 0
  return Math.max(-100, Math.min(100, value))
}

const getPerspectiveSegmentCount = (value: number) => {
  const absValue = Math.abs(value)
  if (!absValue) return 1
  return Math.max(8, Math.ceil((absValue / 100) * 48))
}

const expandTriangle = (
  points: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }],
  amount = 0.35,
) => {
  const cx = (points[0].x + points[1].x + points[2].x) / 3
  const cy = (points[0].y + points[1].y + points[2].y) / 3

  return points.map((point) => {
    const dx = point.x - cx
    const dy = point.y - cy
    const length = Math.sqrt(dx * dx + dy * dy)
    if (!length) return point

    return {
      x: point.x + (dx / length) * amount,
      y: point.y + (dy / length) * amount,
    }
  }) as typeof points
}

const drawTexturedTriangle = (
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  src1: { x: number; y: number },
  src2: { x: number; y: number },
  src3: { x: number; y: number },
  dst1: { x: number; y: number },
  dst2: { x: number; y: number },
  dst3: { x: number; y: number },
) => {
  const m = computeAffineFromTriangles(src1, src2, src3, dst1, dst2, dst3)
  const clipPoints = expandTriangle([dst1, dst2, dst3])
  const minX = Math.min(src1.x, src2.x, src3.x)
  const minY = Math.min(src1.y, src2.y, src3.y)
  const maxX = Math.max(src1.x, src2.x, src3.x)
  const maxY = Math.max(src1.y, src2.y, src3.y)
  const sx = Math.floor(minX)
  const sy = Math.floor(minY)
  const sw = Math.ceil(maxX) - sx
  const sh = Math.ceil(maxY) - sy

  if (sw <= 0 || sh <= 0) return

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(clipPoints[0].x, clipPoints[0].y)
  ctx.lineTo(clipPoints[1].x, clipPoints[1].y)
  ctx.lineTo(clipPoints[2].x, clipPoints[2].y)
  ctx.closePath()
  ctx.clip()
  ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f)
  ctx.drawImage(image, sx, sy, sw, sh, sx, sy, sw, sh)
  ctx.restore()
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
  const hVal = clampPerspectiveValue(transformState.perspectiveHorizontal ?? 0)
  const vVal = clampPerspectiveValue(transformState.perspectiveVertical ?? 0)
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
  const angleY = -(hVal / 100) * maxAngleRad
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

  const xSegments = getPerspectiveSegmentCount(hVal)
  const ySegments = getPerspectiveSegmentCount(vVal)
  const stepX = width / xSegments
  const stepY = height / ySegments

  for (let yIndex = 0; yIndex < ySegments; yIndex++) {
    const y0 = yIndex * stepY
    const y1 = yIndex === ySegments - 1 ? height : (yIndex + 1) * stepY
    if (y1 <= y0) continue

    for (let xIndex = 0; xIndex < xSegments; xIndex++) {
      const x0 = xIndex * stepX
      const x1 = xIndex === xSegments - 1 ? width : (xIndex + 1) * stepX
      if (x1 <= x0) continue

      const s00 = { x: x0, y: y0 }
      const s10 = { x: x1, y: y0 }
      const s01 = { x: x0, y: y1 }
      const s11 = { x: x1, y: y1 }
      const p00 = projectPoint(x0, y0)
      const p10 = projectPoint(x1, y0)
      const p01 = projectPoint(x0, y1)
      const p11 = projectPoint(x1, y1)

      drawTexturedTriangle(ctx, bitmapOrImg as any, s00, s10, s11, p00, p10, p11)
      drawTexturedTriangle(ctx, bitmapOrImg as any, s00, s11, s01, p00, p11, p01)
    }
  }

  if (!rotDeg) {
    return await canvasToPngBlob(canvas, 'Failed to export perspective image')
  }

  const finalCanvas = drawRotatedToCanvas(canvas, canvasWidth, canvasHeight, rotDeg)
  return await canvasToPngBlob(finalCanvas, 'Failed to export transformed image')
}
