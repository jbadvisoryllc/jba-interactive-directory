import "@/app.css";
import { renderNavRail } from "@/components/NavRail";
import { initMap } from "@/map/map";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Root element #app not found");
}
root.innerHTML = "";

const shell = document.createElement("div");
shell.className = "jba-shell";

const navRail = renderNavRail({
  activeId: "map",
  onSelect: (id) => {
    // Checkpoint 2: wire to view switching. For now this is a visual-only
    // smoke test, so just reflect the active state.
    console.log(`[nav] selected: ${id}`);
  },
});
shell.appendChild(navRail);

const workspace = document.createElement("div");
workspace.className = "jba-workspace";

const mapContainer = document.createElement("div");
mapContainer.className = "jba-map-container";
workspace.appendChild(mapContainer);
shell.appendChild(workspace);

root.appendChild(shell);

const { tokenConfigured } = initMap(mapContainer);

if (!tokenConfigured) {
  const notice = document.createElement("div");
  notice.className = "jba-token-notice";
  notice.innerHTML =
    "<strong>No Mapbox token configured.</strong><br />Set <code>VITE_MAPBOX_TOKEN</code> in a <code>.env.local</code> file (local dev) or as a GitHub Actions repository variable (deployed build).";
  workspace.appendChild(notice);
}
