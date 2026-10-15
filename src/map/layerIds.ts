/** Shared layer/source ids so map modules stay in sync without string duplication. */
export const SOURCE_COUNTRIES = "countries";
export const SOURCE_SUBREGION_LABELS = "subregion-labels";

export const LAYER_COUNTRIES_FILL_NEUTRAL = "countries-fill-neutral";
export const LAYER_COUNTRIES_FILL = "countries-fill";
export const LAYER_COUNTRIES_LINE = "countries-line";
export const LAYER_SUBREGION_LABELS = "subregion-labels";

/** Interactive layers that participate in hover/click (excludes neutral/non-interactive land). */
export const INTERACTIVE_LAYERS = [LAYER_COUNTRIES_FILL];

/** Business headquarters markers (Checkpoint 3). */
export const SOURCE_BUSINESSES = "businesses";
export const LAYER_BUSINESS_CLUSTERS = "business-clusters";
export const LAYER_BUSINESS_CLUSTER_COUNT = "business-cluster-count";
export const LAYER_BUSINESS_POINTS = "business-points";
