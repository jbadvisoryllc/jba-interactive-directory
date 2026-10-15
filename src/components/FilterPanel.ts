import { INDUSTRIES } from "@/data/business-types";
import type { Business } from "@/data/business-types";
import { allHeadquartersCountries, allServices, filterBusinesses } from "@/filters/businessFilters";
import type { FilterState } from "@/state/store";
import { Store } from "@/state/store";
import subregionsData from "@/data/geo/m49-subregions.json";
import { withFocusPreserved } from "@/components/domUtils";

const REGIONS_BY_CONTINENT = (() => {
  const continentName = new Map(subregionsData.continents.map((c) => [c.code, c.name]));
  const byContinent = new Map<string, { code: string; name: string }[]>();
  for (const s of subregionsData.subregions) {
    const name = continentName.get(s.continentCode) ?? "Other";
    if (!byContinent.has(name)) byContinent.set(name, []);
    byContinent.get(name)!.push({ code: s.code, name: s.name });
  }
  return byContinent;
})();

function regionCount(all: Business[], store: Store, regionCode: string): number {
  // Counts reflect every active filter EXCEPT the region axis itself, so
  // checking one region doesn't make the others' counts look wrong — a
  // standard faceted-search convention ("how many would this add").
  const state = store.getState();
  const without: FilterState = { ...state, selectedRegions: new Set() };
  return filterBusinesses(all, without).filter((b) => b.headquarters.subregionCode === regionCode).length;
}

