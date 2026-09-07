from pathlib import Path
from playwright.sync_api import sync_playwright
import re

ROOT = Path(__file__).resolve().parents[1]


def prepare_inline_app():
    html = (ROOT / 'index.html').read_text()
    css = (ROOT / 'styles.css').read_text()
    html = html.replace('<link rel="stylesheet" href="./styles.css" />', f'<style>{css}</style>')
    html = html.replace('    <script type="module" src="./src/app.js"></script>', '')

    schema = (ROOT / 'src/scene-schema.js').read_text()
    schema = re.sub(r'^export\s+', '', schema, flags=re.M)
    schema = '(()=>{' + schema + ';Object.assign(window,{SCENE_VERSION,validateSceneDocument,cloneSceneDocument,schemaClamp:clamp});})();'

    director = (ROOT / 'src/director.js').read_text()
    director = re.sub(r"^import .*?;\n", '', director, flags=re.M)
    director = re.sub(r'^export\s+', '', director, flags=re.M)
    director = director.replace('clamp(Number(match[1])', 'schemaClamp(Number(match[1])')
    director = '(()=>{const {SCENE_VERSION,schemaClamp}=window;' + director + ';window.directPrompt=directPrompt;})();'

    engine = (ROOT / 'src/scene-engine.js').read_text()
    engine = re.sub(r'^export\s+', '', engine, flags=re.M)
    engine = '(()=>{' + engine + ';window.SceneEngine=SceneEngine;})();'

    app = (ROOT / 'src/app.js').read_text()
    app = re.sub(r"^import .*?;\n", '', app, flags=re.M)
    app = 'const {directPrompt,cloneSceneDocument,validateSceneDocument,SceneEngine}=window;\n' + app
    return html, (schema, director, engine, app)


def main():
    html, scripts = prepare_inline_app()
    out = ROOT / 'smoke-output'
    out.mkdir(exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path='/usr/bin/chromium',
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        )
        page = browser.new_page(viewport={'width': 1440, 'height': 1000}, accept_downloads=True)
        errors = []
        page.on('pageerror', lambda exc: errors.append('pageerror:' + str(exc)))
        page.on('console', lambda msg: errors.append('console:' + msg.text) if msg.type == 'error' else None)
        page.set_content(html, wait_until='domcontentloaded')
        for script in scripts:
            page.add_script_tag(content=script)
        page.wait_for_timeout(500)

        assert page.locator('canvas').count() == 1
        assert page.locator('#environment-label').inner_text() == 'WAREHOUSE / NIGHT'
        assert '35 MM' in page.locator('#camera-label').inner_text()
        assert not errors, errors

        # Natural-language scene change.
        page.locator('#prompt').fill('비 오는 골목, 두 명을 85mm로 4초 동안 따라간다.')
        page.locator('#generate').click()
        assert page.locator('#environment-label').inner_text() == 'URBAN ALLEY / DAY'
        assert '85 MM' in page.locator('#camera-label').inner_text()
        assert 'TRACKING' in page.locator('#camera-label').inner_text()

        # Timeline progresses.
        page.locator('#play').click()
        page.wait_for_timeout(240)
        assert float(page.locator('#timeline').input_value()) > 0

        # Frame export creates a real PNG.
        with page.expect_download() as info:
            page.locator('#ref-mid').click()
        download = info.value
        png_path = out / 'previz-shot01-mid.png'
        download.save_as(png_path)
        assert png_path.stat().st_size > 1000

        # JSON export creates valid content.
        with page.expect_download() as info:
            page.locator('#export-json').click()
        download = info.value
        json_path = out / 'previz-scene-v1.0.0.json'
        download.save_as(json_path)
        assert json_path.stat().st_size > 300

        # AI-video reference manifest export works.
        with page.expect_download() as info:
            page.locator('#ref-manifest').click()
        download = info.value
        manifest_path = out / 'previz-reference-pack-manifest.json'
        download.save_as(manifest_path)
        assert manifest_path.stat().st_size > 500

        page.screenshot(path=str(ROOT / 'preview.png'), full_page=True)
        assert not errors, errors
        browser.close()

    print('browser smoke: PASS')
    print(f'png: {png_path.stat().st_size} bytes')
    print(f'json: {json_path.stat().st_size} bytes')
    print(f'manifest: {manifest_path.stat().st_size} bytes')


if __name__ == '__main__':
    main()
