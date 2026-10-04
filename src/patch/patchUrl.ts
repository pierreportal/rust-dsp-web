// The patch lives entirely in the location hash: `#p=<base64url>`.
// Nothing is sent anywhere, so a link is the only storage format we need —
// bookmark it, send it to a friend, and their browser rebuilds the graph on
// load. `replaceState` keeps the Back button meaningful (the app never
// reloads on navigation).

const PATCH_HASH_PREFIX = "p=";

export function readPatchHash(): string | null {
  const hash = window.location.hash.slice(1);
  const code = hash.startsWith(PATCH_HASH_PREFIX) ? hash.slice(PATCH_HASH_PREFIX.length) : hash;
  return code.length > 0 ? code : null;
}

export function writePatchHash(code: string): string {
  const url = `${window.location.pathname}${window.location.search}#${PATCH_HASH_PREFIX}${code}`;
  window.history.replaceState(window.history.state, "", url);
  return window.location.href;
}