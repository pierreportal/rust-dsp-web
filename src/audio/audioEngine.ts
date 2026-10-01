// Audio engine singleton: owns the AudioContext + AudioWorkletNode that runs
// the wasm Graph. The React UI calls these methods to mirror its node/edge
// state into the worklet. The worklet is the audio-rate processor; this layer
// just ferries mutations and the initial wasm bytes across the thread boundary.
//
// Two states matter and are deliberately independent:
//   - `isReady`  the worklet + wasm graph are live, so graph mutations are safe
//   - `isRunning` the AudioContext is actually allowed to pull audio
// Browsers refuse to start a context without a user gesture, so `init()` never
// awaits `resume()`: doing so deadlocks first paint, because the promise from
// `ctx.resume()` does not settle until the page has been interacted with.

import type { KindCode } from "./nodeSpec";

type WorkletNode = AudioWorkletNode;

const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private node: WorkletNode | null = null;
  private ready = false;
  private running = false;
  private readyPromise: Promise<void> | null = null;
  private listeners = new Set<() => void>();
  private removeUnlock: (() => void) | null = null;

  get isReady() {
    return this.ready;
  }

  get isRunning() {
    return this.running;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit() {
    for (const listener of this.listeners) listener();
  }

  async init(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;
    this.readyPromise = this.doInit().catch((err) => {
      // Drop the memoized promise so a later mount (or the retry button) can
      // try again from a clean slate.
      this.readyPromise = null;
      this.ready = false;
      void this.dispose();
      throw err;
    });
    return this.readyPromise;
  }

  private createContext(): AudioContext {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) {
      throw new Error("Web Audio API unavailable in this browser.");
    }
    try {
      return new Ctor({ sampleRate: 48000 });
    } catch {
      // Not every device honours a forced rate; fall back to the hardware one.
      // The worklet reads the context's real `sampleRate`, so the wasm graph
      // stays in sync either way.
      return new Ctor();
    }
  }

  private async doInit(): Promise<void> {
    const ctx = this.createContext();
    this.ctx = ctx;
    ctx.addEventListener("statechange", this.handleStateChange);

    if (!ctx.audioWorklet) {
      throw new Error(
        "AudioWorklet unavailable: open the app via http://localhost (secure context), not file:// or a LAN IP."
      );
    }

    const master = ctx.createGain();
    master.gain.value = 0.4;
    master.connect(ctx.destination);

    await ctx.audioWorklet.addModule("graph-processor.js", { type: "module" } as WorkletOptions);

    const node = new AudioWorkletNode(ctx, "graph-processor", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    node.connect(master);
    this.node = node;

    node.port.onmessage = (event) => {
      if (event.data?.op === "error") console.error("[worklet]", event.data.message);
    };

    const wasmBytes = await (
      await fetch(`pkg/web_bg.wasm?v=${Date.now()}`)
    ).arrayBuffer();
    await new Promise<void>((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data?.op === "ready") {
          node.port.removeEventListener("message", handler);
          resolve();
        } else if (event.data?.op === "error") {
          node.port.removeEventListener("message", handler);
          reject(new Error(event.data.message));
        }
      };
      node.port.addEventListener("message", handler);
      node.port.postMessage({ op: "wasmBytes", bytes: wasmBytes }, [wasmBytes]);
    });

    this.ready = true;
    this.syncRunning();
    this.installUnlock();
    this.emit();
  }

  private handleStateChange = () => {
    this.syncRunning();
  };

  private syncRunning() {
    const next = this.ctx?.state === "running";
    if (next === this.running) return;
    this.running = next;
    if (next) this.removeUnlockListeners();
    this.emit();
  }

  private installUnlock() {
    if (this.removeUnlock || this.running) return;
    const onGesture = () => {
      void this.resume();
    };
    for (const type of UNLOCK_EVENTS) {
      window.addEventListener(type, onGesture, { capture: true });
    }
    this.removeUnlock = () => {
      for (const type of UNLOCK_EVENTS) {
        window.removeEventListener(type, onGesture, { capture: true });
      }
    };
  }

  private removeUnlockListeners() {
    this.removeUnlock?.();
    this.removeUnlock = null;
  }

  /**
   * Best-effort start. Safe to call outside a user gesture: the promise may
   * never settle, so callers must not block a render path on it.
   */
  async resume(): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn("[audioEngine] resume failed", err);
      }
    }
    this.syncRunning();
  }

  private async dispose() {
    this.removeUnlockListeners();
    const ctx = this.ctx;
    this.ctx = null;
    this.node = null;
    this.running = false;
    this.emit();
    try {
      await ctx?.close();
    } catch {
      // Already closed or never started; nothing to clean up.
    }
  }

  private post(msg: unknown) {
    if (!this.node) return;
    this.node.port.postMessage(msg);
  }

  addNode(id: number, kind: KindCode) {
    this.post({ op: "addNode", id, kind });
  }

  removeNode(id: number) {
    this.post({ op: "removeNode", id });
  }

  connect(from: number, fromPort: number, to: number, toPort: number) {
    this.post({ op: "connect", from, fromPort, to, toPort });
  }

  disconnect(from: number, fromPort: number, to: number, toPort: number) {
    this.post({ op: "disconnect", from, fromPort, to, toPort });
  }

  setParam(id: number, name: string, value: number) {
    this.post({ op: "setParam", id, name, value });
  }

  noteOn(id: number, note: number, vel = 127) {
    this.post({ op: "noteOn", id, note, vel });
  }

  noteOff(id: number) {
    this.post({ op: "noteOff", id });
  }
}

export const audioEngine = new AudioEngine();
