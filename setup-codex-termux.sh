#!/data/data/com.termux/files/usr/bin/bash
# =============================================================================
# setup-codex-termux.sh
# Install and configure OpenAI Codex CLI in Termux on Android
#
# Run from your Termux home directory (~):
#   bash ~/TabletTimeTracker/setup-codex-termux.sh
#
# Requirements: OPENAI_API_KEY must be set (see instructions below)
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo "============================================="
echo "  Codex CLI Setup for Termux (Android)"
echo "============================================="
echo ""

# -----------------------------------------------------------------------------
# 1. Verify we are running inside Termux
# -----------------------------------------------------------------------------
if [ ! -d "/data/data/com.termux" ]; then
  error "This script must be run inside Termux on Android."
fi

# Termux home is always /data/data/com.termux/files/home
TERMUX_HOME="/data/data/com.termux/files/home"
if [ "$HOME" != "$TERMUX_HOME" ]; then
  warn "HOME is '$HOME' — expected '$TERMUX_HOME'."
  warn "If npm install fails, cd to $TERMUX_HOME first."
fi

# -----------------------------------------------------------------------------
# 2. Make sure we are NOT in shared storage (/storage/emulated/...)
#    npm/node can't follow symlinks there, so installs break.
# -----------------------------------------------------------------------------
CURRENT_DIR="$(pwd)"
if [[ "$CURRENT_DIR" == /storage/* ]] || [[ "$CURRENT_DIR" == /sdcard* ]]; then
  error "You are in shared storage ($CURRENT_DIR).
  npm install fails here because Android blocks symlinks on shared storage.
  Run this script from your Termux home:
    cd ~
    bash ~/TabletTimeTracker/setup-codex-termux.sh"
fi
success "Working directory is safe: $CURRENT_DIR"

# -----------------------------------------------------------------------------
# 3. Update packages
# -----------------------------------------------------------------------------
info "Updating Termux package list..."
pkg update -y 2>&1 | tail -5 || warn "pkg update had warnings — continuing."

# -----------------------------------------------------------------------------
# 4. Install / verify Node.js
# -----------------------------------------------------------------------------
info "Checking Node.js version..."

# Codex CLI requires Node 22+
REQUIRED_NODE_MAJOR=22

if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  info "Found Node.js v$NODE_VERSION"
else
  NODE_MAJOR=0
  info "Node.js not found."
fi

if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
  info "Installing nodejs (v22+) via pkg..."
  pkg install -y nodejs
  NODE_VERSION=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
    warn "pkg gave Node.js v$NODE_VERSION (< 22). Trying nodejs-lts..."
    pkg install -y nodejs-lts
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  fi
  if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
    error "Node.js v$NODE_VERSION is installed but Codex requires v22+.
  Try manually:  pkg install nodejs
  If pkg only offers an older version, run:
    pkg install ndk-sysroot cmake binutils  # build deps
  Then install nvm for Termux and use it to get v22."
  fi
fi
success "Node.js v$NODE_VERSION — OK"

# -----------------------------------------------------------------------------
# 5. Verify npm
# -----------------------------------------------------------------------------
if ! command -v npm &>/dev/null; then
  info "npm not found — installing..."
  pkg install -y npm
fi
NPM_VERSION=$(npm --version)
success "npm v$NPM_VERSION — OK"

# -----------------------------------------------------------------------------
# 6. Configure npm prefix to stay inside Termux (avoids permission errors)
# -----------------------------------------------------------------------------
NPM_PREFIX="$TERMUX_HOME/.npm-global"
mkdir -p "$NPM_PREFIX"
npm config set prefix "$NPM_PREFIX"

# Add npm global bin to PATH if not already there
PROFILE_FILE="$TERMUX_HOME/.bashrc"
if ! grep -q "npm-global/bin" "$PROFILE_FILE" 2>/dev/null; then
  echo '' >> "$PROFILE_FILE"
  echo '# npm global bin (added by setup-codex-termux.sh)' >> "$PROFILE_FILE"
  echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> "$PROFILE_FILE"
  info "Added npm global bin to PATH in $PROFILE_FILE"
fi
export PATH="$NPM_PREFIX/bin:$PATH"
success "npm prefix set to $NPM_PREFIX"

# -----------------------------------------------------------------------------
# 7. Install Codex CLI (Termux ARM64 community port)
# -----------------------------------------------------------------------------
# The official @openai/codex package requires @openai/codex-linux-arm64,
# which is NOT published to npm and does not support Android/Termux.
# @mmmbuto/codex-cli-termux is a community port compiled natively for
# Android ARM64 (aarch64) and tracks official Codex releases closely.
# Source: https://github.com/alexzeitgeist/codex-termux
info "Installing @mmmbuto/codex-cli-termux (Android ARM64 port)..."
npm install -g @mmmbuto/codex-cli-termux

if ! command -v codex &>/dev/null; then
  error "codex binary not found after install.
  Your PATH may not include $NPM_PREFIX/bin yet.
  Run:  source ~/.bashrc
  Then: codex --version"
fi

CODEX_VERSION=$(codex --version 2>/dev/null || echo "unknown")
success "Codex CLI installed: $CODEX_VERSION"

# -----------------------------------------------------------------------------
# 8. Check for OPENAI_API_KEY
# -----------------------------------------------------------------------------
echo ""
if [ -n "$OPENAI_API_KEY" ]; then
  success "OPENAI_API_KEY is set in the current environment."
else
  warn "OPENAI_API_KEY is not set."
  echo ""
  echo "  To fix, add this to your ~/.bashrc:"
  echo "    export OPENAI_API_KEY=\"sk-...your-key-here...\""
  echo ""
  echo "  Get your key at: https://platform.openai.com/api-keys"
  echo ""
  echo "  Then reload:  source ~/.bashrc"
fi

# Optionally persist it now if passed as arg
if [ -n "$1" ]; then
  warn "Storing OPENAI_API_KEY from argument into ~/.bashrc ..."
  if grep -q "OPENAI_API_KEY" "$PROFILE_FILE" 2>/dev/null; then
    sed -i "s|^export OPENAI_API_KEY=.*|export OPENAI_API_KEY=\"$1\"|" "$PROFILE_FILE"
  else
    echo "export OPENAI_API_KEY=\"$1\"" >> "$PROFILE_FILE"
  fi
  success "Key saved to $PROFILE_FILE"
fi

# -----------------------------------------------------------------------------
# 9. Write ~/.codex/config.toml
# -----------------------------------------------------------------------------
CODEX_CONFIG_DIR="$TERMUX_HOME/.codex"
CODEX_CONFIG="$CODEX_CONFIG_DIR/config.toml"
mkdir -p "$CODEX_CONFIG_DIR"

if [ ! -f "$CODEX_CONFIG" ]; then
  info "Writing default ~/.codex/config.toml..."
  cat > "$CODEX_CONFIG" << 'TOML_EOF'
# Codex CLI config — ~/.codex/config.toml
# Docs: https://github.com/openai/codex

model = "o4-mini"

[approval]
# "on-failure"  = ask only when a command fails
# "on-request"  = model decides when to ask
# "never"       = fully automatic (use with care)
policy = "on-failure"

[sandbox]
# "read-only"   = model can read but not write files without approval
# "workspace"   = full read/write within the working directory
policy = "workspace"

[shell_environment_policy]
# Inherit your current shell environment (PATH, etc.)
inherit = "all"
TOML_EOF
  success "Created $CODEX_CONFIG"
else
  success "$CODEX_CONFIG already exists — skipping"
fi

# -----------------------------------------------------------------------------
# 10. Project-level Codex config
# -----------------------------------------------------------------------------
info "Checking for Codex project config (AGENTS.md)..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_FILE="$SCRIPT_DIR/AGENTS.md"

if [ ! -f "$AGENTS_FILE" ]; then
  info "Creating AGENTS.md with project context for Codex..."
  cat > "$AGENTS_FILE" << 'AGENTS_EOF'
# TabletTimeTracker — Codex Agent Instructions

## Project
React 19 + TypeScript PWA for tracking kids' screen-time as a currency.
Firebase (Auth + Firestore) backend. Vite build system. Tailwind CSS.

## Key Constraints
- **Build location**: Run `npm install` and `npm run build` only from `~/TabletTimeTracker`
  (shared storage at `/storage/emulated/0/...` blocks symlinks — npm fails there)
- **minify: false** and **workbox.mode: 'development'** in vite.config.ts — Terser hangs on Android, do not change without testing
- Node 22+ required

## Code Style
- TypeScript strict mode
- Functional React components with hooks only
- Firestore hooks in `src/hooks/`, pages in `src/pages/`, shared UI in `src/components/`
- No class components

## Current Work
See `IMPLEMENTATION_PLAN.md` for the full task list and work order.
Start from the first unchecked item.

## Test
`npm run build` must succeed without TypeScript errors.
`npm run lint` must pass.
AGENTS_EOF
  success "Created AGENTS.md"
else
  success "AGENTS.md already exists"
fi

# -----------------------------------------------------------------------------
# 11. Summary
# -----------------------------------------------------------------------------
echo ""
echo "============================================="
echo "  Setup complete!"
echo "============================================="
echo ""
echo "  Reload your shell:    source ~/.bashrc"
echo ""
echo "  NOTE: Uses @mmmbuto/codex-cli-termux (community ARM64 port of Codex)"
echo "  The official @openai/codex does NOT support Android/Termux."
echo ""
echo "  Run Codex in the project:"
echo "    cd ~/TabletTimeTracker"
echo "    codex"
echo ""
echo "  Codex will read AGENTS.md for project context."
echo ""
echo "  Non-interactive one-shot usage:"
echo "    codex exec \"describe what this file does: src/hooks/useFamily.ts\""
echo ""
echo "  If 'codex' is not found after reloading, check:"
echo "    echo \$PATH"
echo "    ls ~/.npm-global/bin/"
echo ""
echo "  Config file: ~/.codex/config.toml"
echo ""
