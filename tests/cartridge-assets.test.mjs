import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const assets = new URL("../dist/assets/", import.meta.url);

const readAsset = (name) => readFile(new URL(name, assets));

test("keeps the legacy cartridge asset path pointing to Light Notes", async () => {
  const [legacy, lightNotes, blankShell] = await Promise.all([
    readAsset("film-cartridge.webp"),
    readAsset("light-notes.webp"),
    readAsset("film-cartridge-shell.webp"),
  ]);

  assert.deepEqual(legacy, lightNotes);
  assert.notDeepEqual(legacy, blankShell);
});

test("catalog variants and package assets stay in sync", async () => {
  const catalog = JSON.parse(await readFile(new URL("catalog.json", assets), "utf8"));
  const expected = [
    "light-notes",
    "kodak-ultramax-400",
    "kodak-gold-200",
    "kodak-ektar-100",
    "fuji-superia-400",
    "ilford-hp5-400",
    "kodak-portra-400",
  ];

  assert.deepEqual(catalog.cartridges.map(({ id }) => id), expected);
  for (const entry of catalog.cartridges) {
    const image = await readAsset(entry.filename);
    assert.equal(image.byteLength, entry.bytes, entry.id);
  }
});
