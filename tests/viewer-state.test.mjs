import test from "node:test";
import assert from "node:assert/strict";
import { getNextViewerIndex, getSafeViewerIndex, reconcileViewerIndex } from "../dist/viewer-state.js";

test("clamps the active photo when the frame collection shrinks", () => {
  assert.equal(getSafeViewerIndex(4, 2), 1);
  assert.equal(reconcileViewerIndex(4, 2), 1);
  assert.equal(getSafeViewerIndex(1, 1), 0);
});

test("wraps navigation from the normalized active photo", () => {
  assert.equal(getNextViewerIndex(4, 1, 2), 0);
  assert.equal(getNextViewerIndex(4, -1, 2), 0);
  assert.equal(getNextViewerIndex(0, -1, 3), 2);
});

test("closes the viewer when frames become empty and keeps it closed when they return", () => {
  const closedIndex = reconcileViewerIndex(0, 0);
  assert.equal(closedIndex, null);
  assert.equal(reconcileViewerIndex(closedIndex, 2), null);
});

test("returns no active photo for an empty collection", () => {
  assert.equal(getSafeViewerIndex(0, 0), null);
  assert.equal(getNextViewerIndex(0, 1, 0), null);
});
