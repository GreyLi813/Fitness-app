#!/usr/bin/env bash
set -euo pipefail

PORT=${PORT:-8000}
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="${ROOT_DIR}/docs"
if [[ ! -d "$WEB_DIR" ]]; then
  WEB_DIR="${ROOT_DIR}/web"
fi
MODE=${1:-}

if [[ ! -d "$WEB_DIR" ]]; then
  echo "web directory not found at $WEB_DIR" >&2
  exit 1
fi

cd "$WEB_DIR"

echo "Starting web server at http://127.0.0.1:$PORT"

echo "Press Ctrl+C to stop."

if [[ "$MODE" == "--once" ]]; then
  python -m http.server "$PORT" >/dev/null 2>&1 &
  SERVER_PID=$!
  sleep 2
  kill "$SERVER_PID" >/dev/null 2>&1 || true
  echo "Server stopped."
else
  python -m http.server "$PORT"
fi
