#!/usr/bin/env node
/**
 * build-geo.mjs
 *
 * Generates src/data/geo/countries.topo.json: country/territory boundaries
 * joined to their UN M49 subregion, simplified, and encoded as TopoJSON.
 *
 * Source: Natural Earth 1:50m admin-0 *map units* (not the "countries"
 * layer). Map units keep overseas territories and sub-national units as
 * separate features instead of folding them into their parent country's
 * geometry — that matters here because a territory often belongs to a
 * different M49 subregion than its parent (e.g. French Guiana is South
 * America, not Western Europe).
 *
 * Fetched from a commit-pinned raw.githubusercontent.com URL for
 * reproducibility (not vendored into the repo — this script re-fetches
 * on demand and caches locally in .cache/, which is gitignored).
 *
 * Usage: npm run build:geo
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mapshaper from "mapshaper";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(ROOT, ".cache");
const SOURCE_CACHE_PATH = path.join(CACHE_DIR, "ne_50m_admin_0_map_units.geojson");
const GEO_DATA_DIR = path.join(ROOT, "src", "data", "geo");
const OUTPUT_PATH = path.join(GEO_DATA_DIR, "countries.topo.json");

// Pinned to a specific commit of nvkelso/natural-earth-vector (mirrors the
// official naturalearthdata.com releases) so this build is reproducible.
// Bump deliberately if a newer Natural Earth release is wanted.
const SOURCE_COMMIT = "ca96624a56bd078437bca8184e78163e5039ad19";
const SOURCE_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${SOURCE_COMMIT}/geojson/ne_50m_admin_0_map_units.geojson`;

const SIMPLIFY_PERCENT = "8%";

/** @type {Record<string, string>} ISO_A3_EH -> M49 subregion code */
let countryMapping;
/** @type {Record<string, {subregionCode: string, note: string}>} SU_A3 -> override */
let disputedOverrides;
/** @type {Record<string, string>} ISO_A3_EH or SU_A3 -> reason */
let excludedFeatures;
/** @type {Array<{code: string, name: string}>} */
let subregionList;

async function loadReferenceData() {
  const [subregionsRaw, countryRaw] = await Promise.all([
    readFile(path.join(GEO_DATA_DIR, "m49-subregions.json"), "utf8"),
    readFile(path.join(GEO_DATA_DIR, "country-subregion.json"), "utf8"),
  ]);
  const subregions = JSON.parse(subregionsRaw);
  const countryData = JSON.parse(countryRaw);
  subregionList = subregions.subregions.map((s) => ({ code: s.code, name: s.name }));
  countryMapping = countryData.mapping;
  disputedOverrides = countryData.disputedTerritoryOverrides;
  excludedFeatures = countryData.excludedFeatures;
}

