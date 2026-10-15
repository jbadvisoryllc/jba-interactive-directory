/** Shared layer/source ids so map modules stay in sync without string duplication. */
export const SOURCE_COUNTRIES = "countries";
export const SOURCE_SUBREGION_LABELS = "subregion-labels";

export const LAYER_COUNTRIES_FILL_NEUTRAL = "countries-fill-neutral";
export const LAYER_COUNTRIES_FILL = "countries-fill";
export const LAYER_COUNTRIES_LINE = "countries-line";
export const LAYER_SUBREGION_LABELS = "subregion-labels";

/** Interactive layers that participate in hover/click (excludes neutral/non-interactive land). */
export const INTERACTIVE_LAYERS = [LAYER_COUNTRIES_FILL];
