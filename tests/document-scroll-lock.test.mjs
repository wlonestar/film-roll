import test from "node:test";
import assert from "node:assert/strict";
import { lockDocumentScroll } from "../dist/document-scroll-lock.js";

function createDocument() {
  const documentElement = { style: { overflow: "scroll" } };
  const body = { style: { overflow: "auto" } };
  const scrollCalls = [];
  let scrollX = 12;
  let scrollY = 240;
  const defaultView = {
    get scrollX() { return scrollX; },
    get scrollY() { return scrollY; },
    scrollTo(x, y) {
      scrollCalls.push([x, y]);
      scrollX = x;
      scrollY = y;
    },
    setPosition(x, y) {
      scrollX = x;
      scrollY = y;
    },
  };

  return {
    documentRef: { documentElement, body, defaultView },
    documentElement,
    body,
    defaultView,
    scrollCalls,
  };
}

test("locks document scrolling and restores previous styles and scroll position", () => {
  const fixture = createDocument();
  const release = lockDocumentScroll(fixture.documentRef);

  assert.equal(fixture.documentElement.style.overflow, "hidden");
  assert.equal(fixture.body.style.overflow, "hidden");

  fixture.defaultView.setPosition(0, 0);
  release();

  assert.equal(fixture.documentElement.style.overflow, "scroll");
  assert.equal(fixture.body.style.overflow, "auto");
  assert.deepEqual(fixture.scrollCalls, [[12, 240]]);
  assert.equal(fixture.defaultView.scrollX, 12);
  assert.equal(fixture.defaultView.scrollY, 240);
});

test("restores existing inline overflow values and releases only once", () => {
  const fixture = createDocument();
  fixture.documentElement.style.overflow = "clip";
  fixture.body.style.overflow = "";
  const release = lockDocumentScroll(fixture.documentRef);

  release();
  release();

  assert.equal(fixture.documentElement.style.overflow, "clip");
  assert.equal(fixture.body.style.overflow, "");
  assert.deepEqual(fixture.scrollCalls, [[12, 240]]);
});
