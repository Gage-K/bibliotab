/**
 * Lazy loader for tone.js.
 *
 * Tone is ~66 kB gzipped and can't do anything until the audio context is unlocked by a
 * user gesture, so there is no reason for it to be in the initial bundle — importing it
 * statically meant the marketing page shipped a synthesis engine to render a demo
 * nobody had pressed play on.
 *
 * `loadTone` is called from the same click handler that calls `Tone.start()`, so the
 * download happens on the first play and is cached from then on.
 */
export type ToneModule = typeof import("tone");

let pending: Promise<ToneModule> | null = null;
let loaded: ToneModule | null = null;

export function loadTone(): Promise<ToneModule> {
  if (!pending) {
    pending = import("tone").then((module) => {
      loaded = module;
      return module;
    });
  }
  return pending;
}

/**
 * The module if it has already loaded, else null.
 *
 * For callers that can't await — the playhead samples the transport on animation
 * frames, and teardown runs on unmount whether or not anything ever played.
 */
export function peekTone(): ToneModule | null {
  return loaded;
}
