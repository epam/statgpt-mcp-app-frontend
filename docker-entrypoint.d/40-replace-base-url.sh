#!/bin/sh
# Rewrites the build-time placeholder origin in the static widget assets to the
# real origin supplied at runtime via VITE_BASE_URL. The stock nginx entrypoint
# runs every /docker-entrypoint.d/*.sh before nginx starts.
#
# Use sed, not envsubst: minified JS bundles contain `$`, which envsubst
# corrupts. A literal sed over a `$`-free token is safe.
#
# Rewrite all asset files, not only index.html: an absolute Vite `base` stamps
# the origin into JS chunk references and bundled CSS asset URLs as well.
set -eu

PLACEHOLDER="https://VITE_BASE_URL_PLACEHOLDER"
ROOT="/usr/share/nginx/html"

if [ -z "${VITE_BASE_URL:-}" ]; then
  echo "[40-replace-base-url] ERROR: VITE_BASE_URL is not set." >&2
  echo "[40-replace-base-url] Widget assets would 404 in the host iframe. Refusing to start." >&2
  exit 1
fi

# Drop any trailing slash: the placeholder already carries Vite's trailing
# slash (".../PLACEHOLDER/assets"), so a trailing slash here yields "//assets".
TARGET="${VITE_BASE_URL%/}"

echo "[40-replace-base-url] Rewriting ${PLACEHOLDER} -> ${TARGET}"
find "$ROOT" -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) \
  -exec sed -i "s|${PLACEHOLDER}|${TARGET}|g" {} +
echo "[40-replace-base-url] Done."
