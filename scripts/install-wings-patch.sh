#!/usr/bin/env bash
set -euo pipefail

# Wings patch installer for Modpack Manager (optional)
# Applies wings.patch and rebuilds wings binary on a node.

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "[INFO] Running without root; some steps may require sudo." >&2
fi

info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERR ]\033[0m $*"; }

# Ensure prerequisites
info "Installing Go and make (Debian/Ubuntu)"
ARCH=$([ "$(uname -m)" = "x86_64" ] && echo "amd64" || echo "arm64")
wget -q "https://go.dev/dl/go1.23.3.linux-$ARCH.tar.gz"
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf "go1.23.3.linux-$ARCH.tar.gz"
echo 'export PATH=$PATH:/usr/local/go/bin' | sudo tee -a /etc/profile >/dev/null
. /etc/profile
sudo apt-get update -y && sudo apt-get install -y make git

# Clone wings
WORKDIR="/tmp/wings-src-$(date +%s)"
info "Cloning Pterodactyl Wings source into $WORKDIR"
rm -rf "$WORKDIR" && mkdir -p "$WORKDIR"
cd "$WORKDIR"
git clone https://github.com/pterodactyl/wings.git
cd wings

# Copy patch
PATCH_SOURCE="$(cd "$(dirname "$0")"/.. && pwd)/addons/Modpack-Manager/wings.patch"
if [[ ! -f "$PATCH_SOURCE" ]]; then
  err "wings.patch not found at $PATCH_SOURCE"
  exit 1
fi
cp "$PATCH_SOURCE" ./wings.patch

# Apply and build
info "Applying wings.patch"
git apply wings.patch
info "Building wings binaries"
make build

# Install binary
BIN_OUT="build/wings_linux_amd64"
if [[ ! -f "$BIN_OUT" ]]; then
  BIN_OUT="build/wings_linux_arm64"
fi
if [[ ! -f "$BIN_OUT" ]]; then
  err "Built binary not found."
  exit 1
fi

info "Stopping wings service"
sudo systemctl stop wings || warn "Could not stop wings; continuing"
info "Installing patched wings binary"
sudo cp "$BIN_OUT" /usr/local/bin/wings
sudo chmod +x /usr/local/bin/wings
info "Starting wings service"
sudo systemctl start wings || warn "Could not start wings; please start manually"

info "Wings patch installation complete."