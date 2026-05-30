from playwright.sync_api import sync_playwright
OUT = r"C:\Users\newgenprometheus\42\faith-re-next\.tmp-screens"
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 900, "height": 1200}, device_scale_factor=1.5)
    pg.goto("http://localhost:3008/cockpit", wait_until="networkidle", timeout=60000)
    pg.wait_for_timeout(600)
    pg.emulate_media(media="print")
    pg.wait_for_timeout(300)
    # chrome should be hidden in print
    chrome_visible = pg.locator(".cockpit-chrome").first.is_visible()
    print("CHROME VISIBLE IN PRINT (should be False):", chrome_visible)
    pg.screenshot(path=OUT + r"\cockpit-print.png", full_page=True)
    print("WROTE", OUT + r"\cockpit-print.png")
    b.close()
