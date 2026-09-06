# Adding a new DSP module

The module catalogue (kind codes, port labels, colors, parameters) is owned by
the **rust-dsp** crate and shipped to this repo as `pkg/module-registry.json`.
The UI palette builds itself from that file, so a new DSP module needs almost no
TypeScript changes — the work is Rust-side, then rebuilding the wasm pkg.

Two repos are involved:

- `rust-dsp` — DSP logic + wasm pkg + registry generation.
- `rust-dsp-web` (this repo) — React UI that consumes the pkg.

## 1. Rust side — `rust-dsp`

Pick a new kind code. Existing codes are `0,1,2,3,4,5,7,8,9`; use `6` (or `10+`).
Kind codes must stay stable once shipped (they cross the wasm boundary as raw
`u32`).

Edit `web/src/graph.rs`:

1. **`Kind` enum** (`graph.rs:15`) — add the variant with its code, e.g.
   `Lfo = 6`.
2. **`from_u8`** (`graph.rs:28`) — add the reverse mapping so the wasm
   `add_node` can resolve the code.
3. **`inputs()` / `outputs()`** (`graph.rs:43`, `graph.rs:57`) — port labels
   for the node (e.g. `&["signal"]`). An empty array renders no ports.
4. **`Params`** — if the module is tunable, add a field to the `Params` struct
   (`graph.rs:74`), give it a default in `Params::default_for` (`graph.rs:89`),
   handle the setter in the `set_param` match (`graph.rs:247`), and read it in
   `process`.
5. **`process`** (`graph.rs:171`) — add the DSP branch. Stateless kinds (Vca,
   Mixer, Constant, Out, Midi) can just mix/sum inputs; stateful ones (Osc,
   Adsr, Filter, Distortion) wrap a `dsp` crate engine behind `NodeDsp`
   (`graph.rs:111`) and need `Node::new` to build it.

Edit `web/src/registry.rs` (this drives the UI):

1. **`color()`** (`registry.rs:26`) — palette/canvas accent color.
2. **`label()`** (`registry.rs:101`) — display name in the palette.
3. **`params()`** (`registry.rs:85`) — `ParamSpec`s (`name`, `label`, `min`,
   `max`, `step`, `default`), or `EMPTY`.
4. **`palette_order()`** (`registry.rs:41`) — add the kind where it should
   appear in the palette. Omitting it keeps the module out of the palette (but
   it stays reachable from saved patches).

Rust `match` statements are exhaustive — the compiler will point out every
site you missed.

## 2. Build, test, verify

```bash
cd rust_dsp/web
cargo test                      # incl. registry_is_valid_json
./scripts/build-dsp.sh --release
python3 -m json.tool pkg/module-registry.json | grep <YourKindCode>
```

`build-dsp.sh` regenerates `pkg/module-registry.json` and the wasm bundle in
`web/pkg/`.

## 3. Ship the pkg to the UI repo

```bash
cp -R /path/to/rust_dsp/web/pkg /path/to/rust_dsp_web/pkg
cd /path/to/rust_dsp_web
npm run build                   # also regenerates dist/pkg
npm run dev                     # dev server reads pkg/ at runtime
```

The new module appears in the palette automatically. Hard-refresh the browser
(wasm is fetched cache-busted, but a refresh avoids stale module state).

No TS change is needed for the **palette**. Only add a constant to the `Kind`
object in `src/audio/nodeSpec.ts` (`nodeSpec.ts:40`) if app code needs to
reference the new module by name (like the default patch does).

## 4. Release & deploy (production only)

Local copies of `pkg/` are gitignored; Netlify downloads the pkg from a pinned
rust-dsp GitHub release.

1. Tag a new release on **rust-dsp** (`web-vX.Y.Z`). Its release workflow runs
   `build-dsp.sh --release` and attaches `rust-dsp-pkg.tar.gz`.
2. Bump `DSP_VERSION` in `netlify.toml` (`netlify.toml:11`) to the new tag, or
   set the `DSP_VERSION` build env; `scripts/fetch-dsp.sh` downloads it.
3. Push — Netlify rebuilds with the new module.

## Checklist

- [ ] `Kind` variant + code added (`graph.rs`)
- [ ] `from_u8`, `inputs`, `outputs` updated (`graph.rs`)
- [ ] `Params` field + `default_for` + `set_param` + `process` branch (`graph.rs`)
- [ ] `color`, `label`, `params`, `palette_order` updated (`registry.rs`)
- [ ] `cargo test` passes in the web crate
- [ ] `build-dsp.sh --release` regenerated `module-registry.json`
- [ ] pkg copied into this repo's `pkg/`
- [ ] `Kind` constant added to `nodeSpec.ts` (only if referenced by code)
- [ ] `DSP_VERSION` bumped for production deploys