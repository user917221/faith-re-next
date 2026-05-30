from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 800}, device_scale_factor=1)
    pg.goto("http://localhost:3008/cockpit", wait_until="networkidle", timeout=60000)
    pg.wait_for_timeout(600)
    tablist = pg.get_by_role("tablist")
    y_before = tablist.bounding_box()["y"]
    # scroll the center main pane down
    main = pg.locator("main.cockpit-print-area")
    main.evaluate("el => el.scrollBy(0, 500)")
    pg.wait_for_timeout(400)
    y_after = tablist.bounding_box()["y"]
    print(f"TABLIST y before={y_before:.0f} after scroll 500px={y_after:.0f} (sticky if ~equal & small)")
    b.close()
