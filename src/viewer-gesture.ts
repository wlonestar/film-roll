export type ViewerSwipeAxis = "horizontal" | "vertical";

/** Direction returned by {@link resolveViewerGesture}: `-1` previous, `1` next, `0` no change. */
export type ViewerSwipeDirection = -1 | 0 | 1;

export type ViewerGestureConfig = {
  /** Travel in px before the gesture commits to an axis; smaller moves stay undecided. */
  axisLockDistance: number;
  /** Horizontal travel in px that always commits a frame change. */
  commitDistance: number;
  /** `|dx|` must reach `|dy| * axisBias` for the gesture to lock horizontal. */
  axisBias: number;
  /** Shortest horizontal travel in px that a quick flick may commit. */
  flickDistance: number;
  /** Longest gesture in ms that still counts as a flick. */
  flickDurationMs: number;
};

/**
 * Tuned for touch screens: the axis locks on the dominant direction so a slightly
 * diagonal swipe still counts, and a short quick flick commits without reaching
 * `commitDistance`. Nothing in the viewer scrolls vertically, so a permissive lock
 * cannot fight another gesture.
 */
export const defaultViewerGestureConfig: ViewerGestureConfig = {
  axisLockDistance: 8,
  commitDistance: 44,
  axisBias: 1,
  flickDistance: 16,
  flickDurationMs: 300,
};

export type ViewerGesture = {
  /** `TouchEvent.identifier` of the finger that owns this gesture. */
  id: number;
  startX: number;
  startY: number;
  /** `TouchEvent.timeStamp` of the `touchstart` that opened the gesture. */
  startTime: number;
  axis: ViewerSwipeAxis | null;
  deltaX: number;
  deltaY: number;
};

export function beginViewerGesture(id: number, x: number, y: number, time: number): ViewerGesture {
  return { id, startX: x, startY: y, startTime: time, axis: null, deltaX: 0, deltaY: 0 };
}

function lockAxis(deltaX: number, deltaY: number, config: ViewerGestureConfig): ViewerSwipeAxis | null {
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < config.axisLockDistance) return null;
  return Math.abs(deltaX) >= Math.abs(deltaY) * config.axisBias ? "horizontal" : "vertical";
}

/** Moves the gesture to a new point. The axis, once locked, never changes again. */
export function updateViewerGesture(
  gesture: ViewerGesture,
  x: number,
  y: number,
  config: ViewerGestureConfig = defaultViewerGestureConfig,
): ViewerGesture {
  const deltaX = x - gesture.startX;
  const deltaY = y - gesture.startY;
  return { ...gesture, deltaX, deltaY, axis: gesture.axis ?? lockAxis(deltaX, deltaY, config) };
}

/**
 * Rubber-banded follow distance for the dragged photo: 1:1 up to `limit`, then damped
 * so the frame can never be dragged fully off screen.
 */
export function viewerDragOffset(deltaX: number, limit: number): number {
  if (!Number.isFinite(deltaX) || !Number.isFinite(limit) || limit <= 0) return 0;
  const distance = Math.abs(deltaX);
  if (distance <= limit) return deltaX;
  return Math.sign(deltaX) * (limit + (distance - limit) * 0.25);
}

/** Decides the frame change for a released gesture, or `0` when it was not a swipe. */
export function resolveViewerGesture(
  gesture: ViewerGesture,
  endTime: number,
  config: ViewerGestureConfig = defaultViewerGestureConfig,
): ViewerSwipeDirection {
  if (gesture.axis !== "horizontal") return 0;
  const { deltaX } = gesture;
  if (Math.abs(deltaX) >= config.commitDistance) return deltaX < 0 ? 1 : -1;

  const elapsed = endTime - gesture.startTime;
  if (elapsed >= 0 && elapsed <= config.flickDurationMs && Math.abs(deltaX) >= config.flickDistance) {
    return deltaX < 0 ? 1 : -1;
  }
  return 0;
}
