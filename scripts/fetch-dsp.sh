#!/usr/bin/env bash
#
# Downloads the rust-dsp WebAssembly bundle + module-registry.json from a
# GitHub release of the rust-dsp repo and unpacks it into ./pkg.
#
# The rust-dsp repo publishes a `rust-dsp-pkg.tar.gz` artifact on every
# `web-v*` tag via its "Release web DSP" workflow. This repo builds against a
# pinned tag so users get the module set you ship.
#
# Usage:
#   DSP_VERSION=web-v0.2.0 ./scripts/fetch-dsp.sh   # pinned tag
#   ./scripts/fetch-dsp.sh web-v0.2.0               # positional arg
#   ./scripts/fetch-dsp.sh                          # defaults to: latest release
#
# Repo to pull from (override for forks):
#   DSP_REPO=pierreportal/rust-dsp
set -euo pipefail

REPO="${DSP_REPO:-pierreportal/rust-dsp}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG_DIR="$ROOT/pkg"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

VERSION="${1:-${DSP_VERSION:-latest}}"

if [[ "$VERSION" == "latest" ]]; then
  API_URI="repos/$REPO/releases/latest"
else
  API_URI="repos/$REPO/releases/tags/$VERSION"
fi

echo "==> Resolving release $VERSION from $REPO"
ASSET_URL="$(curl -sSL "https://api.github.com/$API_URI" \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(next(a["browser_download_url"] for a in d.get("assets",[]) if a["name"]=="rust-dsp-pkg.tar.gz"))' \
  || { echo "ERROR: could not find rust-dsp-pkg.tar.gz on $VERSION" >&2; exit 1; })"

echo "==> Downloading $ASSET_URL"
curl -sSL "$ASSET_URL" -o "$TMP/pkg.tar.gz"

echo "==> Extracting into $PKG_DIR"
rm -rf "$PKG_DIR"
mkdir -p "$PKG_DIR"
tar xzf "$TMP/pkg.tar.gz" -C "$PKG_DIR"

echo "==> Done:"
ls -lh "$PKG_DIR"
