type ScrollDocument = Pick<Document, "body" | "documentElement" | "defaultView">;

/** Locks the page behind a modal viewer and restores its prior styles and position. */
export function lockDocumentScroll(documentRef: ScrollDocument): () => void {
  const { body, documentElement, defaultView } = documentRef;
  const previousBodyOverflow = body.style.overflow;
  const previousRootOverflow = documentElement.style.overflow;
  const scrollX = defaultView?.scrollX ?? 0;
  const scrollY = defaultView?.scrollY ?? 0;
  let released = false;

  documentElement.style.overflow = "hidden";
  body.style.overflow = "hidden";

  return () => {
    if (released) return;
    released = true;
    documentElement.style.overflow = previousRootOverflow;
    body.style.overflow = previousBodyOverflow;
    defaultView?.scrollTo(scrollX, scrollY);
  };
}
