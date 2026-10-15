import "@/app.css";
import { renderNavRail } from "@/components/NavRail";
import { renderFilterPanel } from "@/components/FilterPanel";
import { renderDirectoryPanel } from "@/components/DirectoryPanel";
import { initMap } from "@/map/map";
import { businesses } from "@/data/businesses";
import { Store } from "@/state/store";
import type { FilterState } from "@/state/store";
import { appConfig } from "@/config/app.config";
import { filterBusinesses } from "@/filters/businessFilters";

const rootEl = document.getElementById("app");
if (!rootEl) {
  throw new Error("Root element #app not found");
}
const root: HTMLElement = rootEl;
root.innerHTML = "";

const store = new Store();

// --- Shell ---
const shell = document.createElement("div");
shell.className = "jba-shell";

const navRail = renderNavRail({
  activeId: "map",
  onSelect: (id) => {
    if (id === "map") {
      store.setState({ viewMode: "map" });
    } else if (id === "directory") {
      store.setState({ viewMode: "list" });
    }
  },
});
shell.appendChild(navRail);

const main = document.createElement("div");
main.className = "jba-main";
shell.appendChild(main);

// --- Filter panel (collapsible, shared across Map/List view) ---
const filterPanelWrap = document.createElement("div");
filterPanelWrap.className = "jba-filter-panel-wrap";

const collapseBtn = document.createElement("button");
collapseBtn.type = "button";
collapseBtn.className = "jba-filter-collapse-btn";
collapseBtn.setAttribute("aria-label", "Toggle filter panel");
collapseBtn.textContent = "‹";
collapseBtn.addEventListener("click", () => {
  const state = store.getState();
  if (state.filterDrawerOpen) {
    // Mobile: this same button closes the slide-in drawer.
    store.setState({ filterDrawerOpen: false });
  } else {
    store.setState({ filterPanelCollapsed: !state.filterPanelCollapsed });
  }
});
filterPanelWrap.appendChild(collapseBtn);

const filterPanel = renderFilterPanel({ businesses, store });
filterPanelWrap.appendChild(filterPanel);
main.appendChild(filterPanelWrap);

// --- Workspace: map (Map View) or nothing (List View takes full width) ---
const workspace = document.createElement("div");
workspace.className = "jba-workspace";

const mapContainer = document.createElement("div");
mapContainer.className = "jba-map-container";
workspace.appendChild(mapContainer);
main.appendChild(workspace);

// --- Directory panel (right rail in Map View, full width in List View; a
// pull-up sheet over the map on mobile — see .jba-directory-wrap media query) ---
const directoryWrap = document.createElement("div");
directoryWrap.className = "jba-directory-wrap";

const sheetHandle = document.createElement("button");
sheetHandle.type = "button";
sheetHandle.className = "jba-sheet-handle";
sheetHandle.setAttribute("aria-label", "Expand or collapse the business directory");
sheetHandle.innerHTML = '<span class="jba-sheet-handle__grip"></span>';
sheetHandle.addEventListener("click", () => {
  store.setState({ mobileSheetExpanded: !store.getState().mobileSheetExpanded });
});
directoryWrap.appendChild(sheetHandle);

const directoryPanel = renderDirectoryPanel({ businesses, store });
directoryWrap.appendChild(directoryPanel);
main.appendChild(directoryWrap);

root.appendChild(shell);

// --- Mobile bottom nav ---
const mobileNav = document.createElement("nav");
mobileNav.className = "jba-mobile-nav";
const mobileNavButtons: { id: string; label: string }[] = [
  { id: "map", label: "Map" },
  { id: "filters", label: "Filters" },
  { id: "directory", label: "Directory" },
];
for (const btn of mobileNavButtons) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "jba-mobile-nav__btn";
  b.dataset.id = btn.id;
  b.textContent = btn.label;
  b.addEventListener("click", () => {
    if (btn.id === "map") {
      store.setState({ viewMode: "map", filterDrawerOpen: false });
    } else if (btn.id === "directory") {
      store.setState({ viewMode: "list", filterDrawerOpen: false });
    } else if (btn.id === "filters") {
      store.setState({ filterDrawerOpen: !store.getState().filterDrawerOpen });
    }
  });
  mobileNav.appendChild(b);
}
root.appendChild(mobileNav);

