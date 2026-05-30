from playwright.sync_api import sync_playwright
OUT = r"C:\Users\newgenprometheus\42\faith-re-next\.tmp-screens"
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1.5)
    pg.goto("http://localhost:3008/cockpit?mode=player", wait_until="networkidle", timeout=60000)
    pg.wait_for_timeout(700)
    tabs = pg.get_by_role("tab").all_inner_texts()
    print("TABS:", tabs)
    pg.screenshot(path=OUT + r"\cockpit-player.png")
    print("WROTE", OUT + r"\cockpit-player.png")
    b.close()
