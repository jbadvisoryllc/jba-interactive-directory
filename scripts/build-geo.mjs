#!/usr/bin/env node
/**
 * build-geo.mjs
 *
 * Generates src/data/geo/countries.topo.json from Natural Earth's
 * admin-0 map units layer (1:50m), joined against country-subregion.json
 * so each feature carries its UN M49 subregion code.
 *
 * Map units (not the "countries" layer) are used deliberately: Natural
 * Earth's countries layer bundles overseas territories into their parent
 * country's geometry (e.g. French Guiana inside France), which would pull
 * those territories into the wrong M49 subregion. Map units keep them as
 * separate features so each can carry its own correct subregion code.
 *
 * NOT implemented yet — this is the Checkpoint 1 skeleton. Checkpoint 2
 * fills in: downloading/vendoring the Natural Earth source, the ISO code
 * patch table for known gaps (France, Norway, Kosovo report -99 in the
 * source data), simplification, and the subregion-coverage validation
 * check (every feature must resolve to exactly one of the 22 subregions,
 * or be explicitly listed as excluded, e.g. Antarctica).
 *
 * Usage (once implemented): npm run build:geo
 */

console.log(
  "[build-geo] Not yet implemented — scheduled for Checkpoint 2.\n" +
    "Will read src/data/geo/country-subregion.json + Natural Earth admin-0\n" +
    "map units, and write src/data/geo/countries.topo.json."
);
process.exitCode = 0;
