export function getSafeViewerIndex(index: number, frameCount: number): number | null {
  if (frameCount <= 0) return null;
  return Math.min(Math.max(Math.trunc(index), 0), frameCount - 1);
}

export function reconcileViewerIndex(index: number | null, frameCount: number): number | null {
  return index === null ? null : getSafeViewerIndex(index, frameCount);
}

export function getNextViewerIndex(index: number, direction: number, frameCount: number): number | null {
  const currentIndex = getSafeViewerIndex(index, frameCount);
  if (currentIndex === null || frameCount < 2) return currentIndex;
  const nextIndex = (currentIndex + Math.trunc(direction)) % frameCount;
  return (nextIndex + frameCount) % frameCount;
}
