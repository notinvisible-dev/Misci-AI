#!/usr/bin/env python3
"""Query the AT-SPI accessibility tree and output UI elements as JSON."""
import subprocess
import json
import sys

def get_tree():
    """Get the accessibility tree using atspi."""
    try:
        import gi
        gi.require_version('Atspi', '2.0')
        from gi.repository import Atspi
        
        def walk(node, depth=0, max_depth=4):
            if depth > max_depth:
                return []
            elements = []
            try:
                role = node.get_role_name()
                name = node.get_name() or ""
                desc = node.get_description() or ""
                states = []
                st = node.get_state_set()
                for s in [Atspi.StateType.FOCUSED, Atspi.StateType.SELECTED, 
                          Atspi.StateType.CHECKED, Atspi.StateType.PRESSED,
                          Atspi.StateType.VISIBLE, Atspi.StateType.ACTIVE,
                          Atspi.StateType.EDITABLE, Atspi.StateType.ENABLED]:
                    if st.contains(s):
                        states.append(Atspi.StateType.get_name(s))
                
                ext = node.get_extents(Atspi.CoordType.SCREEN)
                bounds = {"x": ext.x, "y": ext.y, "width": ext.width, "height": ext.height}
                
                children_count = node.get_child_count()
                
                el = {
                    "role": role,
                    "name": name,
                    "description": desc,
                    "states": states,
                    "bounds": bounds,
                    "children": children_count,
                }
                elements.append(el)
                
                for i in range(children_count):
                    child = node.get_child_at_index(i)
                    if child:
                        elements.extend(walk(child, depth + 1, max_depth))
            except Exception:
                pass
            return elements
        
        desktop = Atspi.get_desktop(0)
        results = []
        for i in range(desktop.get_child_count()):
            app = desktop.get_child_at_index(i)
            if app:
                app_name = app.get_name() or f"app-{i}"
                for j in range(app.get_child_count()):
                    window = app.get_child_at_index(j)
                    if window:
                        win_name = window.get_name() or f"window-{j}"
                        ext = window.get_extents(Atspi.CoordType.SCREEN)
                        elements = walk(window)
                        results.append({
                            "app": app_name,
                            "window": win_name,
                            "bounds": {"x": ext.x, "y": ext.y, "width": ext.width, "height": ext.height},
                            "elements": elements,
                        })
        return results
    except ImportError:
        return get_tree_xdotool()

def get_tree_xdotool():
    """Fallback: use xdotool to list windows and basic info."""
    results = []
    try:
        output = subprocess.check_output(
            ["xdotool", "search", "--name", ""],
            text=True, timeout=5
        ).strip()
        for wid in output.split("\n"):
            if not wid.strip():
                continue
            wid = wid.strip()
            try:
                name = subprocess.check_output(["xdotool", "getwindowname", wid], text=True, timeout=2).strip()
                geom = subprocess.check_output(["xdotool", "getwindowgeometry", "--shell", wid], text=True, timeout=2).strip()
                coords = {}
                for line in geom.split("\n"):
                    if "=" in line:
                        k, v = line.split("=", 1)
                        coords[k.strip()] = int(v.strip())
                results.append({
                    "wid": wid,
                    "name": name,
                    "bounds": {
                        "x": coords.get("X", 0),
                        "y": coords.get("Y", 0),
                        "width": coords.get("WIDTH", 0),
                        "height": coords.get("HEIGHT", 0),
                    }
                })
            except Exception:
                pass
    except Exception as e:
        print(json.dumps({"error": str(e)}))
    return results

if __name__ == "__main__":
    depth = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    tree = get_tree()
    print(json.dumps(tree, indent=2))
