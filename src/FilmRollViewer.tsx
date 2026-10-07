"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import type { FilmRollFrame } from "./FilmRoll.js";
import { getNextViewerIndex, getSafeViewerIndex } from "./viewer-state.js";

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
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const titleId = `film-roll-viewer-${useId()}`;
  const currentIndex = getSafeViewerIndex(activeIndex, frames.length);
  const activeFrame = currentIndex === null ? undefined : frames[currentIndex];

  useEffect(() => {
    if (currentIndex !== null) setActiveIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    closeButtonRef.current?.focus({ preventScroll: true });
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  const moveFrame = (direction: number) => {
    if (frames.length < 2) return;
    setActiveIndex((current) => getNextViewerIndex(current, direction, frames.length) ?? 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFrame(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFrame(1);
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    const end = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !end) return;

    const deltaX = end.clientX - start.x;
    const deltaY = end.clientY - start.y;
    if (Math.abs(deltaX) > 46 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
      moveFrame(deltaX < 0 ? 1 : -1);
    }
  };

  if (currentIndex === null || !activeFrame) return null;
  const exifValues = getExifValues(activeFrame);

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

        <div className="film-roll-viewer__stage">
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
          <figure
            className="film-roll-viewer__frame"
            key={currentIndex}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => { touchStartRef.current = null; }}
          >
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
