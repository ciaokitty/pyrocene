#!/usr/bin/env python3
"""Prerender the replay to an MP4, frame by frame, on this machine's GPU.

    python3 tools/record.py --log sample-game.json --out /mnt/seagate/videos/pyrocene/sample.mp4
    python3 tools/record.py --log game-....json --fps 30 --size 1920x1080 --quality high

Drives the page in headless Chromium (needs the stage 2 server running on
:8020, and python playwright + imageio-ffmpeg), asks it for one frame at a
time with a fixed time step, and pipes the frames to ffmpeg. The page is a
pure function of time, so the result is exactly the replay, just smooth.
"""
import argparse, os, subprocess, sys, time
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("--log", default="sample-game.json")
ap.add_argument("--out", default="/mnt/seagate/videos/pyrocene/replay.mp4")
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--size", default="1920x1080")
ap.add_argument("--quality", default="high")
ap.add_argument("--server", default="http://localhost:8020")
ap.add_argument("--start", type=float, default=0.0)
ap.add_argument("--end", type=float, default=None, help="seconds; default the whole replay")
ap.add_argument("--crf", type=int, default=18)
args = ap.parse_args()

try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG = "ffmpeg"
w, h = [int(x) for x in args.size.split("x")]
url = f"{args.server}/simulation/claude/?log={args.log}&quality={args.quality}"
os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=gl-egl", "--enable-gpu", "--ignore-gpu-blocklist", "--hide-scrollbars"])
    pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(url, wait_until="networkidle")
    pg.wait_for_timeout(1500)
    pg.evaluate("document.getElementById('start').hidden = true; document.getElementById('ctl').style.display = 'none'; window.__pyro.player.pause(); window.__pyro.player.recording = true")
    D = pg.evaluate("window.__pyro.player.duration")
    end = min(D, args.end) if args.end else D
    n = int((end - args.start) * args.fps)
    print(f"{args.log}: {D:.1f}s replay, {n} frames at {args.fps} fps, {w}x{h} -> {args.out}", flush=True)
    ff = subprocess.Popen([FFMPEG, "-y", "-loglevel", "error", "-f", "image2pipe", "-vcodec", "mjpeg", "-framerate", str(args.fps), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", str(args.crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", args.out], stdin=subprocess.PIPE)
    t0 = time.time()
    # settle particles and fades on the first frame
    for _ in range(20): pg.evaluate(f"window.__pyro.player.renderAt({args.start}, 1/{args.fps})")
    for i in range(n):
        t = args.start + i / args.fps
        pg.evaluate(f"window.__pyro.player.renderAt({t}, 1/{args.fps})")
        ff.stdin.write(pg.screenshot(type="jpeg", quality=92))
        if i % (args.fps * 5) == 0:
            el = time.time() - t0
            print(f"  {t:6.1f}s of {end:.1f}s  ({i}/{n} frames, {el:.0f}s elapsed, {(n - i) * el / max(i, 1):.0f}s left)", flush=True)
    ff.stdin.close(); ff.wait()
    b.close()
print("done", args.out, f"{os.path.getsize(args.out) / 1e6:.1f} MB", "errors:", errs or "none")
