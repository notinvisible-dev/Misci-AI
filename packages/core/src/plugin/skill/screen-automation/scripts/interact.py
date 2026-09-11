#!/usr/bin/env python3
"""Interact with the screen: click, type, scroll, key press."""
import subprocess
import sys
import json

def run(cmd):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return {"ok": True, "stdout": result.stdout.strip(), "stderr": result.stderr.strip()}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def click(x, y, button="left"):
    btn = {"left": "1", "middle": "2", "right": "3"}.get(button, "1")
    return run(["xdotool", "mousemove", str(x), str(y), "click", btn])

def double_click(x, y):
    return run(["xdotool", "mousemove", str(x), str(y), "click", "--repeat", "2", "1"])

def type_text(text):
    return run(["xdotool", "type", "--clearmodifiers", text])

def key(keys):
    return run(["xdotool", "key", "--clearmodifiers", keys])

def scroll(x, y, direction="down", amount=3):
    btn = {"down": "5", "up": "4"}.get(direction, "5")
    cmds = [["xdotool", "mousemove", str(x), str(y)]]
    for _ in range(amount):
        cmds.append(["xdotool", "click", btn])
    for cmd in cmds:
        r = run(cmd)
        if not r["ok"]:
            return r
    return {"ok": True}

def find_window(name):
    try:
        wid = subprocess.check_output(
            ["xdotool", "search", "--name", name],
            text=True, timeout=5
        ).strip().split("\n")[0]
        return {"ok": True, "wid": wid}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def focus_window(wid):
    return run(["xdotool", "windowactivate", "--sync", str(wid)])

def get_active():
    try:
        wid = subprocess.check_output(["xdotool", "getactivewindow"], text=True, timeout=2).strip()
        name = subprocess.check_output(["xdotool", "getwindowname", wid], text=True, timeout=2).strip()
        return {"ok": True, "wid": wid, "name": name}
    except Exception as e:
        return {"ok": False, "error": str(e)}

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "help"
    
    if action == "click":
        x, y = int(sys.argv[2]), int(sys.argv[3])
        btn = sys.argv[4] if len(sys.argv) > 4 else "left"
        print(json.dumps(click(x, y, btn)))
    elif action == "double-click":
        x, y = int(sys.argv[2]), int(sys.argv[3])
        print(json.dumps(double_click(x, y)))
    elif action == "type":
        print(json.dumps(type_text(sys.argv[2])))
    elif action == "key":
        print(json.dumps(key(sys.argv[2])))
    elif action == "scroll":
        x, y = int(sys.argv[2]), int(sys.argv[3])
        direction = sys.argv[4] if len(sys.argv) > 4 else "down"
        amount = int(sys.argv[5]) if len(sys.argv) > 5 else 3
        print(json.dumps(scroll(x, y, direction, amount)))
    elif action == "find":
        print(json.dumps(find_window(sys.argv[2])))
    elif action == "focus":
        print(json.dumps(focus_window(sys.argv[2])))
    elif action == "active":
        print(json.dumps(get_active()))
    else:
        print(json.dumps({
            "actions": ["click", "double-click", "type", "key", "scroll", "find", "focus", "active"],
            "usage": "interact.py <action> [args...]"
        }))
