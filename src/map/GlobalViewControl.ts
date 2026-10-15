import type mapboxgl from "mapbox-gl";
import { flyToGlobalView } from "@/map/camera";

const GLOBE_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>';

/**
 * A Mapbox GL IControl that resets the camera to the global view and
 * clears any region selection. Rendered in the same corner as
 * NavigationControl (top-right) so zoom and "return to global view" sit
 * together, per the brief's "controls for zooming and returning to the
 * global view."
 */
export class GlobalViewControl implements mapboxgl.IControl {
  private container: HTMLDivElement | null = null;
  private map: mapboxgl.Map | null = null;
  private onReset: () => void;

  constructor(onReset: () => void) {
    this.onReset = onReset;
  }

  onAdd(map: mapboxgl.Map): HTMLElement {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "mapboxgl-ctrl mapboxgl-ctrl-group jba-global-view-ctrl";

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "Return to global view");
    button.title = "Return to global view";
    button.innerHTML = GLOBE_ICON;
    button.addEventListener("click", () => {
      this.onReset();
      if (this.map) flyToGlobalView(this.map);
    });

    this.container.appendChild(button);
    return this.container;
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container);
    this.map = null;
  }
}
