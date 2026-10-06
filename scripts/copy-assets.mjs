import { cpSync, copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(packageRoot, "dist");

mkdirSync(dist, { recursive: true });
cpSync(path.join(packageRoot, "src", "assets"), path.join(dist, "assets"), {
  recursive: true,
  force: true,
});
copyFileSync(path.join(packageRoot, "src", "film-roll.css"), path.join(dist, "film-roll.css"));