async function fetchSource() {
  if (existsSync(SOURCE_CACHE_PATH)) {
    console.log(`[build-geo] Using cached source: ${SOURCE_CACHE_PATH}`);
    return readFile(SOURCE_CACHE_PATH, "utf8");
  }
  console.log(`[build-geo] Fetching Natural Earth admin-0 map units from pinned commit ${SOURCE_COMMIT.slice(0, 12)}…`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch source data: HTTP ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(SOURCE_CACHE_PATH, text, "utf8");
  console.log(`[build-geo] Cached source to ${SOURCE_CACHE_PATH} (${(text.length / 1024 / 1024).toFixed(1)} MB)`);
  return text;
}

const subregionNameByCode = () =>
  Object.fromEntries(subregionList.map((s) => [s.code, s.name]));

/**
 * Resolves a Natural Earth feature's country/territory ISO code and M49
 * subregion. Returns null subregionCode for deliberately excluded features
 * (Antarctica and similarly uninhabited/non-M49 territories).
 */
function resolveFeature(props) {
  const ehCode = props.ISO_A3_EH && props.ISO_A3_EH !== "-99" ? props.ISO_A3_EH : null;

  // Excluded features take priority whether keyed by ISO or by SU_A3.
  if (ehCode && excludedFeatures[ehCode]) {
    return { countryIso3: ehCode, subregionCode: null, excludedReason: excludedFeatures[ehCode] };
  }
  if (excludedFeatures[props.SU_A3]) {
    return { countryIso3: null, subregionCode: null, excludedReason: excludedFeatures[props.SU_A3] };
  }

  if (ehCode) {
    const subregionCode = countryMapping[ehCode];
    if (subregionCode) {
      return { countryIso3: ehCode, subregionCode, excludedReason: null };
    }
    return { countryIso3: ehCode, subregionCode: undefined, excludedReason: null }; // unmapped — flagged by caller
  }

  // No usable ISO code at all — check the disputed-territory override table by SU_A3.
  const override = disputedOverrides[props.SU_A3];
  if (override) {
    return { countryIso3: props.SU_A3, subregionCode: override.subregionCode, excludedReason: null };
  }

  return { countryIso3: props.SU_A3 || null, subregionCode: undefined, excludedReason: null }; // unresolved
}

/**
 * Flags rings with a jump of more than 180° between consecutive longitudes,
 * which would indicate a polygon that crosses the antimeridian without
 * being split into separate parts (a rendering hazard). Natural Earth
 * splits these properly at source, so this is a safety net, not expected
 * to fire.
 */
function findAntimeridianAnomalies(feature) {
  const anomalies = [];
  const checkRing = (ring) => {
    for (let i = 1; i < ring.length; i++) {
      const prevLon = ring[i - 1][0];
      const lon = ring[i][0];
      if (Math.abs(lon - prevLon) > 180) {
        anomalies.push({ from: prevLon, to: lon });
      }
    }
  };
  const geom = feature.geometry;
  if (!geom) return anomalies;
  if (geom.type === "Polygon") {
    geom.coordinates.forEach(checkRing);
  } else if (geom.type === "MultiPolygon") {
    geom.coordinates.forEach((poly) => poly.forEach(checkRing));
  }
  return anomalies;
}

async function run() {
  await loadReferenceData();
  const sourceText = await fetchSource();
  const source = JSON.parse(sourceText);

  const nameByCode = subregionNameByCode();
  const trimmedFeatures = [];
  const perSubregionCount = Object.fromEntries(subregionList.map((s) => [s.code, 0]));
  const excludedLog = [];
  const unresolved = [];
  const antimeridianWarnings = [];

  for (const feature of source.features) {
    const props = feature.properties;
    const resolved = resolveFeature(props);

    if (resolved.subregionCode === undefined) {
      unresolved.push({
        name: props.NAME,
        iso: props.ISO_A3_EH,
        su: props.SU_A3,
        type: props.TYPE,
      });
      continue; // not included in output — see validation report
    }

    const anomalies = findAntimeridianAnomalies(feature);
    if (anomalies.length > 0) {
      antimeridianWarnings.push({ name: props.NAME, count: anomalies.length });
    }

    if (resolved.subregionCode === null) {
      excludedLog.push({ name: props.NAME, reason: resolved.excludedReason });
    } else {
      perSubregionCount[resolved.subregionCode] =
        (perSubregionCount[resolved.subregionCode] ?? 0) + 1;
    }

    trimmedFeatures.push({
      type: "Feature",
      properties: {
        countryName: props.ADMIN || props.NAME,
        featureName: props.NAME,
        countryIso3: resolved.countryIso3,
        adm0Iso3: props.ADM0_A3 && props.ADM0_A3 !== "-99" ? props.ADM0_A3 : resolved.countryIso3,
        subregionCode: resolved.subregionCode, // string code, or null for excluded/neutral land
        subregionName: resolved.subregionCode ? nameByCode[resolved.subregionCode] : null,
      },
      geometry: feature.geometry,
    });
  }

  // --- Validation ---------------------------------------------------
  const emptySubregions = subregionList.filter((s) => perSubregionCount[s.code] === 0);
  const hasFailure = unresolved.length > 0 || emptySubregions.length > 0;

  console.log("\n[build-geo] Validation report");
  console.log("  Source features:", source.features.length);
  console.log("  Included (subregion-colored or neutral):", trimmedFeatures.length);
  console.log("  Excluded (neutral, documented):", excludedLog.length);
  for (const e of excludedLog) console.log(`    - ${e.name}: ${e.reason}`);
  console.log("  Features per subregion:");
  for (const s of subregionList) {
    console.log(`    ${s.code} ${s.name}: ${perSubregionCount[s.code]}`);
  }
  if (antimeridianWarnings.length > 0) {
    console.log("  Antimeridian ring anomalies (unexpected — investigate):");
    for (const w of antimeridianWarnings) console.log(`    - ${w.name}: ${w.count} jump(s)`);
  } else {
    console.log("  Antimeridian ring check: no anomalies (date-line-crossing features split correctly at source).");
  }
  if (unresolved.length > 0) {
    console.log("  UNRESOLVED features (no subregion, not in exclusion list — build-blocking):");
    for (const u of unresolved) console.log(`    - ${JSON.stringify(u)}`);
  }
  if (emptySubregions.length > 0) {
    console.log("  SUBREGIONS WITH ZERO FEATURES (build-blocking):");
    for (const s of emptySubregions) console.log(`    - ${s.code} ${s.name}`);
  }

  if (hasFailure) {
    console.error("\n[build-geo] FAILED — see unresolved/empty-subregion list above.");
    process.exitCode = 1;
    return;
  }

  // --- Simplify + encode as TopoJSON ---------------------------------
  const trimmedGeoJson = JSON.stringify({ type: "FeatureCollection", features: trimmedFeatures });

  const result = await new Promise((resolve, reject) => {
    mapshaper.applyCommands(
      `-i input.json -simplify ${SIMPLIFY_PERCENT} keep-shapes -clean -o format=topojson quantization=1e5 output.json`,
      { "input.json": trimmedGeoJson },
      (err, output) => (err ? reject(err) : resolve(output))
    );
  });

  await mkdir(GEO_DATA_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, result["output.json"], "utf8");

  const sizeKb = (result["output.json"].length / 1024).toFixed(0);
  console.log(`\n[build-geo] Wrote ${OUTPUT_PATH} (${sizeKb} KB)`);
  console.log("[build-geo] Done.");
}

run().catch((err) => {
  console.error("[build-geo] Error:", err);
  process.exitCode = 1;
});
