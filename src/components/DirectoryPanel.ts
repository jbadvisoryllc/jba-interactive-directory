import type { Business } from "@/data/business-types";
import { appConfig } from "@/config/app.config";
import { filterBusinesses, paginate, sortBusinesses } from "@/filters/businessFilters";
import type { SortOption } from "@/state/store";
import { Store } from "@/state/store";
import { withFocusPreserved } from "@/components/domUtils";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "founded-newest", label: "Founded (newest)" },
  { value: "founded-oldest", label: "Founded (oldest)" },
];

export interface DirectoryPanelOptions {
  businesses: Business[];
  store: Store;
}

/**
 * Right-side (or, in List View / mobile, full-width) business directory:
 * search, sort, result count, paginated cards with inline expand-to-detail,
 * and empty-result messaging. Reads/writes the same store as the map and
 * filter panel so search + filters always agree with what's on the map
 * (brief section 5: map and directory show the same filtered businesses).
 */
export function renderDirectoryPanel(options: DirectoryPanelOptions): HTMLElement {
  const { businesses, store } = options;

  const panel = document.createElement("div");
  panel.className = "jba-directory-panel";

  function render(): void {
    withFocusPreserved(panel, () => renderBody());
  }

  function renderBody(): void {
    panel.innerHTML = "";
    const state = store.getState();

    // --- Search + sort header ---
    const header = document.createElement("div");
    header.className = "jba-directory-panel__header";

    const searchWrap = document.createElement("div");
    searchWrap.className = "jba-directory-search";
    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = "Search company, city, country, industry, or service…";
    searchInput.value = state.searchQuery;
    searchInput.className = "jba-directory-search__input";
    searchInput.setAttribute("data-focus-id", "directory-search");
    searchInput.addEventListener("input", () => {
      store.setState({ searchQuery: searchInput.value, page: 1 });
    });
    searchWrap.appendChild(searchInput);
    header.appendChild(searchWrap);

    const controlsRow = document.createElement("div");
    controlsRow.className = "jba-directory-controls";

    const sortSelect = document.createElement("select");
    sortSelect.className = "jba-directory-sort";
    sortSelect.setAttribute("aria-label", "Sort businesses");
    for (const opt of SORT_OPTIONS) {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      option.selected = state.sort === opt.value;
      sortSelect.appendChild(option);
    }
    sortSelect.addEventListener("change", () => {
      store.setState({ sort: sortSelect.value as SortOption, page: 1 });
    });
    controlsRow.appendChild(sortSelect);
    header.appendChild(controlsRow);
    panel.appendChild(header);

    // --- Filter + sort + paginate ---
    const filtered = filterBusinesses(businesses, state);
    const sorted = sortBusinesses(filtered, state.sort);
    const pageResult = paginate(sorted, state.page, appConfig.directory.pageSize);

    const countLine = document.createElement("div");
    countLine.className = "jba-directory-count";
    countLine.textContent =
      pageResult.total === 0
        ? "No businesses match these filters"
        : `${pageResult.total} business${pageResult.total === 1 ? "" : "es"}`;
    panel.appendChild(countLine);

    // --- Empty state ---
    if (pageResult.total === 0) {
      const empty = document.createElement("div");
      empty.className = "jba-directory-empty";
      empty.innerHTML =
        "<p>No businesses match the current search and filters.</p>" +
        '<button type="button" class="jba-directory-empty__reset">Clear all filters</button>';
      empty.querySelector("button")?.addEventListener("click", () => store.resetFilters());
      panel.appendChild(empty);
      return;
    }

    // --- Cards ---
    const list = document.createElement("div");
    list.className = "jba-directory-list";
    for (const biz of pageResult.items) {
      list.appendChild(buildCard(biz, state.selectedBusinessId === biz.id));
    }
    panel.appendChild(list);

    // --- Pagination ---
    if (pageResult.totalPages > 1) {
      const pager = document.createElement("div");
      pager.className = "jba-directory-pager";

      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.textContent = "Prev";
      prevBtn.disabled = pageResult.page <= 1;
      prevBtn.addEventListener("click", () => store.setState({ page: pageResult.page - 1 }));
      pager.appendChild(prevBtn);

      const pageLabel = document.createElement("span");
      pageLabel.className = "jba-directory-pager__label";
      pageLabel.textContent = `Page ${pageResult.page} of ${pageResult.totalPages}`;
      pager.appendChild(pageLabel);

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.textContent = "Next";
      nextBtn.disabled = pageResult.page >= pageResult.totalPages;
      nextBtn.addEventListener("click", () => store.setState({ page: pageResult.page + 1 }));
      pager.appendChild(nextBtn);

      panel.appendChild(pager);
    }
  }

  function buildCard(biz: Business, isSelected: boolean): HTMLElement {
    const card = document.createElement("article");
    card.className = "jba-business-card";
    if (isSelected) card.classList.add("is-selected");
    card.dataset.businessId = biz.id;

    const summary = document.createElement("div");
    summary.className = "jba-business-card__summary";
    summary.setAttribute("role", "button");
    summary.tabIndex = 0;

    const logo = document.createElement("div");
    logo.className = "jba-business-card__logo";
    logo.style.background = biz.logo.color;
    logo.textContent = biz.logo.initials;
    summary.appendChild(logo);

    const meta = document.createElement("div");
    meta.className = "jba-business-card__meta";
    const name = document.createElement("div");
    name.className = "jba-business-card__name";
    name.textContent = biz.name;
    meta.appendChild(name);
    const sub = document.createElement("div");
    sub.className = "jba-business-card__sub";
    sub.textContent = `${biz.industry} · ${biz.headquarters.city}, ${biz.headquarters.countryName}`;
    meta.appendChild(sub);
    summary.appendChild(meta);

    const chevron = document.createElement("span");
    chevron.className = "jba-business-card__chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = isSelected ? "▾" : "▸";
    summary.appendChild(chevron);

    function select() {
      const current = store.getState().selectedBusinessId;
      store.setState({ selectedBusinessId: current === biz.id ? null : biz.id });
    }
    summary.addEventListener("click", select);
    summary.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select();
      }
    });
    card.appendChild(summary);

    if (isSelected) {
      card.appendChild(buildDetail(biz));
    }

    return card;
  }

  function buildDetail(biz: Business): HTMLElement {
    const detail = document.createElement("div");
    detail.className = "jba-business-card__detail";

    const desc = document.createElement("p");
    desc.className = "jba-business-card__description";
    desc.textContent = biz.description;
    detail.appendChild(desc);

    const servicesLabel = document.createElement("div");
    servicesLabel.className = "jba-business-card__section-label";
    servicesLabel.textContent = "Services";
    detail.appendChild(servicesLabel);
    const servicesList = document.createElement("div");
    servicesList.className = "jba-business-card__chips";
    for (const s of biz.services) {
      const chip = document.createElement("span");
      chip.className = "jba-chip";
      chip.textContent = s;
      servicesList.appendChild(chip);
    }
    detail.appendChild(servicesList);

    if (biz.serviceCoverage.length > 0) {
      const coverageLabel = document.createElement("div");
      coverageLabel.className = "jba-business-card__section-label";
      coverageLabel.textContent = "Service coverage";
      detail.appendChild(coverageLabel);
      const coverageList = document.createElement("div");
      coverageList.className = "jba-business-card__chips";
      for (const c of biz.serviceCoverage) {
        const chip = document.createElement("span");
        chip.className = "jba-chip jba-chip--muted";
        chip.textContent = c.name;
        coverageList.appendChild(chip);
      }
      detail.appendChild(coverageList);
    }

    const factsRow = document.createElement("div");
    factsRow.className = "jba-business-card__facts";
    if (biz.founded) {
      factsRow.appendChild(fact("Founded", String(biz.founded)));
    }
    if (biz.employeeRange) {
      factsRow.appendChild(fact("Employees", biz.employeeRange));
    }
    detail.appendChild(factsRow);

    if (biz.contact && (biz.contact.website || biz.contact.email || biz.contact.phone)) {
      const contactRow = document.createElement("div");
      contactRow.className = "jba-business-card__contact";
      if (biz.contact.website) contactRow.appendChild(fact("Website", biz.contact.website));
      if (biz.contact.email) contactRow.appendChild(fact("Email", biz.contact.email));
      if (biz.contact.phone) contactRow.appendChild(fact("Phone", biz.contact.phone));
      detail.appendChild(contactRow);
    }

    return detail;
  }

  function fact(label: string, value: string): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "jba-business-card__fact";
    wrap.innerHTML = `<span class="jba-business-card__fact-label">${label}</span><span>${value}</span>`;
    return wrap;
  }

  store.subscribe(render);
  render();

  return panel;
}
