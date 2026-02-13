#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="$HOME/.local/bin"
BINARY_NAME="microtaskrr"
SETTINGS_FILE="$HOME/.claude/settings.json"

echo ""
echo "  ⚡ microtaskrr Uninstaller"
echo ""

# Kill running process
pkill -f "$INSTALL_DIR/$BINARY_NAME" 2>/dev/null || true
echo "  ✓ Stopped microtaskrr process"

# Remove binary
rm -f "$INSTALL_DIR/$BINARY_NAME"
echo "  ✓ Removed $INSTALL_DIR/$BINARY_NAME"

# Remove hook from Claude settings
if [ -f "$SETTINGS_FILE" ]; then
  python3 << 'PYEOF'
import json, os

settings_path = os.path.expanduser("~/.claude/settings.json")
bin_path = os.path.expanduser("~/.local/bin/microtaskrr")

with open(settings_path, "r") as f:
    try:
        settings = json.load(f)
    except json.JSONDecodeError:
        settings = {}

hooks = settings.get("hooks", {})

# Remove entries that reference microtaskrr from all hook events
for event in ["UserPromptSubmit", "PreCompact", "Stop"]:
    entries = hooks.get(event, [])
    hooks[event] = [
        entry for entry in entries
        if not any(bin_path in h.get("command", "") for h in entry.get("hooks", []))
    ]
    if not hooks[event]:
        del hooks[event]

if not hooks:
    del settings["hooks"]

with open(settings_path, "w") as f:
    json.dump(settings, f, indent=2)
    f.write("\n")

print("  ✓ Removed Claude Code hooks")
PYEOF
fi

echo ""
echo "  ✅ microtaskrr has been uninstalled."
echo ""
