# microtaskrr

Mini-games that pop up while Claude Code thinks. Typing tests, math problems, snake, and reaction games — stay sharp during those 5-60 second waits.

Built with Tauri v2. macOS only (for now).

![example1](assets/example1.gif)
![example2](assets/example2.gif)
![example3](assets/example3.gif)
![example4](assets/example4.gif)

## Install (one command)

```bash
curl -fsSL https://raw.githubusercontent.com/whoisyurii/microtask/main/install.sh | bash
```

This will:
- Download the latest binary for your Mac (Apple Silicon or Intel)
- Install it to `~/.local/bin/microtaskrr`
- Add the Claude Code hook to `~/.claude/settings.json`
- Start the background process

**That's it.** Open a new Claude Code session, send a prompt, and a game appears.

Press **Esc** to dismiss and return to your terminal.

## Build from source

Requires [Rust](https://rustup.rs) and [Node.js](https://nodejs.org) 18+.

```bash
git clone https://github.com/whoisyurii/microtask.git && cd microtask
npm install
npm run build
cd src-tauri && cargo build --release && cd ..
```

Then install:

```bash
mkdir -p ~/.local/bin
cp src-tauri/target/release/microtaskrr ~/.local/bin/microtaskrr
```

And add the hook to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.local/bin/microtaskrr show &"
          }
        ]
      }
    ]
  }
}
```

Start the background process:

```bash
~/.local/bin/microtaskrr &
```

## Games

| Game | What it does |
|------|-------------|
| Typing Test | Monkeytype-style — type words, see your WPM and accuracy |
| Math | Mental arithmetic — addition, subtraction, multiplication, division |
| Snake | Classic snake on a canvas — arrow keys or WASD |
| Reaction | Wait for green, click as fast as you can |

A random game is picked each time (never the same one twice in a row). Stats persist across sessions.

## How it works

```
Claude Code CLI                    microtaskrr (Tauri app)
     |                                  |
     | UserPromptSubmit hook            |
     |--- microtaskrr show ----------->| show window, start random game
     |                                  |
     | (Claude thinking...)             | (user plays game)
     |                                  |
     |                                  | user presses Esc
     |                                  | hide window, restore focus to terminal
```

- Tauri v2 app with system tray, persistent background process
- Single-instance plugin forwards CLI args (`show`/`hide`) to the running process
- Claude Code hook triggers `show` on every prompt submission
- User dismisses with **Esc** when done (focus returns to terminal automatically)

## Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/whoisyurii/microtask/main/uninstall.sh | bash
```

Or manually:

```bash
pkill -f microtaskrr
rm ~/.local/bin/microtaskrr
# Remove the UserPromptSubmit hook from ~/.claude/settings.json
```

## License

MIT
