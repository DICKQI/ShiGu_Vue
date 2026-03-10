export interface CropNumericState {
  [key: string]: number | undefined
}

export type HslColorKey = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple'

export interface HslAdjustValues {
  h: number // -180 ~ 180
  s: number // -100 ~ 100 （相对百分比）
  l: number // -100 ~ 100 （相对百分比）
}

export type HslAdjustments = Record<HslColorKey, HslAdjustValues>

export interface CropFilterState {
  brightness: number
  contrast: number
  saturation: number
  hslAdjustments: HslAdjustments
}

export const createDefaultHslAdjustments = (): HslAdjustments => ({
  red: { h: 0, s: 0, l: 0 },
  orange: { h: 0, s: 0, l: 0 },
  yellow: { h: 0, s: 0, l: 0 },
  green: { h: 0, s: 0, l: 0 },
  cyan: { h: 0, s: 0, l: 0 },
  blue: { h: 0, s: 0, l: 0 },
  purple: { h: 0, s: 0, l: 0 },
})

const cloneFilterState = (state: CropFilterState): CropFilterState => {
  const next: CropFilterState = {
    brightness: state.brightness,
    contrast: state.contrast,
    saturation: state.saturation,
    hslAdjustments: createDefaultHslAdjustments(),
  }

  for (const key of Object.keys(state.hslAdjustments) as HslColorKey[]) {
    const src = state.hslAdjustments[key]
    next.hslAdjustments[key] = { h: src.h, s: src.s, l: src.l }
  }

  return next
}

export interface CropEditSnapshot {
  selectedAspectRatio: string
  filterState: CropFilterState
  enableRoundedRect: boolean
  roundedRadius: number
  enableMargin: boolean
  marginPercent: number
  cropData: CropNumericState | null
  cropBoxData: CropNumericState | null
  canvasData: CropNumericState | null
}

export interface CropHistoryState {
  past: CropEditSnapshot[]
  future: CropEditSnapshot[]
}

const ROUND_PRECISION = 1000

const roundNumber = (value: number) => {
  return Math.round(value * ROUND_PRECISION) / ROUND_PRECISION
}

const normalizeNumericState = (value: CropNumericState | null): CropNumericState | null => {
  if (!value) return null

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (typeof entry !== 'number' || Number.isNaN(entry)) {
        return [key, entry]
      }
      return [key, roundNumber(entry)]
    }),
  )
}

export const cloneCropSnapshot = (snapshot: CropEditSnapshot): CropEditSnapshot => {
  return {
    selectedAspectRatio: snapshot.selectedAspectRatio,
    filterState: cloneFilterState(snapshot.filterState),
    enableRoundedRect: snapshot.enableRoundedRect,
    roundedRadius: snapshot.roundedRadius,
    enableMargin: snapshot.enableMargin,
    marginPercent: snapshot.marginPercent,
    cropData: snapshot.cropData ? { ...snapshot.cropData } : null,
    cropBoxData: snapshot.cropBoxData ? { ...snapshot.cropBoxData } : null,
    canvasData: snapshot.canvasData ? { ...snapshot.canvasData } : null,
  }
}

export const normalizeCropSnapshot = (snapshot: CropEditSnapshot): CropEditSnapshot => {
  return {
    ...cloneCropSnapshot(snapshot),
    filterState: {
      ...cloneFilterState(snapshot.filterState),
      brightness: roundNumber(snapshot.filterState.brightness),
      contrast: roundNumber(snapshot.filterState.contrast),
      saturation: roundNumber(snapshot.filterState.saturation),
    },
    roundedRadius: roundNumber(snapshot.roundedRadius),
    marginPercent: roundNumber(snapshot.marginPercent),
    cropData: normalizeNumericState(snapshot.cropData),
    cropBoxData: normalizeNumericState(snapshot.cropBoxData),
    canvasData: normalizeNumericState(snapshot.canvasData),
  }
}

export const areCropSnapshotsEqual = (left: CropEditSnapshot | null, right: CropEditSnapshot | null) => {
  if (!left || !right) return left === right
  return JSON.stringify(normalizeCropSnapshot(left)) === JSON.stringify(normalizeCropSnapshot(right))
}

export const pushCropHistorySnapshot = (
  history: CropHistoryState,
  snapshot: CropEditSnapshot,
): CropHistoryState => {
  const normalizedSnapshot = normalizeCropSnapshot(snapshot)
  const previous = history.past[history.past.length - 1] ?? null

  if (previous && areCropSnapshotsEqual(previous, normalizedSnapshot)) {
    return history
  }

  return {
    past: [...history.past, normalizedSnapshot],
    future: [],
  }
}

export const moveCropHistoryBackward = (history: CropHistoryState) => {
  if (history.past.length <= 1) {
    return {
      ...history,
      current: history.past[history.past.length - 1] ?? null,
    }
  }

  const current = history.past[history.past.length - 1]
  if (!current) {
    return {
      ...history,
      current: history.past[history.past.length - 1] ?? null,
    }
  }
  const nextPast = history.past.slice(0, -1)

  return {
    past: nextPast,
    future: [current, ...history.future],
    current: nextPast[nextPast.length - 1] ?? null,
  }
}

export const moveCropHistoryForward = (history: CropHistoryState) => {
  if (!history.future.length) {
    return {
      ...history,
      current: history.past[history.past.length - 1] ?? null,
    }
  }

  const [nextCurrent, ...remainingFuture] = history.future
  if (!nextCurrent) {
    return {
      ...history,
      current: history.past[history.past.length - 1] ?? null,
    }
  }

  return {
    past: [...history.past, nextCurrent],
    future: remainingFuture,
    current: nextCurrent,
  }
}
