# film-roll

A reusable React component that presents photographs as a scrollable 35mm contact sheet with a rendered film cartridge.

## Preview

[Live demo](https://film-roll.pages.dev)

### Desktop

![Desktop photo archive using FilmRoll with a redesigned Kodak Gold 200 cartridge](https://raw.githubusercontent.com/wlonestar/film-roll/main/docs/screenshots/desktop-kodak-gold.png)

### Photo viewer

![FilmRoll full-screen photo viewer with navigation controls and exposure details](https://raw.githubusercontent.com/wlonestar/film-roll/main/docs/screenshots/photo-viewer.png)

### Cartridge options

![Five 3D film canisters with labels individually reconstructed from photos of actual Kodak UltraMax 400, Gold 200, Ektar 100, Fujicolor Superia X-TRA 400, and Ilford HP5 Plus 400 cartridges](https://raw.githubusercontent.com/wlonestar/film-roll/main/docs/screenshots/cartridge-presets.jpg)

### Mobile

<p align="center">
  <img src="https://raw.githubusercontent.com/wlonestar/film-roll/main/docs/screenshots/mobile-375.png" alt="Mobile FilmRoll layout with the redesigned Kodak Gold 200 cartridge" width="335" />
</p>

These captures show the component inside an example photo archive. The surrounding site and sample photographs are not part of this package.

## Install

Install from npm:

```sh
npm install film-roll
```

React 18 or later and `@types/react` 18 or later are peer dependencies. Import the stylesheet once from your app entry point:

```tsx
import { FilmRoll } from "film-roll";
import "film-roll/styles.css";
```

This repository contains the distributable library. The example above shows how to integrate it into a host React application.

## Basic example

```tsx
import { FilmRoll } from "film-roll";
import "film-roll/styles.css";

const frames = [
  { src: "/photos/lake.jpg", alt: "A cabin beside a mountain lake" },
  { src: "/photos/coast.jpg", alt: "Low waves along the coast" },
];

export function ContactSheet() {
  return (
    <FilmRoll
      frames={frames}
      cartridge="kodak-gold-200"
      ariaLabel="Browse the photo contact sheet"
    />
  );
}
```

Clicking a frame opens the built-in full-screen viewer. It displays the original `src` at its natural aspect ratio, locks background scrolling until closed, supports keyboard and touch navigation, and shows optional exposure details. Use `previewSrc` for a smaller contact-sheet thumbnail while keeping `src` as the original.

To take over frame clicks with a host viewer, pass `onFrameClick`. When provided, it replaces the built-in viewer and receives the frame index and trigger button:

```tsx
<FilmRoll frames={frames} onFrameClick={(index, trigger) => openViewer(index, trigger)} />
```

## API

- `frames: readonly FilmRollFrame[]`, each frame has `src`, `alt`, optional `previewSrc`, and optional `exif` metadata (`camera`, `focalLength`, `exposureTime`, `aperture`, `iso`). A roll accepts up to `filmRollMaxFrames` (72) frames; split larger collections across multiple rolls.
- `cartridge?: FilmRollCartridgeId | FilmRollCartridge`, defaults to `light-notes`.
- `onFrameClick?: (index: number, trigger: HTMLElement) => void`, replaces the default viewer when supplied.
- `ariaLabel?: string`, label for the horizontally scrollable strip.
- `className?: string`, appended to the root `.film-roll` element.
- `filmRollCartridges`, `filmRollGeometry`, `filmRollMaxFrames`, and the related types are exported for integration and custom shells.

Current branded presets: `kodak-ultramax-400`, `kodak-gold-200`, `kodak-ektar-100`, `fuji-superia-400`, and `ilford-hp5-400`. `light-notes` remains the default example shell; `kodak-portra-400` remains available for compatibility but is not one of the five refreshed reference presets. The previously exported `film-roll/assets/film-cartridge.webp` path remains a Light Notes alias; the blank shell is available as `film-roll/assets/film-cartridge-shell.webp`.

The five branded labels are individually reconstructed from photographs of actual 135 cartridges, not retail-box artwork. They are unofficial interpretations of the pictured editions, not licensed artwork or exact packaging replicas. Brand names and marks remain the property of their respective owners; no affiliation or endorsement is implied.

For custom shells, provide `{ src, geometry }`. The geometry must describe the same image crop and film slit as the rendered asset so the live strip lines up. See the exported `FilmRollGeometry` type for the required metrics.