function industryCount(all: Business[], store: Store, industry: string): number {
  const state = store.getState();
  const without: FilterState = { ...state, selectedIndustries: new Set() };
  return filterBusinesses(all, without).filter((b) => b.industry === industry).length;
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export interface FilterPanelOptions {
  businesses: Business[];
  store: Store;
}

/**
 * Renders the collapsible region/country/industry/service filter panel
 * and keeps it in sync with the store: every control reads from
 * `store.getState()` on each re-render and writes back through
 * `store.setState()`, so the map and directory (subscribed to the same
 * store) update automatically — see main.ts for the subscription wiring.
 */
export function renderFilterPanel(options: FilterPanelOptions): HTMLElement {
  const { businesses, store } = options;
  const countries = allHeadquartersCountries(businesses);
  const services = allServices(businesses);

  const panel = document.createElement("div");
  panel.className = "jba-filter-panel";

  // Tracked outside render() so re-rendering (triggered by any filter
  // change) doesn't reset which accordion sections the person has open.
  const openSections: Record<string, boolean> = {
    Regions: true,
    Countries: false,
    Industries: true,
    Services: false,
  };
  let serviceSearchQuery = "";

  function section(title: string): { details: HTMLDetailsElement; body: HTMLDivElement } {
    const details = document.createElement("details");
    details.className = "jba-filter-section";
    details.open = openSections[title] ?? false;
    details.addEventListener("toggle", () => {
      openSections[title] = details.open;
    });
    const summary = document.createElement("summary");
    summary.className = "jba-filter-section__summary";
    summary.textContent = title;
    details.appendChild(summary);
    const body = document.createElement("div");
    body.className = "jba-filter-section__body";
    details.appendChild(body);
    return { details, body };
  }

  function render(): void {
    withFocusPreserved(panel, () => renderBody());
  }

  function renderBody(): void {
    panel.innerHTML = "";
    const state = store.getState();

    // --- Header ---
    const header = document.createElement("div");
    header.className = "jba-filter-panel__header";
    const heading = document.createElement("h2");
    heading.className = "jba-filter-panel__title";
    heading.textContent = "Filters";
    header.appendChild(heading);

    const activeCount =
      state.selectedRegions.size + state.selectedCountries.size + state.selectedIndustries.size + state.selectedServices.size;

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "jba-filter-reset";
    resetBtn.textContent = activeCount > 0 ? `Reset (${activeCount})` : "Reset";
    resetBtn.disabled = activeCount === 0;
    resetBtn.addEventListener("click", () => store.resetFilters());
    header.appendChild(resetBtn);
    panel.appendChild(header);

    // --- Regions ---
    const regionSection = section("Regions");
    for (const [continent, regions] of REGIONS_BY_CONTINENT) {
      const group = document.createElement("div");
      group.className = "jba-filter-group";
      const groupLabel = document.createElement("div");
      groupLabel.className = "jba-filter-group__label";
      groupLabel.textContent = continent;
      group.appendChild(groupLabel);

      for (const region of regions) {
        const count = regionCount(businesses, store, region.code);
        const row = buildCheckboxRow({
          label: region.name,
          count,
          checked: state.selectedRegions.has(region.code),
          disabled: count === 0 && !state.selectedRegions.has(region.code),
          onToggle: () => {
            store.setState({ selectedRegions: toggleInSet(state.selectedRegions, region.code), page: 1 });
          },
        });
        group.appendChild(row);
      }
      regionSection.body.appendChild(group);
    }
    panel.appendChild(regionSection.details);

    // --- Countries ---
    const countrySection = section("Countries");
    for (const country of countries) {
      const count = filterBusinesses(businesses, { ...state, selectedCountries: new Set() }).filter(
        (b) => b.headquarters.countryIso3 === country.iso3
      ).length;
      const row = buildCheckboxRow({
        label: country.name,
        count,
        checked: state.selectedCountries.has(country.iso3),
        disabled: count === 0 && !state.selectedCountries.has(country.iso3),
        onToggle: () => {
          store.setState({ selectedCountries: toggleInSet(state.selectedCountries, country.iso3), page: 1 });
        },
      });
      countrySection.body.appendChild(row);
    }
    panel.appendChild(countrySection.details);

    // --- Industries ---
    const industrySection = section("Industries");
    for (const industry of INDUSTRIES) {
      const count = industryCount(businesses, store, industry);
      const row = buildCheckboxRow({
        label: industry,
        count,
        checked: state.selectedIndustries.has(industry),
        disabled: count === 0 && !state.selectedIndustries.has(industry),
        onToggle: () => {
          store.setState({ selectedIndustries: toggleInSet(state.selectedIndustries, industry), page: 1 });
        },
      });
      industrySection.body.appendChild(row);
    }
    panel.appendChild(industrySection.details);

    // --- Services ---
    const serviceSection = section("Services");
    const serviceSearch = document.createElement("input");
    serviceSearch.type = "search";
    serviceSearch.className = "jba-filter-service-search";
    serviceSearch.placeholder = "Find a service…";
    serviceSearch.value = serviceSearchQuery;
    serviceSearch.setAttribute("data-focus-id", "service-search");
    const serviceList = document.createElement("div");
    serviceList.className = "jba-filter-service-list";

    function renderServiceList(query: string): void {
      serviceList.innerHTML = "";
      const q = query.trim().toLowerCase();
      const visible = services.filter((s) => s.toLowerCase().includes(q));
      for (const svc of visible.slice(0, 60)) {
        const count = filterBusinesses(businesses, { ...state, selectedServices: new Set() }).filter((b) =>
          b.services.includes(svc)
        ).length;
        const row = buildCheckboxRow({
          label: svc,
          count,
          checked: state.selectedServices.has(svc),
          disabled: count === 0 && !state.selectedServices.has(svc),
          onToggle: () => {
            store.setState({ selectedServices: toggleInSet(state.selectedServices, svc), page: 1 });
          },
        });
        serviceList.appendChild(row);
      }
      if (visible.length === 0) {
        const empty = document.createElement("div");
        empty.className = "jba-filter-empty";
        empty.textContent = "No matching services.";
        serviceList.appendChild(empty);
      }
    }
    serviceSearch.addEventListener("input", () => {
      serviceSearchQuery = serviceSearch.value;
      renderServiceList(serviceSearch.value);
    });
    renderServiceList(serviceSearchQuery);
    serviceSection.body.appendChild(serviceSearch);
    serviceSection.body.appendChild(serviceList);
    panel.appendChild(serviceSection.details);
  }

  function buildCheckboxRow(opts: {
    label: string;
    count: number;
    checked: boolean;
    disabled: boolean;
    onToggle: () => void;
  }): HTMLLabelElement {
    const row = document.createElement("label");
    row.className = "jba-filter-row";
    if (opts.disabled) row.classList.add("is-disabled");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = opts.checked;
    checkbox.disabled = opts.disabled;
    checkbox.addEventListener("change", opts.onToggle);
    row.appendChild(checkbox);
    const label = document.createElement("span");
    label.className = "jba-filter-row__label";
    label.textContent = opts.label;
    row.appendChild(label);
    const count = document.createElement("span");
    count.className = "jba-filter-row__count";
    count.textContent = String(opts.count);
    row.appendChild(count);
    return row;
  }

  store.subscribe(render);
  render();

  return panel;
}
