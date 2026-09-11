---
name: screen-automation
description: "Use when the user asks you to interact with their desktop, click buttons, open apps, navigate menus, or perform any GUI action on their screen. Triggers on phrases like 'click the', 'open', 'press', 'type in', 'scroll to', 'find the button', 'interact with', 'do it for me'."
---

# Screen Automation

Use this skill when the user asks you to interact with their desktop, click buttons, open apps, navigate menus, or perform any GUI action on their screen. Triggers on phrases like "click the", "open", "press", "type in", "scroll to", "find the button", "interact with", "do it for me".

Do NOT use for: code editing, terminal commands, file operations that don't involve the GUI, or tasks Misci can do internally.

## IMPORTANT

You have access to a shell and can execute commands. You CAN interact with the user's screen. Use your shell tool to run the scripts below. Do NOT say you cannot access the GUI — you can, through these scripts.

## How it works

Misci can see and interact with the user's screen through accessibility APIs and input simulation. The workflow is:

1. **See** — Query the accessibility tree to find UI elements
2. **Act** — Click, type, scroll, or press keys to interact
3. **Verify** — Re-query the tree or take a screenshot to confirm the action worked

## Scripts

All scripts are Python 3 and use `xdotool` (required) and optionally AT-SPI for the accessibility tree.

### tree.py — See the screen

Query the accessibility tree to list all visible UI elements with their names, roles, positions, and states.

```bash
python3 <skill_dir>/scripts/tree.py [max_depth]
```

- `max_depth` (optional, default 4): How deep to traverse the tree. Use 2 for quick overview, 6 for detailed.
- Returns JSON array of windows, each containing elements with: `role`, `name`, `description`, `states`, `bounds` (x, y, width, height), `children`
- Falls back to `xdotool` window listing if AT-SPI is unavailable

### interact.py — Click, type, scroll

```bash
python3 <skill_dir>/scripts/interact.py click <x> <y> [button]
python3 <skill_dir>/scripts/interact.py double-click <x> <y>
python3 <skill_dir>/scripts/interact.py type "<text>"
python3 <skill_dir>/scripts/interact.py key "<keys>"
python3 <skill_dir>/scripts/interact.py scroll <x> <y> [direction] [amount]
python3 <skill_dir>/scripts/interact.py find "<window_name>"
python3 <skill_dir>/scripts/interact.py focus <window_id>
python3 <skill_dir>/scripts/interact.py active
```

- `button`: `left` (default), `middle`, or `right`
- `direction`: `down` (default) or `up`
- `amount`: number of scroll ticks (default 3)
- `keys`: xdotool key syntax, e.g. `Return`, `ctrl+c`, `alt+Tab`, `super`
- `find` returns the window ID for a window matching the name
- `active` returns the currently focused window

### screenshot.py — Visual fallback

Take a screenshot when the accessibility tree doesn't have enough info (custom drawn UI, tray icons, etc).

```bash
python3 <skill_dir>/scripts/screenshot.py [x y width height] [output_path]
```

- Without args: screenshots the full screen
- With region: screenshots only that area
- Returns JSON with the file path
- Requires `imagemagick` (import) or `scrot`

## Workflow

1. Run `tree.py` to see what's on screen
2. Find the element the user wants to interact with by name, role, or position
3. Use `interact.py` to perform the action
4. Run `tree.py` again or take a screenshot to verify
5. If the element wasn't found, try a deeper tree scan or screenshot

## Tips

- If AT-SPI tree is empty, the desktop environment may need accessibility enabled. Check `gsettings get org.gnome.desktop.interface toolkit-accessibility`
- For tray icons, AT-SPI may not work — use screenshot as fallback
- Always verify actions succeeded by re-querying the tree
- Use `find` + `focus` to bring a window to the front before interacting
- Key combos: `super` opens app launcher, `alt+Tab` switches windows, `ctrl+alt+t` opens terminal on many systems
