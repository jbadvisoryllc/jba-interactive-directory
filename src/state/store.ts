import type { Industry } from "@/data/business-types";

export type ViewMode = "map" | "list";
export type SortOption = "relevance" | "name-asc" | "name-desc" | "founded-newest" | "founded-oldest";

/**
 * Shared filter/selection state for the directory + map. A single store
 * instance is created once in main.ts and passed to every UI module, so
 * the map, filter panel, and directory read and write the same state
 * rather than duplicating it — map markers and directory results are
 * therefore guaranteed to reflect the same filtered set (brief section 5).
 *
 * Headquarters-based filtering is the default per the brief: selecting a
 * region or country filters businesses whose `headquarters.subregionCode`
 * / `headquarters.countryIso3` matches (see filters/businessFilters.ts).
 * `serviceCoverage` is preserved on the data model for future
 * functionality but is not yet exposed as a separate filter axis, to
 * avoid adding interface complexity this checkpoint didn't ask for.
 */
export interface FilterState {
  /** M49 subregion codes. Empty set = no region filter applied (all regions). */
  selectedRegions: Set<string>;
  /** ISO3 country codes. Empty set = no country filter applied. */
  selectedCountries: Set<string>;
  selectedIndustries: Set<Industry>;
  selectedServices: Set<string>;
  searchQuery: string;
  sort: SortOption;
  page: number;
  viewMode: ViewMode;
  selectedBusinessId: string | null;
  hoveredBusinessId: string | null;
  /** True while the mobile filter drawer is open. Ignored on desktop layouts. */
  filterDrawerOpen: boolean;
  /** True when the desktop filter panel has been collapsed to reclaim map/directory width. */
  filterPanelCollapsed: boolean;
  /** Mobile only: true when the pull-up directory sheet is expanded past its peek height. */
  mobileSheetExpanded: boolean;
}

export function createInitialState(): FilterState {
  return {
    selectedRegions: new Set(),
    selectedCountries: new Set(),
    selectedIndustries: new Set(),
    selectedServices: new Set(),
    searchQuery: "",
    sort: "relevance",
    page: 1,
    viewMode: "map",
    selectedBusinessId: null,
    hoveredBusinessId: null,
    filterDrawerOpen: false,
    filterPanelCollapsed: false,
    mobileSheetExpanded: false,
  };
}

export type Listener = (state: FilterState) => void;

export class Store {
  private state: FilterState;
  private listeners: Set<Listener> = new Set();

  constructor(initial: FilterState = createInitialState()) {
    this.state = initial;
  }

  getState(): FilterState {
    return this.state;
  }

  /** Shallow-merges `patch` into state and notifies subscribers. */
  setState(patch: Partial<FilterState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Resets every filter/search field but keeps viewMode and drawer/UI state untouched. */
  resetFilters(): void {
    this.setState({
      selectedRegions: new Set(),
      selectedCountries: new Set(),
      selectedIndustries: new Set(),
      selectedServices: new Set(),
      searchQuery: "",
      page: 1,
    });
  }
}
