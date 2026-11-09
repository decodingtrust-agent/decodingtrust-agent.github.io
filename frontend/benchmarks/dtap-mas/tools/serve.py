"""Preview the bundled MAS visualizer with Python's standard library."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8200)
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1] / "visualization"
    print(f"Task Explorer: http://{args.host}:{args.port}/tasks.html", flush=True)
    ThreadingHTTPServer((args.host, args.port), partial(SimpleHTTPRequestHandler, directory=str(root))).serve_forever()
