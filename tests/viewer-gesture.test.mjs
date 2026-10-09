import test from "node:test";
import assert from "node:assert/strict";
import {
  beginViewerGesture,
  defaultViewerGestureConfig,
  resolveViewerGesture,
  updateViewerGesture,
  viewerDragOffset,
} from "../dist/viewer-gesture.js";

const config = defaultViewerGestureConfig;

/** Walks a gesture through a list of points and returns its final state. */
function drag(points, start = { x: 200, y: 400, t: 1000 }) {
  let gesture = beginViewerGesture(0, start.x, start.y, start.t);
  for (const [x, y] of points) gesture = updateViewerGesture(gesture, x, y, config);
  return gesture;
}

function release(gesture, elapsedMs) {
  return resolveViewerGesture(gesture, gesture.startTime + elapsedMs, config);
}

test("a left swipe past the commit distance goes to the next photo", () => {
  const gesture = drag([[180, 400], [150, 402], [120, 398]]);
  assert.equal(gesture.axis, "horizontal");
  assert.equal(release(gesture, 260), 1);
});

test("a right swipe past the commit distance goes to the previous photo", () => {
  assert.equal(release(drag([[230, 400], [260, 401], [280, 399]]), 260), -1);
});

test("a short quick flick still commits", () => {
  assert.equal(release(drag([[180, 400], [172, 400]]), 120), 1);
});

test("the same short travel is ignored once it is no longer a flick", () => {
  assert.equal(release(drag([[180, 400], [172, 400]]), 900), 0);
});

test("travel below the flick distance never commits", () => {
  assert.equal(release(drag([[192, 400]]), 60), 0);
});

test("a vertical drag locks vertical and never changes the photo", () => {
  const gesture = drag([[200, 430], [198, 480], [202, 540]]);
  assert.equal(gesture.axis, "vertical");
  assert.equal(release(gesture, 400), 0);
});

test("a slightly diagonal swipe still counts as horizontal", () => {
  const gesture = drag([[170, 420], [140, 440], [120, 452]]);
  assert.equal(gesture.axis, "horizontal");
  assert.equal(release(gesture, 300), 1);
});

test("the axis stays locked once a gesture has committed to it", () => {
  const gesture = drag([[200, 440], [200, 600], [60, 620]]);
  assert.equal(gesture.axis, "vertical");
  assert.equal(release(gesture, 400), 0);
});

test("movement inside the lock distance leaves the axis undecided", () => {
  const gesture = drag([[204, 402]]);
  assert.equal(gesture.axis, null);
  assert.equal(release(gesture, 50), 0);
});

test("drag follow is one to one near the centre and damped towards the edge", () => {
  assert.equal(viewerDragOffset(-40, 200), -40);
  assert.equal(viewerDragOffset(200, 200), 200);
  assert.equal(viewerDragOffset(-320, 200), -230);
  assert.equal(viewerDragOffset(0, 200), 0);
});

test("drag follow stays put for a non-positive or non-finite limit", () => {
  assert.equal(viewerDragOffset(120, 0), 0);
  assert.equal(viewerDragOffset(Number.NaN, 200), 0);
});
