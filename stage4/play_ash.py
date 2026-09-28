"""Visible-control browser play bench. Send one JSON instruction per stdin line.

Examples: {"command":"lidar"}, {"click":"#back-air"},
{"shot":"/tmp/ash.png"}, {"inspect":true}, {"quit":true}.
This bench reads only rendered UI, never the private engine board.
"""
import argparse
import json
import sys

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8036/ash.html")
    args = parser.parse_args()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        page = browser.new_page(viewport={"width":1440,"height":900}, reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("dialog", lambda dialog: dialog.accept())
        page.goto(args.url)
        page.locator("#loading").wait_for(state="hidden",timeout=60000)
        page.locator("#type-open").click()
        page.locator("#command:enabled").wait_for(timeout=60000)

        def report():
            labels = page.locator("#map-grid [data-cell]").evaluate_all("els => els.map(el => el.getAttribute('aria-label'))")
            print(json.dumps({
                "night":page.locator("#night").inner_text(),
                "cover":page.locator("#cover").inner_text(),
                "held":page.locator("#held").inner_text(),
                "message":page.locator("#feedback").inner_text(),
                "view":page.locator("#view-name").inner_text(),
                "findings":[label for label in labels if any(term in label for term in ["Seedlings","Established","Dense","Bare"])],
                "ending":page.locator("#ending-line").inner_text() if page.locator("#ending").is_visible() else None,
                "errors":errors,
            }), flush=True)

        report()
        for line in sys.stdin:
            try:
                task = json.loads(line)
                if task.get("quit"):
                    break
                if "command" in task:
                    page.locator("#command").fill(task["command"])
                    page.locator("#go").click()
                    page.wait_for_function("!document.getElementById('go').disabled || document.getElementById('ending').open", timeout=60000)
                if "click" in task:
                    page.locator(task["click"]).click()
                    page.wait_for_timeout(700)
                if task.get("reload"):
                    page.reload()
                    page.locator("#loading").wait_for(state="hidden",timeout=60000)
                    page.locator("#type-open").click()
                if "shot" in task:
                    page.screenshot(path=task["shot"])
                report()
            except Exception as error:
                print(json.dumps({"bench_error":str(error)}),flush=True)
        browser.close()


if __name__ == "__main__":
    main()
