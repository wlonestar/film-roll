"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FilmRollViewer } from "./FilmRollViewer.js";
import { reconcileViewerIndex } from "./viewer-state.js";
import {
  filmRollAssetUrl,
  filmRollCartridges,
  filmRollGeometry,
  filmRollMaxFrames,
  type FilmRollCartridge,
  type FilmRollCartridgeId,
} from "./cartridges.js";

export type FilmRollExif = {
  camera?: string | null;
  focalLength?: number | null;
  /** Exposure time in seconds, for example `"1/200"`. */
  exposureTime?: string | null;
  aperture?: number | null;
  iso?: number | null;
};

export type FilmRollFrame = {
  /** Full-size image opened by the built-in viewer or a custom `onFrameClick` handler. */
  src: string;
  /** Optional contact-strip thumbnail; `src` is kept for the opened original. */
  previewSrc?: string;
  /** Optional camera exposure details shown in the built-in viewer. */
  exif?: FilmRollExif;
  alt: string;
};

export type FilmRollProps = {
  frames: readonly FilmRollFrame[];
  /** A shipped shell id, or a custom { src, geometry } render. */
  cartridge?: FilmRollCartridgeId | FilmRollCartridge;
  /** Replaces the built-in photo viewer when provided. Receives the frame index and trigger. */
  onFrameClick?: (index: number, trigger: HTMLElement) => void;
  ariaLabel?: string;
  className?: string;
};

function SprocketRow({ className = "sprocket-row", count }: { className?: string; count: number }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }, (_, index) => <span key={index} />)}
    </div>
  );
}

function PerforationTrack() {
  return <div className="sprocket-row" aria-hidden="true" />;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function FilmRoll({ frames, cartridge = "light-notes", onFrameClick, ariaLabel, className }: FilmRollProps) {
  const shell = typeof cartridge === "string" ? filmRollCartridges[cartridge] : cartridge;
  const geometry = typeof cartridge === "string" ? filmRollGeometry : cartridge.geometry;
  if (frames.length > filmRollMaxFrames) {
    throw new RangeError(`FilmRoll supports at most ${filmRollMaxFrames} frames per roll.`);
  }
  const viewportRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (event: WheelEvent) => {
      const scrollLimit = viewport.scrollWidth - viewport.clientWidth;
      if (scrollLimit <= 0) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;
      const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? viewport.clientWidth
          : 1;
      const next = clamp(viewport.scrollLeft + delta * multiplier, 0, scrollLimit);
      if (next === viewport.scrollLeft) return;
      event.preventDefault();
      viewport.scrollLeft = next;
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [frames.length]);

  const shellStyle = {
    "--filmroll-aspect": geometry.width / geometry.height,
    "--filmroll-slot-height": geometry.slit.bottomY - geometry.slit.topY,
    "--filmroll-slot-center": geometry.slit.centerY,
    "--filmroll-slot-right": geometry.slit.rightX,
    "--filmroll-content-left": geometry.contentBounds.left,
    "--filmroll-slot-offset": geometry.slit.centerY - 0.5,
  } as CSSProperties;

  const frameEntries: Array<{ frame: FilmRollFrame; index: number }> = [];
  for (const key of Object.keys(frames)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= frames.length || String(index) !== key) continue;
    const frame = frames[index];
    if (frame) frameEntries.push({ frame, index });
  }

  const visibleFrames = frameEntries.map(({ frame }) => frame);

  useEffect(() => {
    const nextIndex = reconcileViewerIndex(viewerIndex, visibleFrames.length);
    if (nextIndex !== viewerIndex) {
      setViewerIndex(nextIndex);
      if (nextIndex === null) returnFocusRef.current = null;
    }
  }, [viewerIndex, visibleFrames.length]);

  const openViewer = (index: number, trigger: HTMLElement) => {
    returnFocusRef.current = trigger;
    setViewerIndex(index);
  };

  const closeViewer = () => {
    setViewerIndex(null);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus({ preventScroll: true }));
  };

  return (
    <div className="film-roll-container">
      <div className={`film-roll${className ? ` ${className}` : ""}`} style={shellStyle}>
        <div
          className="roll-window"
          ref={viewportRef}
          tabIndex={0}
          aria-label={ariaLabel?.trim() || "横向浏览胶卷画格"}
        >
          <div className="roll-film">
            <div className="film-leader" aria-hidden="true">
              <SprocketRow className="film-leader__holes film-leader__holes--top" count={4} />
              <SprocketRow className="film-leader__holes film-leader__holes--bottom" count={4} />
            </div>
            <div className="contact-strip">
              <PerforationTrack />
              <div className="contact-strip__frames">
                {frameEntries.map(({ frame, index }, position) => (
                  <button
                    className="photo-frame photo-frame--interactive"
                    type="button"
                    aria-label={frame.alt.trim() || `Open photo ${index + 1}`}
                    key={`${frame.src}-${index}`}
                    onClick={(event) => {
                      if (onFrameClick) onFrameClick(index, event.currentTarget);
                      else openViewer(position, event.currentTarget);
                    }}
                  >
                    <img src={frame.previewSrc ?? frame.src} alt={frame.alt} loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
              <PerforationTrack />
            </div>
          </div>
        </div>

        <div className="film-cartridge" aria-hidden="true">
          <img
            src={filmRollAssetUrl(shell.src)}
            alt=""
            width={geometry.width}
            height={geometry.height}
            draggable={false}
            decoding="async"
          />
        </div>
        {!onFrameClick && viewerIndex !== null && visibleFrames.length > 0 && (
          <FilmRollViewer frames={visibleFrames} initialIndex={viewerIndex} onClose={closeViewer} />
        )}
      </div>
    </div>
  );
}
