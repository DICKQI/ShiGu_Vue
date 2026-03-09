export interface CropNumericState {
  [key: string]: number | undefined
}

export interface CropFilterState {
  brightness: number
  contrast: number
  saturation: number
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
    filterState: { ...snapshot.filterState },
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
