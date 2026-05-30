from playwright.sync_api import sync_playwright

OUT = r"C:\Users\newgenprometheus\42\faith-re-next\.tmp-screens"
VIEWS = ["journal", "npcs", "regles"]
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1.5)
    for v in VIEWS:
        pg.goto(f"http://localhost:3008/cockpit?view={v}", wait_until="networkidle", timeout=60000)
        pg.wait_for_timeout(600)
        path = OUT + rf"\cockpit-{v}.png"
        pg.screenshot(path=path)
        print("WROTE", path)
    b.close()
