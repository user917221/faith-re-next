from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.goto("http://localhost:3008/preview", wait_until="networkidle", timeout=60000)
    pg.wait_for_timeout(800)
    js = """() => {
      const out = {};
      const gauge = document.querySelector('.font-mono.text-xl');
      if (gauge) { const s = getComputedStyle(gauge); out.gaugeValue = {text: gauge.textContent, font: s.fontFamily, fvn: s.fontVariantNumeric}; }
      // /max span
      const max = [...document.querySelectorAll('span')].find(e => /^\\/\\d/.test(e.textContent.trim()));
      if (max) { const s = getComputedStyle(max); out.maxLabel = {text: max.textContent.trim(), font: s.fontFamily}; }
      // body default
      out.bodyFont = getComputedStyle(document.body).fontFamily;
      // is Geist Mono actually loaded?
      out.monoLoaded = document.fonts ? document.fonts.check('12px "Geist Mono"') : 'n/a';
      out.sansLoaded = document.fonts ? document.fonts.check('12px "Geist"') : 'n/a';
      return out;
    }"""
    import json
    print(json.dumps(pg.evaluate(js), ensure_ascii=False, indent=2))
    b.close()
