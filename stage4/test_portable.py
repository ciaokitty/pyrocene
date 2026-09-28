"""Exercise the real extracted event copy, with no source-checkout dependency."""
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import unittest
import urllib.request
import zipfile

from playwright.sync_api import sync_playwright, expect


class PortablePlay(unittest.TestCase):
    def test_extracted_launcher_native_replay_and_history(self):
        archive = Path('/mnt/seagate/models/pyrocene/stage4/pyrocene-stage4-v0.zip')
        self.assertTrue(archive.is_file(), 'Build the actual release ZIP before this test')
        with tempfile.TemporaryDirectory(prefix='pyrocene-event-copy-') as tmp:
            root = Path(tmp)
            with zipfile.ZipFile(archive) as z:
                self.assertIsNone(z.testzip())
                z.extractall(root)
            manifest = json.loads((root/'stage4/assets/manifest.json').read_text())
            for name, info in manifest['outputs'].items():
                data = (root/'stage4/assets'/name).read_bytes()
                self.assertEqual(len(data), info['bytes'], name)
                self.assertEqual(hashlib.sha256(data).hexdigest(), info['sha256'], name)
            bank = json.loads((root/'stage4/assets/forefire-bank.json').read_text())
            self.assertEqual(bank['modelSha256'], hashlib.sha256((root/'stage4/model.mjs').read_bytes()).hexdigest())
            self.assertEqual(len(bank['plans']), 253)
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', 0))
                port = sock.getsockname()[1]
            base = f'http://127.0.0.1:{port}'
            env = dict(os.environ)
            env.pop('PYROCENE_STAGE4_ASSETS', None)
            env.pop('PYTHONPATH', None)
            process = subprocess.Popen(['sh', str(root/'run.sh'), '--port', str(port)],
                cwd='/tmp', env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            try:
                for _ in range(100):
                    try:
                        with urllib.request.urlopen(base+'/health', timeout=.5) as r:
                            self.assertTrue(json.load(r)['ok'])
                        break
                    except OSError:
                        if process.poll() is not None: self.fail(process.stdout.read().decode())
                        time.sleep(.1)
                else: self.fail('Extracted server did not become ready')
                with sync_playwright() as pw:
                    browser = pw.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
                    page = browser.new_page(viewport={'width':1440,'height':900})
                    errors, external = [], []
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    def route(r):
                        if r.request.url.startswith(base): r.continue_()
                        else: external.append(r.request.url); r.abort()
                    page.route('**/*', route)
                    page.goto(base)
                    page.wait_for_selector('#loading', state='hidden')
                    self.assertTrue(page.url.endswith('/expedition.html'))
                    self.assertEqual(page.locator('#radio-open,.radio-portrait,dialog[open]').count(),0)
                    page.goto(base+'/round.html')
                    page.wait_for_selector('#loading',state='hidden')
                    for label in ['Begin','Patch B','Close view','Propose','Begin','Propose','Begin','Reveal plans','Commit plan']:
                        page.get_by_role('button',name=label,exact=True).click()
                    page.locator('#fire-time').fill('10')
                    page.locator('#fire-time').dispatch_event('input')
                    page.wait_for_function('roundDiagnostics().mode==="fire"')
                    self.assertEqual(page.evaluate('roundDiagnostics().state.committed.left'),4)
                    self.assertGreater(page.evaluate('roundDiagnostics().growthPoints'),2000)
                    page.locator('#game-mode').select_option('negligence')
                    page.get_by_role('button',name='Begin',exact=True).click()
                    page.wait_for_function('!roundDiagnostics().busy')
                    page.locator('#recovery').fill('10');page.locator('#recovery').dispatch_event('input')
                    page.get_by_role('button',name='Without removal',exact=True).click()
                    self.assertEqual(page.evaluate('roundDiagnostics().forecast.alive'),15)
                    for label in ['Patch B','Close view','Structure']:
                        page.get_by_role('button',name=label,exact=True).click()
                    page.wait_for_function('roundDiagnostics().lab.draws>0')
                    page.locator('#structure-year').fill('3');page.locator('#structure-year').dispatch_event('input')
                    self.assertEqual(page.evaluate('roundDiagnostics().years'),3)
                    page.goto(base+'/ash.html')
                    page.wait_for_selector('#loading', state='hidden')
                    self.assertIn('Island of Ash',page.title())
                    page.locator('#type-open').click()
                    for command in ['lidar','drone D4','remove D4','restore D4']:
                        page.locator('#command').fill(command)
                        page.locator('#go').click()
                        expect(page.locator('#go')).to_be_enabled(timeout=30000)
                    self.assertIn('SCAN',page.locator('#view-name').inner_text())
                    self.assertEqual(page.locator('#cover').inner_text(),'86%')
                    page.reload()
                    page.wait_for_selector('#loading',state='hidden')
                    self.assertEqual(page.locator('#night').inner_text(),'Night 5 / 14')
                    page.goto(base+'/expedition.html')
                    page.wait_for_selector('#loading', state='hidden')
                    for label in ['More','Map','Explore C2','Close view']:
                        page.get_by_role('button',name=label,exact=True).click()
                    expect(page.locator('[data-specimen]')).to_have_count(6)
                    expect(page.locator('[data-view=forest]')).to_be_enabled()
                    page.locator('[data-specimen]').first.click()
                    expect(page.locator('.plain-note')).to_be_visible()
                    self.assertIn('Marandu grass',page.locator('#plant-guide').inner_text())
                    self.assertTrue(page.evaluate('pyroceneDiagnostics().tls'))
                    page.screenshot(path='/mnt/seagate/models/pyrocene/stage4/qa-explore/10-portable-plant.png')
                    page.locator('#book-close').click()
                    page.get_by_role('button',name='Examine structure',exact=True).click()
                    page.wait_for_function('pyroceneDiagnostics().structureLab.draws>0')
                    page.locator('#structure-focus').select_option('liana')
                    page.get_by_role('button',name='Look through',exact=True).click()
                    self.assertEqual(page.locator('#structure-lab canvas').count(),2)
                    self.assertEqual(page.locator('#structure-lab img').count(),0)
                    page.locator('#structure-lab').get_by_role('button',name='Back',exact=True).click()
                    self.assertEqual(page.locator('#observation-kind').count(),0)
                    expect(page.locator('#network-open')).to_be_hidden()
                    page.goto(base+'/expedition.html?references=1')
                    page.wait_for_selector('#loading', state='hidden')
                    for kind,sector in [('built',32),('camera',7),('audio',16)]:
                        page.locator('#observation-kind').select_option(kind)
                        expect(page.locator('#observation-kind')).to_be_enabled()
                        page.locator(f'[data-observation="{sector}"]').click()
                        page.wait_for_function('pyroceneDiagnostics().detailBlend===1')
                        expect(page.locator('[data-view=forest]')).to_be_enabled()
                        if kind!='built':page.locator('.observation-card canvas[data-loaded=true]').wait_for()
                        if kind=='audio':
                            page.locator('audio').evaluate('(a)=>a.play()')
                            page.wait_for_function('document.querySelector("audio").currentTime>.25')
                    page.locator('#observation-kind').select_option('plants')
                    expect(page.locator('#observation-kind')).to_be_enabled()
                    for label in ['More','Sensor network','Sound recorders','Finish this field round']:
                        page.get_by_role('button',name=label,exact=True).click()
                    self.assertEqual(page.evaluate('pyroceneDiagnostics().network.day'),1)
                    page.goto(base+'/memory.html?blank=1')
                    expect(page.locator('#status')).to_have_text('Paper map ready')
                    page.get_by_role('button',name='Commit paper map',exact=True).click()
                    page.get_by_role('button',name='Play fire',exact=True).click()
                    expect(page.locator('#result')).to_be_visible()
                    page.goto(base+'/mission.html')
                    page.wait_for_selector('#loading', state='hidden')
                    page.get_by_role('button',name='Enter the forest').click()
                    page.locator('[data-action=lidar]').click()
                    page.get_by_role('button',name='Build your protection plan →').click()
                    for sector in (13,15):
                        page.locator(f'#map [data-sector="{sector}"]').click()
                        page.locator('#assign').click()
                    page.get_by_role('button',name='Commit plan & run fire →').click()
                    page.get_by_role('button',name='Stress-test this plan with ForeFire').click()
                    page.get_by_role('button',name='Return to training model').wait_for()
                    self.assertIn('ForeFire stress-test',page.locator('#fire-title').inner_text())
                    page.get_by_role('button',name='Reveal the 2023 mapped fire').click()
                    self.assertIn('MapBiomas',page.locator('#view-caption').inner_text())
                    page.get_by_role('button',name='Finish mission').click()
                    self.assertEqual(page.locator('#phase').inner_text(),'MISSION DEBRIEF')
                    qa = Path('/mnt/seagate/models/pyrocene/stage4/qa')
                    qa.mkdir(parents=True,exist_ok=True)
                    page.screenshot(path=str(qa/'16-extracted-portable.png'))
                    page.goto(base+'/prelude/')
                    for key in ['Middle','Middle','Neck','Middle','East']:
                        page.get_by_role('button',name='Inspect '+key,exact=True).click()
                        page.locator('#work').click()
                    expect(page.locator('#closed')).to_have_text('1 / 3')
                    expect(page.locator('#credits')).to_have_text('13')
                    page.screenshot(path=str(qa/'17-extracted-prelude.png'))
                    self.assertEqual(errors, [])
                    self.assertEqual(external, [])
                    browser.close()
            finally:
                process.terminate()
                process.communicate(timeout=5)


if __name__ == '__main__': unittest.main()
