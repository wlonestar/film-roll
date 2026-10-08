import geometry from "./assets/film-cartridge.geometry.json";
import ektarAsset from "./assets/kodak-ektar-100.webp";
import superiaAsset from "./assets/fuji-superia-400.webp";
import hp5Asset from "./assets/ilford-hp5-400.webp";
import goldAsset from "./assets/kodak-gold-200.webp";
import ultramaxAsset from "./assets/kodak-ultramax-400.webp";
import portraAsset from "./assets/kodak-portra-400.webp";
import lightNotesAsset from "./assets/light-notes.webp";

/** Max 72 half-frame exposures on one 135 film roll. */
export const filmRollMaxFrames = 72;

export type FilmRollGeometry = {
  modelRevision: string;
  renderFrame: { width: number; height: number };
  crop: number[];
  width: number;
  height: number;
  coordinateSystem: string;
  slit: {
    centerY: number;
    topY: number;
    bottomY: number;
    leftX: number;
    rightX: number;
    centerX: number;
  };
  contentBounds: { left: number; top: number; right: number; bottom: number };
  bodyCenter: number[];
  topCapCenter: number[];
  bottomCapCenter: number[];
  physicalDimensionsMm: {
    bodyDiameter: number;
    bodyHeight: number;
    totalHeight: number;
    slitHeight: number;
    spindleOuterDiameter: number;
    spindleInnerDiameter: number;
    spindleHeight: number;
    rimHeight: number;
  };
  cameraElevationDegrees: number;
  bytes: number;
};

/** Normalized slit/content metrics shared by every shipped shell. */
export const filmRollGeometry: FilmRollGeometry = geometry;

/** Bundlers differ: Next resolves image imports to { src }, Vite to a string. */
export function filmRollAssetUrl(asset: string | { src: string }): string {
  return typeof asset === "string" ? asset : asset.src;
}

export const filmRollCartridges = {
  "light-notes": { name: "Light Notes 135", src: filmRollAssetUrl(lightNotesAsset) },
  "kodak-gold-200": { name: "Kodak Gold 200", src: filmRollAssetUrl(goldAsset) },
  "kodak-ultramax-400": { name: "Kodak UltraMax 400", src: filmRollAssetUrl(ultramaxAsset) },
  /** Retained for compatibility; not one of the five current reference presets. */
  "kodak-portra-400": { name: "Kodak Portra 400", src: filmRollAssetUrl(portraAsset) },
  "kodak-ektar-100": { name: "Kodak Ektar 100", src: filmRollAssetUrl(ektarAsset) },
  "fuji-superia-400": { name: "Fujicolor Superia X-TRA 400", src: filmRollAssetUrl(superiaAsset) },
  "ilford-hp5-400": { name: "Ilford HP5 Plus 400", src: filmRollAssetUrl(hp5Asset) },
} as const;

export type FilmRollCartridgeId = keyof typeof filmRollCartridges;

/** A custom shell: any render that ships matching geometry metrics. */
export type FilmRollCartridge = {
  name?: string;
  src: string | { src: string };
  geometry: FilmRollGeometry;
};
