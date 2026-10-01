// React bindings for the Web MIDI singleton. Kept apart from `midiManager.ts`
// so that file stays framework-agnostic and unit-testable.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { MIDI_ACTIVITY_MS, midiManager, type MIDINoteEvent, type MIDIState } from "./midiManager";

export function useMIDIState(): MIDIState {
  return useSyncExternalStore(midiManager.subscribe, midiManager.getState, midiManager.getState);
}

/**
 * Subscribe to note events. The callback is held in a ref, so callers do not
 * need to memoise it and never observe a stale closure.
 */
export function useMIDINotes(callback: (event: MIDINoteEvent) => void) {
  const latest = useRef(callback);
  latest.current = callback;

  useEffect(
    () =>
      midiManager.onNote((event) => {
        latest.current(event);
      }),
    []
  );
}

/**
 * Polls rather than subscribing, so a dense MIDI stream does not re-render the
 * component that owns the indicator.
 */
export function useMIDIActive(): boolean {
  const [active, setActive] = useState(() => isActive());

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => {
        const next = isActive();
        return next === prev ? prev : next;
      });
    }, MIDI_ACTIVITY_MS / 2);
    return () => window.clearInterval(id);
  }, []);

  return active;
}

function isActive() {
  const last = midiManager.getLastEventAt();
  return last > 0 && Date.now() - last < MIDI_ACTIVITY_MS;
}
