# JB Advisory — Global Business Network

An interactive, configurable global business directory demo built for **JB Advisory LLC**. Developed independently from any JB Advisory client systems or proprietary code.

> **Status:** Checkpoint 1 (architecture & setup) complete. This is a smoke-test shell — nav rail + a bare Mapbox map — proving the token, build, and deploy pipeline end to end. Country boundaries, region interaction, filters, and the business directory land in Checkpoint 2.

## Stack

- [Vite](https://vite.dev/) + TypeScript (no UI framework)
- [Mapbox GL JS v3](https://docs.mapbox.com/mapbox-gl-js/) for the map
- [Sarala](https://fonts.google.com/specimen/Sarala) (Google Fonts) for typography
- Static JSON data, no backend

## Project structure

```
src/
  config/       app.config.ts — branding, map defaults, page size (edit this to retarget the app)
  theme/        tokens.css (CSS vars, approved palette) + palette.ts (same values for map code)
  data/geo/     UN M49 subregions, country->subregion mapping, generated boundary TopoJSON
  data/         fictional business dataset (Checkpoint 2)
  state/        shared filter/selection store (Checkpoint 2)
  filters/      pure filter functions (Checkpoint 2)
  map/          Mapbox init + style building
  components/   UI components
scripts/
  build-geo.mjs — generates src/data/geo/countries.topo.json from Natural Earth (Checkpoint 2)
tests/          geo data integrity tests
```

## Local development

1. `npm install`
2. Copy `.env.example` to `.env.local` and set your Mapbox public token:
   ```
   VITE_MAPBOX_TOKEN=pk.your_token_here
   ```
   `.env.local` is gitignored — never commit a real token.
3. `npm run dev`

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the test suite (vitest) |
| `npm run build:geo` | Regenerate `countries.topo.json` from Natural Earth (Checkpoint 2) |

## Deployment (GitHub Pages)

Deployment is automatic via `.github/workflows/deploy.yml` on every push to `main`, and can also be triggered manually from the Actions tab.

**One-time repository setup (required before the first deploy):**

1. **Settings → Pages → Source:** select **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables tab → New repository variable:**
   - Name: `VITE_MAPBOX_TOKEN`
   - Value: your Mapbox public (`pk.`) token
   - It's stored as a *variable*, not a *secret*, because Mapbox public tokens are meant to ship in client bundles — restrict it by URL in the Mapbox dashboard (see below) rather than treating it as confidential.
3. Push to `main`. The workflow builds with that token baked in via Vite's `import.meta.env.VITE_MAPBOX_TOKEN` and publishes `dist/` to Pages.

Live URL once enabled: `https://jbadvisoryllc.github.io/jba-interactive-directory/`

**Restrict the Mapbox token:** in the Mapbox dashboard, add a URL restriction for `https://jbadvisoryllc.github.io/*` so the token only works from this site.

### Base path

`vite.config.ts` sets `base: "/jba-interactive-directory/"` to match this repo's Pages URL. If the repo is ever renamed, update that value (and the Mapbox token's URL restriction) to match.

## Geographic data — known edge cases

Boundaries are generated from Natural Earth's public-domain *admin-0 map units* layer (not the "countries" layer, which would bundle overseas territories into their parent country's shape and misassign their subregion). See `scripts/build-geo.mjs` for details. A few UN M49 edge cases, documented here rather than silently resolved:

- **Antarctica** has no UN M49 subregion and is rendered as neutral/non-interactive.
- **Taiwan** is not listed in the M49 standard; it's placed in Eastern Asia, consistent with common UN statistical groupings.
- **Kosovo** and **Western Sahara** follow Natural Earth's de facto boundaries.
- **Antimeridian-crossing regions** (Eastern Europe/Russia, Australia and New Zealand, Melanesia, Polynesia) use hand-set camera bounds in `src/data/geo/m49-subregions.json` rather than computed bounding boxes, to avoid zooming out to the whole globe when selected.

## Data disclosure

All business records in this application are fictional demonstration data created for this prototype. They do not represent real companies. This is stated in the UI.

## License / provenance

Built independently for JB Advisory LLC. Contains no Nauticworx source code, datasets, or business logic.
