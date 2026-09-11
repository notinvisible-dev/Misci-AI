#!/usr/bin/env python3
"""Take a screenshot of the screen or a specific region."""
import subprocess
import sys
import json
import os
import tempfile

def screenshot(region=None, output=None):
    """Take a screenshot. Returns the file path."""
    if not output:
        output = os.path.join(tempfile.gettempdir(), "misci-screenshot.png")
    
    try:
        if region:
            x, y, w, h = region
            cmd = ["import", "-window", "root", "-crop", f"{w}x{h}+{x}+{y}", output]
        else:
            cmd = ["import", "-window", "root", output]
        subprocess.run(cmd, capture_output=True, timeout=10, check=True)
        return {"ok": True, "path": output}
    except FileNotFoundError:
        # Try scrot as fallback
        try:
            if region:
                x, y, w, h = region
                cmd = ["scrot", "-a", str(x), str(y), str(w), str(h), output]
            else:
                cmd = ["scrot", output]
            subprocess.run(cmd, capture_output=True, timeout=10, check=True)
            return {"ok": True, "path": output}
        except Exception as e:
            return {"ok": False, "error": f"No screenshot tool available. Install imagemagick or scrot. Error: {e}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

if __name__ == "__main__":
    region = None
    output = None
    
    if len(sys.argv) > 3:
        x, y, w, h = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
        region = (x, y, w, h)
        if len(sys.argv) > 5:
            output = sys.argv[5]
    elif len(sys.argv) > 1:
        output = sys.argv[1]
    
    print(json.dumps(screenshot(region, output)))
