/**
 * Store-driven components rebuild their DOM wholesale on every state
 * change (innerHTML = "" + rebuild) rather than diffing, which is simple
 * and fast enough at this dataset's scale — but a search input re-render
 * on every keystroke would otherwise replace the <input> element itself
 * and drop focus after the very first character. Wrapping a render pass
 * in `withFocusPreserved` captures which element (by `data-focus-id`)
 * and cursor position had focus beforehand and restores both afterward.
 */
export function withFocusPreserved(container: HTMLElement, renderFn: () => void): void {
  const active = document.activeElement;
  let focusId: string | null = null;
  let selectionStart: number | null = null;
  let selectionEnd: number | null = null;

  if (active instanceof HTMLElement && container.contains(active)) {
    focusId = active.getAttribute("data-focus-id");
    if (active instanceof HTMLInputElement) {
      selectionStart = active.selectionStart;
      selectionEnd = active.selectionEnd;
    }
  }

  renderFn();

  if (focusId) {
    const restored = container.querySelector(`[data-focus-id="${focusId}"]`);
    if (restored instanceof HTMLElement) {
      restored.focus();
      if (restored instanceof HTMLInputElement && selectionStart !== null && selectionEnd !== null) {
        restored.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }
}
