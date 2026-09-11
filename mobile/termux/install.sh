#!/data/data/com.termux/files/usr/bin/bash
# Misci server installer for Termux (Android)
# Installs Bun (official Android build) and the Misci server, then starts it.
set -e

PORT="${PORT:-6299}"

echo "==> Misci installer for Termux"
ARCH="$(uname -m)"
case "$ARCH" in
  aarch64) ARCH="aarch64" ;;
  x86_64)  ARCH="x86_64" ;;
  *) echo "Unsupported architecture: $ARCH (need aarch64 or x86_64)"; exit 1 ;;
esac
echo "==> Architecture: $ARCH"

# --- Install base packages ---
echo "==> Updating packages…"
pkg update -y
pkg install -y curl git unzip nodejs-lts 2>/dev/null || pkg install -y curl git unzip

# --- Install Bun (official Android build) ---
if ! command -v bun >/dev/null 2>&1; then
  echo "==> Installing Bun for Android ($ARCH)…"
  case "$ARCH" in
    aarch64) BUN_URL="https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-aarch64-android.zip" ;;
    x86_64)  BUN_URL="https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-android.zip" ;;
  esac
  mkdir -p "$PREFIX/bin"
  curl -fsSL "$BUN_URL" -o /tmp/bun.zip
  unzip -o /tmp/bun.zip -d /tmp/bun-extract
  cp /tmp/bun-extract/bun-linux-*-android/bun "$PREFIX/bin/bun"
  chmod +x "$PREFIX/bin/bun"
  rm -rf /tmp/bun.zip /tmp/bun-extract
fi
echo "==> Bun: $(bun --version)"

# --- Install / update the Misci server ---
MISCI_DIR="${MISCI_DIR:-$HOME/misci-server}"
echo "==> Installing Misci server into $MISCI_DIR"
mkdir -p "$MISCI_DIR"
if [ ! -f "$MISCI_DIR/package.json" ]; then
  cd "$MISCI_DIR"
  echo '{"name":"misci-server","private":true,"type":"module"}' > package.json
fi

cd "$MISCI_DIR"
# Native modules (node-pty, photon) may need rebuild for android; best-effort
if [ -f "package.json" ] && grep -q node-pty package.json; then
  echo "==> Rebuilding native modules for Android…"
  bun install --ignore-scripts 2>/dev/null || bun install
fi

# --- Start the server ---
echo "==> Starting Misci server on port $PORT…"
echo "    Keep this terminal open. Leave it running in the background."
PORT="$PORT" bun "$MISCI_DIR/main.ts" &
echo "==> Misci server started (PID $!)."
