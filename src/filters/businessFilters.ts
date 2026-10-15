import type { Business } from "@/data/business-types";
import type { FilterState, SortOption } from "@/state/store";

/**
 * Pure filtering/sorting/pagination functions, kept separate from the
 * store and UI so they're independently testable (see
 * tests/business-filters.test.ts) and reusable by both the directory
 * panel and the map marker layer — both read the same filtered list.
 */

function matchesSearch(biz: Business, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const haystack = [
    biz.name,
    biz.headquarters.countryName,
    biz.headquarters.city,
    biz.industry,
    ...biz.services,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/**
 * Headquarters-based filtering, per the brief: region/country filters
 * match a business's `headquarters` location, not its serviceCoverage.
 */
export function filterBusinesses(businesses: Business[], filters: FilterState): Business[] {
  return businesses.filter((biz) => {
    if (filters.selectedRegions.size > 0 && !filters.selectedRegions.has(biz.headquarters.subregionCode)) {
      return false;
    }
    if (filters.selectedCountries.size > 0 && !filters.selectedCountries.has(biz.headquarters.countryIso3)) {
      return false;
    }
    if (filters.selectedIndustries.size > 0 && !filters.selectedIndustries.has(biz.industry)) {
      return false;
    }
    if (filters.selectedServices.size > 0 && !biz.services.some((s) => filters.selectedServices.has(s))) {
      return false;
    }
    if (!matchesSearch(biz, filters.searchQuery)) {
      return false;
    }
    return true;
  });
}

export function sortBusinesses(list: Business[], sort: SortOption): Business[] {
  const sorted = [...list];
  switch (sort) {
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "founded-newest":
      return sorted.sort((a, b) => (b.founded ?? 0) - (a.founded ?? 0));
    case "founded-oldest":
      return sorted.sort((a, b) => (a.founded ?? 9999) - (b.founded ?? 9999));
    case "relevance":
    default:
      return sorted;
  }
}

export interface PageResult {
  items: Business[];
  page: number;
  totalPages: number;
  total: number;
}

export function paginate(list: Business[], page: number, pageSize: number): PageResult {
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    page: clampedPage,
    totalPages,
    total,
  };
}

/** Unique, alphabetized service names across the full dataset, for the service filter list. */
export function allServices(businesses: Business[]): string[] {
  const set = new Set<string>();
  for (const biz of businesses) {
    for (const s of biz.services) set.add(s);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Unique countries present in the dataset's headquarters, for the country filter list. */
export function allHeadquartersCountries(businesses: Business[]): { iso3: string; name: string }[] {
  const map = new Map<string, string>();
  for (const biz of businesses) {
    map.set(biz.headquarters.countryIso3, biz.headquarters.countryName);
  }
  return [...map.entries()]
    .map(([iso3, name]) => ({ iso3, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