const mobileScrim = document.createElement("div");
mobileScrim.className = "jba-mobile-scrim";
mobileScrim.addEventListener("click", () => store.setState({ filterDrawerOpen: false }));
root.appendChild(mobileScrim);

// --- Map init ---
const { tokenConfigured, ready } = initMap(mapContainer, {
  businesses,
  interactionCallbacks: {
    onSelect: (subregionCode) => {
      // Clicking a country on the map also applies it as a region filter,
      // keeping sidebar filters and map navigation in agreement.
      store.setState({ selectedRegions: new Set([subregionCode]), page: 1 });
    },
  },
  businessCallbacks: {
    onSelect: (businessId) => {
      store.setState({ selectedBusinessId: businessId });
    },
  },
});

if (!tokenConfigured) {
  const notice = document.createElement("div");
  notice.className = "jba-token-notice";
  notice.innerHTML =
    "<strong>No Mapbox token configured.</strong><br />Set <code>VITE_MAPBOX_TOKEN</code> in a <code>.env.local</code> file (local dev) or as a GitHub Actions repository variable (deployed build).";
  workspace.appendChild(notice);
}

let lastSelectedBusinessId: string | null = null;

ready.then(({ markers, regions }) => {
  function syncMapToFilters(state: FilterState): void {
    // Shared with the directory panel (filters/businessFilters.ts), so map
    // markers and directory results never disagree (brief section 5).
    const filtered = filterBusinesses(businesses, state);
    markers.setBusinesses(filtered);
    markers.setSelected(state.selectedBusinessId);
    regions.setFilterRegions(state.selectedRegions);

    if (state.selectedBusinessId && state.selectedBusinessId !== lastSelectedBusinessId) {
      const biz = businesses.find((b) => b.id === state.selectedBusinessId);
      if (biz) markers.flyToBusiness(biz);
    }
    lastSelectedBusinessId = state.selectedBusinessId;
  }

  store.subscribe(syncMapToFilters);
  syncMapToFilters(store.getState());
});

// --- Reflect viewMode / filterPanelCollapsed / mobile drawer state on the shell ---
function applyLayoutClasses(): void {
  const state = store.getState();
  main.classList.toggle("jba-main--list-view", state.viewMode === "list");
  main.classList.toggle("jba-main--map-view", state.viewMode === "map");

  const activeNavId = state.viewMode === "list" ? "directory" : "map";
  for (const btn of navRail.querySelectorAll<HTMLButtonElement>(".jba-nav-rail__item")) {
    const isActive = btn.dataset.id === activeNavId;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-current", isActive ? "page" : "false");
  }
  filterPanelWrap.classList.toggle("is-collapsed", state.filterPanelCollapsed);
  collapseBtn.textContent = state.filterPanelCollapsed ? "›" : "‹";
  root.classList.toggle("jba-filter-drawer-open", state.filterDrawerOpen);
  directoryWrap.classList.toggle("is-sheet-expanded", state.mobileSheetExpanded);
  sheetHandle.setAttribute("aria-expanded", String(state.mobileSheetExpanded));

  for (const el of mobileNav.querySelectorAll<HTMLButtonElement>(".jba-mobile-nav__btn")) {
    const isActive =
      (el.dataset.id === "map" && state.viewMode === "map" && !state.filterDrawerOpen) ||
      (el.dataset.id === "directory" && state.viewMode === "list" && !state.filterDrawerOpen) ||
      (el.dataset.id === "filters" && state.filterDrawerOpen);
    el.classList.toggle("is-active", isActive);
  }
}
store.subscribe(applyLayoutClasses);
applyLayoutClasses();

if (appConfig.dataDisclosure) {
  const disclosure = document.createElement("div");
  disclosure.className = "jba-data-disclosure";
  disclosure.textContent = appConfig.dataDisclosure;
  directoryWrap.appendChild(disclosure);
}
