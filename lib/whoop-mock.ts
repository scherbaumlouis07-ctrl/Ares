/**
 * Single source of truth for the WHOOP mock values shown until real WHOOP
 * integration exists. Everything that needs a WHOOP number (the Core Scores
 * tile, Core Stats' Energy calculation) reads from here, so swapping this
 * out for a real API call later updates every consumer at once.
 */
export const WHOOP_MOCK = {
  sleep: 87,
  recovery: 91,
  strain: 12.4,
};

/** A day counts as "Sleep erfüllt" in the Performance Heatmap when the (currently constant) mock Sleep score is at or above this. */
export const SLEEP_HEATMAP_THRESHOLD = 80;
