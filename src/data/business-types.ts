/**
 * Business directory data model (Checkpoint 3).
 *
 * Headquarters vs. service coverage are modeled independently per the
 * brief: `headquarters` is the single physical office a map marker
 * represents, while `serviceCoverage` is a separate list of the
 * countries and/or M49 regions the business serves — a business may be
 * headquartered in one country and serve several regions. Filtering can
 * target either independently; Checkpoint 3 wires up headquarters-based
 * filtering by default and keeps serviceCoverage in the data model for
 * future functionality without adding interface complexity now.
 */

export const INDUSTRIES = [
  "Construction",
  "Energy",
  "Logistics",
  "Manufacturing",
  "Technology",
  "Professional Services",
  "Marine Services",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export interface Headquarters {
  /** ISO 3166-1 alpha-3 country code. */
  countryIso3: string;
  countryName: string;
  city: string;
  /** [longitude, latitude] — matches GeoJSON/Mapbox coordinate order. */
  coordinates: [number, number];
  /** UN M49 subregion code (see src/data/geo/m49-subregions.json). */
  subregionCode: string;
  subregionName: string;
}

export interface ServiceCoverageEntry {
  /** "country" for an ISO3-coded single country, "region" for an M49 subregion. */
  type: "country" | "region";
  /** ISO3 code when type is "country", M49 subregion code when type is "region". */
  code: string;
  name: string;
}

export interface BusinessContact {
  website?: string;
  email?: string;
  phone?: string;
}

export interface BusinessLogo {
  /** Checkpoint 3 ships monogram placeholders only; a future checkpoint can add real image logos. */
  type: "monogram";
  initials: string;
  /** Hex color for the monogram background, drawn from a small accent-safe set (see businesses.json). */
  color: string;
}

export interface Business {
  id: string;
  name: string;
  industry: Industry;
  services: string[];
  description: string;
  headquarters: Headquarters;
  serviceCoverage: ServiceCoverageEntry[];
  logo: BusinessLogo;
  contact?: BusinessContact;
  founded?: number;
  employeeRange?: string;
}
