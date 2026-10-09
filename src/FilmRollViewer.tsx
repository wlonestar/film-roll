"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import type { FilmRollFrame } from "./FilmRoll.js";
import { lockDocumentScroll } from "./document-scroll-lock.js";
import { getNextViewerIndex, getSafeViewerIndex } from "./viewer-state.js";
import {
  beginViewerGesture,
  resolveViewerGesture,
  updateViewerGesture,
  viewerDragOffset,
  type ViewerGesture,
} from "./viewer-gesture.js";

function getExifValues(frame: FilmRollFrame) {
  const exif = frame.exif;
  if (!exif) return null;
  const hasValue = Object.values(exif).some((value) =>
    value !== null && value !== undefined && (typeof value !== "string" || value.trim() !== ""),
  );
  if (!hasValue) return null;

  return [
    { label: "Camera", value: exif.camera?.trim() || "–" },
    { label: "Focal length", value: exif.focalLength == null ? "–" : `${exif.focalLength} mm` },
    { label: "Exposure", value: exif.exposureTime ? `${exif.exposureTime} s` : "–" },
    { label: "Aperture", value: exif.aperture == null ? "–" : `f/${exif.aperture.toFixed(1)}` },
    { label: "ISO", value: exif.iso == null ? "–" : `ISO ${exif.iso}` },
  ];
}

function findTouch(list: TouchList, id: number): Touch | null {
  for (let index = 0; index < list.length; index += 1) {
    const touch = list[index];
    if (touch && touch.identifier === id) return touch;
  }
  return null;
}

export function FilmRollViewer({
  frames,
  initialIndex,
  onClose,
}: {
  frames: readonly FilmRollFrame[];
  initialIndex: number;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<ViewerGesture | null>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [enterDirection, setEnterDirection] = useState(0);
  const titleId = `film-roll-viewer-${useId()}`;
  const currentIndex = getSafeViewerIndex(activeIndex, frames.length);
  const activeFrame = currentIndex === null ? undefined : frames[currentIndex];
  const frameCount = frames.length;

  useEffect(() => {
    if (currentIndex !== null) setActiveIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const releaseScrollLock = lockDocumentScroll(document);
    closeButtonRef.current?.focus({ preventScroll: true });
    return () => {
      if (dialog.open) dialog.close();
      releaseScrollLock();
    };
  }, []);

  const moveFrame = (direction: number) => {
    if (frameCount < 2) return;
    setEnterDirection(direction);
    setActiveIndex((current) => getNextViewerIndex(current, direction, frameCount) ?? 0);
  };

  /* The gesture covers the whole stage, not just the photo: on a phone the frame
     fills a fraction of the viewport, so swiping the surrounding space has to work
     too. Native listeners are used because React registers `touchmove` as passive,
     which cannot `preventDefault()` the browser's own handling of the drag. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || frameCount < 2) return;

    const writeTrack = (offset: number, animate: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      track.style.transition = animate ? "transform 320ms cubic-bezier(.16, 1, .3, 1)" : "none";
      track.style.transform = offset === 0 && !animate ? "" : `translateX(${offset}px)`;
      track.style.willChange = animate ? "" : "transform";
    };

    const onTouchStart = (event: TouchEvent) => {
      // One finger, and not one already spent on a control such as the arrows or close.
      if (gestureRef.current || event.touches.length !== 1) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("button, a, input, select, textarea")) return;
      const touch = event.touches[0];
      if (!touch) return;
      gestureRef.current = beginViewerGesture(touch.identifier, touch.clientX, touch.clientY, event.timeStamp);
      writeTrack(0, false);
    };

    const onTouchMove = (event: TouchEvent) => {
      const gesture = gestureRef.current;
      if (!gesture) return;
      const touch = findTouch(event.touches, gesture.id) ?? findTouch(event.changedTouches, gesture.id);
      if (!touch) return;
      const moved = updateViewerGesture(gesture, touch.clientX, touch.clientY);
      gestureRef.current = moved;
      if (moved.axis !== "horizontal") return;
      // Claim the drag so the browser cannot turn it into a scroll and cancel the touch.
      if (event.cancelable) event.preventDefault();
      writeTrack(viewerDragOffset(moved.deltaX, stage.clientWidth * 0.5), false);
    };

    const onTouchEnd = (event: TouchEvent) => {
      const gesture = gestureRef.current;
      if (!gesture) return;
      const touch = findTouch(event.changedTouches, gesture.id);
      gestureRef.current = null;
      const released = touch
        ? updateViewerGesture(gesture, touch.clientX, touch.clientY)
        : gesture;
      writeTrack(0, true);
      const direction = resolveViewerGesture(released, event.timeStamp);
      if (direction !== 0) moveFrame(direction);
    };

    const onTouchCancel = () => {
      if (!gestureRef.current) return;
      gestureRef.current = null;
      writeTrack(0, true);
    };

    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    stage.addEventListener("touchend", onTouchEnd, { passive: true });
    stage.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      gestureRef.current = null;
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", onTouchEnd);
      stage.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [frameCount]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFrame(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFrame(1);
    }
  };

  if (currentIndex === null || !activeFrame) return null;
  const exifValues = getExifValues(activeFrame);
  const enterStyle = {
    "--filmroll-frame-enter-x": enterDirection > 0 ? "6%" : enterDirection < 0 ? "-6%" : "0px",
  } as CSSProperties;

  return (
    <dialog
      className="film-roll-viewer"
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <section className="film-roll-viewer__panel">
        <h2 id={titleId} className="film-roll-viewer__sr-only">Photo viewer</h2>
        <p className="film-roll-viewer__progress" aria-live="polite" aria-atomic="true">
          FRAME {String(currentIndex + 1).padStart(2, "0")} / {String(frames.length).padStart(2, "0")}
        </p>
        <button
          className="film-roll-viewer__close"
          type="button"
          ref={closeButtonRef}
          aria-label="Close photo viewer"
          onClick={onClose}
        >
          ×
        </button>

        <div className="film-roll-viewer__stage" ref={stageRef}>
          {frames.length > 1 && (
            <button
              className="film-roll-viewer__step film-roll-viewer__step--prev"
              type="button"
              aria-label="Previous photo"
              onClick={() => moveFrame(-1)}
            >
              ←
            </button>
          )}
          <div className="film-roll-viewer__track" ref={trackRef}>
            <figure className="film-roll-viewer__frame" key={currentIndex} style={enterStyle}>
              {exifValues && (
                <dl className="film-roll-viewer__printing" aria-label="Photo information">
                  {exifValues.map(({ label, value }) => (
                    <div key={label}>
                      <dt className="film-roll-viewer__sr-only">{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="film-roll-viewer__image">
                <img src={activeFrame.src} alt={activeFrame.alt} decoding="async" draggable={false} />
              </div>
            </figure>
          </div>
          {frames.length > 1 && (
            <button
              className="film-roll-viewer__step film-roll-viewer__step--next"
              type="button"
              aria-label="Next photo"
              onClick={() => moveFrame(1)}
            >
              →
            </button>
          )}
        </div>
      </section>
    </dialog>
  );
}
