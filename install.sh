#!/usr/bin/env bash
set -euo pipefail

# microtaskrr installer
# Usage: curl -fsSL https://raw.githubusercontent.com/YOURNAME/microtask/main/install.sh | bash

REPO="whoisyurii/microtask"
INSTALL_DIR="$HOME/.local/bin"
BINARY_NAME="microtaskrr"
SETTINGS_FILE="$HOME/.claude/settings.json"

echo ""
echo "  ⚡ microtaskrr Installer"
echo "  Mini-games while Claude thinks"
echo ""

# --- 1. Detect platform ---
OS="$(uname -s)"
ARCH="$(uname -m)"

if [ "$OS" != "Darwin" ]; then
  echo "  ✗ Sorry, microtaskrr only supports macOS for now."
  exit 1
fi

if [ "$ARCH" = "arm64" ]; then
  TARGET="aarch64-apple-darwin"
elif [ "$ARCH" = "x86_64" ]; then
  TARGET="x86_64-apple-darwin"
else
  echo "  ✗ Unsupported architecture: $ARCH"
  exit 1
fi

echo "  → Platform: macOS $ARCH"

# --- 2. Download binary ---
echo "  → Fetching latest release..."

LATEST_URL=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
  | grep "browser_download_url.*${TARGET}" \
  | head -1 \
  | cut -d '"' -f 4)

if [ -z "$LATEST_URL" ]; then
  echo "  ✗ Could not find a release for $TARGET."
  echo "  → You can build from source instead:"
  echo "    git clone https://github.com/$REPO && cd microtask"
  echo "    npm install && npx tauri build"
  exit 1
fi

mkdir -p "$INSTALL_DIR"
TMP_FILE=$(mktemp)

echo "  → Downloading $LATEST_URL"
curl -fsSL -o "$TMP_FILE" "$LATEST_URL"
chmod +x "$TMP_FILE"
mv "$TMP_FILE" "$INSTALL_DIR/$BINARY_NAME"

echo "  ✓ Installed to $INSTALL_DIR/$BINARY_NAME"

# --- 3. Patch Claude Code settings ---
echo "  → Configuring Claude Code hooks..."

mkdir -p "$(dirname "$SETTINGS_FILE")"

HOOK_COMMAND="$INSTALL_DIR/$BINARY_NAME show &"

# Create settings file if it doesn't exist
if [ ! -f "$SETTINGS_FILE" ]; then
  echo '{}' > "$SETTINGS_FILE"
fi

# Use python3 (ships with macOS) to safely merge the hook into existing settings
python3 << 'PYEOF'
import json, sys, os

settings_path = os.path.expanduser("~/.claude/settings.json")
bin_path = os.path.expanduser("~/.local/bin/microtaskrr")
hook_cmd = f"{bin_path} show &"

with open(settings_path, "r") as f:
    try:
        settings = json.load(f)
    except json.JSONDecodeError:
        settings = {}

if not isinstance(settings, dict):
    settings = {}

# Ensure hooks structure exists
hooks = settings.setdefault("hooks", {})

# Add UserPromptSubmit hook if not already present
usp = hooks.setdefault("UserPromptSubmit", [])
already_has = any(
    any(h.get("command", "").startswith(bin_path) for h in entry.get("hooks", []))
    for entry in usp
)
if not already_has:
    usp.append({
        "matcher": "",
        "hooks": [{"type": "command", "command": hook_cmd}]
    })

with open(settings_path, "w") as f:
    json.dump(settings, f, indent=2)
    f.write("\n")

print("  ✓ Claude Code hooks configured")
PYEOF

# --- 4. Start the background process ---
# Kill any existing microtaskrr process
pkill -f "$INSTALL_DIR/$BINARY_NAME" 2>/dev/null || true
sleep 0.5

nohup "$INSTALL_DIR/$BINARY_NAME" > /dev/null 2>&1 &

echo "  ✓ microtaskrr is running in the background"
echo ""
echo "  ✅ All done! Start a new Claude Code session and send a prompt."
echo "     A mini-game will pop up while Claude thinks."
echo "     Press Esc to dismiss and return to your terminal."
echo ""
echo "  To uninstall:  bash <(curl -fsSL https://raw.githubusercontent.com/$REPO/main/uninstall.sh)"
echo ""
