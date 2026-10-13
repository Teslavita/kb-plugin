#!/bin/sh
# Sets the plugin version in every place that carries it, then checks that they all agree.
# The knowledge base compares the X-Teslavita-Plugin header the plugin sends with the version in
# .claude-plugin/plugin.json: a place left behind makes every answer say "update available" to people
# who are up to date (0.5.1 shipped with 0.5.0 in four of the five places).
# Usage: scripts/set-version.sh [x.y.z]   (without a version it only checks)
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
p="$root/plugins/teslavita-kb"
v=${1:-}

if [ -n "$v" ]; then
  if ! echo "$v" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo "version looks like 0.5.2, got: $v" >&2
    exit 2
  fi
  sed -i.bak "s/\(\"version\": *\"\)[^\"]*\"/\1$v\"/" "$p/.claude-plugin/plugin.json" "$p/.codex-plugin/plugin.json"
  sed -i.bak "s/\(\"X-Teslavita-Plugin\": *\"\)[^\"]*\"/\1$v\"/g" "$p/.mcp.json"
  sed -i.bak "s/^plugin=.*/plugin=$v/" "$p/bin/kb-headers"
  find "$p" -name '*.bak' -delete
fi

found=$(
  sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$p/.claude-plugin/plugin.json" "$p/.codex-plugin/plugin.json"
  sed -n 's/.*"X-Teslavita-Plugin": *"\([^"]*\)".*/\1/p' "$p/.mcp.json"
  sed -n 's/^plugin=//p' "$p/bin/kb-headers"
)
# five places: two manifests, two headers in .mcp.json, kb-headers
if [ "$(echo "$found" | wc -l)" -ne 5 ] || [ "$(echo "$found" | sort -u | wc -l)" -ne 1 ]; then
  echo "the version is not the same everywhere:" >&2
  echo "$found" | sed 's/^/  /' >&2
  exit 1
fi
echo "version $(echo "$found" | sort -u) in all 5 places"
