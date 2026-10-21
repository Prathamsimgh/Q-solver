#!/usr/bin/env bash
# Q-Solver setup script.
# Installs frontend dependencies and Go modules, installs the Wails CLI if
# missing, and prepares the config file. Run from anywhere; it cds to the
# repo root. Works on Linux/macOS and on Windows via Git Bash.

set -e

cd "$(dirname "$0")"

echo "==> Checking prerequisites..."
command -v go >/dev/null 2>&1 || { echo "Go not found. Install Go v1.21+ from https://go.dev/dl/"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js not found. Install Node.js v18+ from https://nodejs.org/"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm not found. It ships with Node.js - reinstall Node.js."; exit 1; }
echo "    Go:   $(go version)"
echo "    Node: $(node --version)"
echo "    Note: on Windows, MinGW (GCC) is also required for CGO builds - see README > Prerequisites."

echo "==> Installing Wails CLI (if missing)..."
if command -v wails >/dev/null 2>&1; then
  echo "    Wails CLI already installed."
else
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  echo "    Wails CLI installed. Make sure $(go env GOPATH)/bin is on your PATH."
fi

echo "==> Installing frontend dependencies..."
(cd frontend && npm install)

echo "==> Downloading Go modules..."
go mod download

echo "==> Preparing config..."
if [ -f config/config.json ]; then
  echo "    config/config.json already exists, leaving it as is."
else
  cp config/config.example.json config/config.json
  echo "    Created config/config.json from the example - add your API key there, or set it later in the app's settings UI."
fi

echo ""
echo "Done. Next steps:"
echo "  wails dev     # development mode (hot reload)"
echo "  wails build   # production build into build/bin/"
