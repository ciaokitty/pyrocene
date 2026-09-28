"""Serve the film gallery: the page from this repo, the films from wherever.

    python3 -m stage2.films.serve                 # :8022
    python3 -m stage2.films.serve --port 9000 --assets /some/other/drive

The masters are hundreds of megabytes and live outside the repo. The page that
indexes them is source and belongs with the code, so it is kept here and served
from here. Anything the page asks for that is not the page itself is read from
the asset root, which can sit on any disk.
"""
from __future__ import annotations
import argparse
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.environ.get("PYROCENE_FILMS", "/mnt/seagate/videos/pyrocene")


class Handler(SimpleHTTPRequestHandler):
    """Two roots. The page comes from the repo, everything else from the drive."""

    def translate_path(self, path: str) -> str:
        rel = path.split("?", 1)[0].split("#", 1)[0].lstrip("/")
        if rel in ("", "index.html"):
            return os.path.join(HERE, "index.html")
        # Resolve inside the asset root and refuse anything that climbs out.
        full = os.path.realpath(os.path.join(self.server.assets, rel))
        root = os.path.realpath(self.server.assets)
        if full != root and not full.startswith(root + os.sep):
            return os.path.join(HERE, "index.html")
        return full

    def log_message(self, fmt, *args):     # quiet; the launcher owns the console
        pass


def main():
    ap = argparse.ArgumentParser(description="the Pyrocene film gallery")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=int(os.environ.get("PYROCENE_FILMS_PORT", "8022")))
    ap.add_argument("--assets", default=ASSETS, help="where the films live")
    args = ap.parse_args()

    if not os.path.isdir(args.assets):
        print(f"films: no asset directory at {args.assets}")
        print("films: set PYROCENE_FILMS or pass --assets. The page will still")
        print("       load but every film on it will be missing.")

    try:
        srv = ThreadingHTTPServer((args.host, args.port), Handler)
    except OSError as e:
        print(f"films: cannot start on {args.host}:{args.port}: {e.strerror or e}")
        sys.exit(1)
    srv.assets = args.assets
    srv.daemon_threads = True
    print(f"films  page {HERE}/index.html   assets {args.assets}")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
