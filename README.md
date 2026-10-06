# film-roll

A reusable React component that presents photographs as a scrollable 35mm contact sheet with a rendered film cartridge.

## Preview

### Desktop

![Desktop photo archive using FilmRoll with a Kodak Gold 200 cartridge](https://raw.githubusercontent.com/wlonestar/film-roll/main/docs/screenshots/desktop-kodak-gold.png)

### Cartridge options

<table>
  <tr>
    <th>Fuji Superia 400</th>
    <th>Light Notes</th>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/wlonestar/film-roll/main/docs/screenshots/desktop-fuji-superia.png" alt="FilmRoll with the Fuji Superia 400 cartridge" width="420" /></td>
    <td><img src="https://raw.githubusercontent.com/wlonestar/film-roll/main/docs/screenshots/desktop-light-notes.png" alt="FilmRoll with the Light Notes cartridge" width="420" /></td>
  </tr>
</table>

### Mobile

<p align="center">
  <img src="https://raw.githubusercontent.com/wlonestar/film-roll/main/docs/screenshots/mobile-375.png" alt="FilmRoll responsive layout at a 375-pixel viewport width" width="335" />
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

export function ContactSheet({
  openViewer,
}: {
  openViewer: (index: number, trigger: HTMLElement) => void;
}) {
  return (
    <FilmRoll
      frames={frames}
      cartridge="kodak-gold-200"
      ariaLabel="Browse the photo contact sheet"
      onFrameClick={openViewer}
    />
  );
}
```

`onFrameClick` is optional. Without it, frames are rendered as non-interactive images. Use `previewSrc` to show a smaller contact-sheet thumbnail while keeping `src` as the full-size image for the host viewer.

## API

- `frames: readonly FilmRollFrame[]`, each frame has `src`, `alt`, and optional `previewSrc`. A roll accepts up to `filmRollMaxFrames` (72) frames; split larger collections across multiple rolls.
- `cartridge?: FilmRollCartridgeId | FilmRollCartridge`, defaults to `light-notes`.
- `onFrameClick?: (index: number, trigger: HTMLElement) => void`.
- `ariaLabel?: string`, label for the horizontally scrollable strip.
- `className?: string`, appended to the root `.film-roll` element.
- `filmRollCartridges`, `filmRollGeometry`, `filmRollMaxFrames`, and the related types are exported for integration and custom shells.

Built-in cartridges: `light-notes`, `kodak-gold-200`, `kodak-portra-400`, `kodak-ektar-100`, `fuji-superia-400`, and `ilford-hp5-400`.

The branded shells are independent, stylized reconstructions—not official artwork or exact packaging replicas. Brand names and marks remain the property of their respective owners; no affiliation or endorsement is implied.

For custom shells, provide `{ src, geometry }`. The geometry must describe the same image crop and film slit as the rendered asset so the live strip lines up. See the exported `FilmRollGeometry` type for the required metrics.

## Styling and behavior

The package stylesheet is separate so applications can choose where to import it. The component uses plain CSS, works with Next.js and Vite, and does not depend on `next/image` or a runtime 3D engine. It supports touch scrolling, wheel scrolling, keyboard focus, and custom frame sizing through CSS variables such as `--filmroll-frame-min`, `--filmroll-frame-max`, and `--filmroll-gutter`. This is a bundler-targeted package; Vite SSR consumers should include `film-roll` in `ssr.noExternal` so Vite transforms its ESM and WebP imports.

## Publishing

GitHub Actions publishes only when a matching version tag (`v*`) is pushed. Before the first automated release, configure npm's Trusted Publishing for `film-roll`: provider `GitHub Actions`, user `wlonestar`, repository `film-roll`, workflow filename `publish.yml`, and permission for direct `npm publish`. Leave the environment unset to match the workflow.

For each release, update the version in `package.json` and `package-lock.json`, push the commit, then push the matching tag. For example, version `0.1.1` is released with tag `v0.1.1`. The workflow verifies the match, builds and checks the tarball, then publishes through OIDC; no long-lived `NPM_TOKEN` is needed.

## Development

From the repository root:

```sh
npm install
npm run build
npm pack --dry-run
```

The build emits ESM and TypeScript declarations to `dist/`, then copies the CSS and cartridge assets. The generated output is intentionally not committed.
