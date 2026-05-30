import os
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\newgenprometheus\42\faith-re-next\.tmp-screens"
os.makedirs(OUT, exist_ok=True)
BASE = "http://localhost:3008"


def shoot(page, name, full=False):
    path = os.path.join(OUT, name + ".png")
    page.screenshot(path=path, full_page=full)
    print("WROTE", path)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900}, device_scale_factor=2)
    page.goto(BASE + "/preview", wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(900)

    # Onglet Vitaux (défaut)
    shoot(page, "01-vitaux", full=True)

    # Compétences
    try:
        page.get_by_role("tab", name="Compétences").click()
        page.wait_for_timeout(600)
        shoot(page, "02-competences", full=True)
    except Exception as e:
        print("ERR competences:", e)

    # Profil
    try:
        page.get_by_role("tab", name="Profil").click()
        page.wait_for_timeout(600)
        shoot(page, "03-profil", full=True)
    except Exception as e:
        print("ERR profil:", e)

    browser.close()

print("DONE")
