"use client";

import { useIsFetching, useIsMutating } from "@tanstack/react-query";

/** A thin indeterminate progress bar pinned to the top of the viewport, visible
 * whenever any React Query request (query or mutation) is in flight anywhere
 * on the page — gives the whole app a consistent "something is happening" cue
 * beyond each section's own skeleton. */
export function GlobalLoadingBar() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const active = isFetching + isMutating > 0;

  return (
    <div
      role="progressbar"
      aria-hidden={!active}
      aria-valuetext={active ? "Loading" : undefined}
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="loading-bar-track h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent" />
    </div>
  );
}
