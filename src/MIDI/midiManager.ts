// Web MIDI singleton. Owns `requestMIDIAccess` so exactly one permission
// prompt and one set of `onmidimessage` bindings exist for the whole app, and
// so hot-plugged devices are picked up via the access object's `statechange`
// event. React reads it through `useSyncExternalStore` (see `useMIDI.ts`).

export const MIDI_ALL_INPUTS = "all";

export type MIDIStatus =
  | "idle"
  | "unsupported"
  | "denied"
  | "no-devices"
  | "ready";

export interface MIDIDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
}

export interface MIDIState {
  status: MIDIStatus;
  devices: MIDIDeviceInfo[];
  selectedId: string;
}

export interface MIDINoteEvent {
  type: "on" | "off";
  note: number;
  velocity: number;
  channel: number;
}

const NOTE_OFF = 0x80;
const NOTE_ON = 0x90;
const SYSTEM = 0xf0;

/** How long after the last message the activity indicator stays lit (ms). */
export const MIDI_ACTIVITY_MS = 200;

const INITIAL_STATE: MIDIState = {
  status: "idle",
  devices: [],
  selectedId: MIDI_ALL_INPUTS,
};

class MIDIManager {
  private access: MIDIAccess | null = null;
  private state: MIDIState = INITIAL_STATE;
  private lastEventAt = 0;
  private pending: Promise<void> | null = null;
  private stateListeners = new Set<() => void>();
  private noteListeners = new Set<(event: MIDINoteEvent) => void>();
  private bound = new Map<string, (event: MIDIMessageEvent) => void>();

  getState = (): MIDIState => this.state;

  getLastEventAt = (): number => this.lastEventAt;

  subscribe = (listener: () => void) => {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  };

  onNote = (listener: (event: MIDINoteEvent) => void) => {
    this.noteListeners.add(listener);
    return () => {
      this.noteListeners.delete(listener);
    };
  };

  setSelectedId = (id: string) => {
    if (id === this.state.selectedId) return;
    this.patch({ selectedId: id });
  };

  private patch(partial: Partial<MIDIState>) {
    this.state = { ...this.state, ...partial };
    for (const listener of this.stateListeners) listener();
  }

  /** Idempotent: safe to call on every mount without re-prompting. */
  ensureAccess = (): Promise<void> => {
    if (this.pending) return this.pending;
    this.pending = this.connect();
    return this.pending;
  };

  private async connect() {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      this.patch({ status: "unsupported" });
      return;
    }
    try {
      // No `sysex`, so this needs no user activation.
      const access = await navigator.requestMIDIAccess();
      this.access = access;
      access.addEventListener("statechange", this.handlePortsChanged);
      this.syncInputs();
    } catch (err) {
      console.warn("[midi] requestMIDIAccess failed", err);
      this.patch({ status: "denied" });
    }
  }

  private handlePortsChanged = () => {
    this.syncInputs();
  };

  private syncInputs() {
    const access = this.access;
    if (!access) return;

    for (const id of [...this.bound.keys()]) {
      if (access.inputs.has(id)) continue;
      const input = access.inputs.get(id);
      if (input) input.onmidimessage = null;
      this.bound.delete(id);
    }

    const devices: MIDIDeviceInfo[] = [];
    for (const input of access.inputs.values()) {
      if (!this.bound.has(input.id)) {
        const handler = (event: MIDIMessageEvent) => this.handleMessage(input, event);
        input.onmidimessage = handler;
        this.bound.set(input.id, handler);
      }
      devices.push({
        id: input.id,
        name: input.name || input.id,
        manufacturer: input.manufacturer || "",
      });
    }
    devices.sort((a, b) => a.name.localeCompare(b.name));

    const { selectedId } = this.state;
    const nextSelected =
      selectedId === MIDI_ALL_INPUTS || devices.some((d) => d.id === selectedId)
        ? selectedId
        : MIDI_ALL_INPUTS;

    this.patch({
      devices,
      selectedId: nextSelected,
      status: devices.length > 0 ? "ready" : "no-devices",
    });
  }

  private handleMessage(input: MIDIInput, event: MIDIMessageEvent) {
    if (!this.isSelected(input.id)) return;

    const data = event.data;
    if (!data || data.length < 2) return;
    const status = data[0];
    if (status >= SYSTEM) return;

    const command = status & 0xf0;
    const note = data[1];
    const velocity = data.length > 2 ? data[2] : 0;

    // A note-off is 0x80, but many controllers also send note-on with velocity
    // 0 as the release.
    let type: "on" | "off" | null = null;
    if (command === NOTE_ON && velocity > 0) type = "on";
    else if (command === NOTE_OFF || command === NOTE_ON) type = "off";
    if (!type) return;

    this.lastEventAt = Date.now();
    const noteEvent: MIDINoteEvent = {
      type,
      note,
      velocity,
      channel: status & 0x0f,
    };
    for (const listener of this.noteListeners) listener(noteEvent);
  }

  private isSelected(inputId: string) {
    const { selectedId } = this.state;
    return selectedId === MIDI_ALL_INPUTS || selectedId === inputId;
  }
}

export const midiManager = new MIDIManager();
