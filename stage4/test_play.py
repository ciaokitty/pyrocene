"""Play the actual UI through a failure, revision, and offline replay.

python3 -m unittest stage4.test_play -v
Screenshots and the measured browser environment go to external QA storage.
"""
import json
import threading
import unittest
from pathlib import Path

from playwright.sync_api import sync_playwright
from stage4.serve import create_server

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa')


class MissionPlay(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        QA.mkdir(parents=True,exist_ok=True)
        cls.server=create_server(port=0)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.base=f'http://127.0.0.1:{cls.server.server_address[1]}'
        cls.pw=sync_playwright().start()
        cls.browser=cls.pw.chromium.launch(headless=True,args=[
            '--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.pw.stop();cls.server.shutdown();cls.server.server_close()

    def setUp(self):
        self.ctx=self.browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
        self.errors=[];self.external=[]
        self.ctx.route('**/*', self.route)
        self.page=self.ctx.new_page()
        self.page.on('pageerror',lambda e:self.errors.append(str(e)))
        self.page.goto(self.base+'/mission.html')
        self.page.wait_for_selector('#loading',state='hidden')

    def route(self,route):
        if route.request.url.startswith(self.base) or route.request.url.startswith('data:'):
            route.continue_()
        else:
            self.external.append(route.request.url);route.abort()

    def tearDown(self):
        self.ctx.close()
        self.assertEqual(self.errors,[])
        self.assertEqual(self.external,[], 'Event play must not require external requests')

    def choose(self,id): self.page.locator(f'#map [data-sector="{id}"]').click()
    def button(self,name): self.page.get_by_role('button',name=name,exact=True).click()
    def shot(self,name):
        # Let the camera and evidence-panel scroll settle before visual review.
        self.page.wait_for_timeout(350)
        self.page.screenshot(path=str(QA/f'{name}.png'))

    def test_complete_mission_revision_save_and_history(self):
        p=self.page
        self.shot('01-arrival')
        p.get_by_role('button',name='Enter the forest').click()
        p.locator('[data-action=lidar]').click()
        self.assertIn('vertical profile',p.locator('#evidence').inner_text())
        self.assertEqual(p.locator('#credits').inner_text(),'7')
        self.choose(13);p.locator('[data-action=spectral]').click();p.locator('[data-action=field]').click()
        self.assertIn('continuous',p.locator('#evidence').inner_text())
        self.shot('02-investigation')
        self.choose(16);p.locator('[data-action=spectral]').click()
        self.button('Build your protection plan →')
        self.choose(16);p.locator('#assign').click()
        self.choose(28);p.locator('#assign').click()
        self.shot('03-weak-plan')
        self.button('Commit plan & run fire →')
        self.assertIn('Modelled area spared',p.locator('#results').inner_text())
        p.locator('#fire-time').fill('1000')
        self.shot('04-first-consequence')
        self.button('Investigate & revise once →')
        self.choose(15);p.locator('[data-action=spectral]').click();p.locator('[data-action=field]').click()
        self.button('Build your protection plan →')
        self.choose(16);p.locator('#assign').click()
        self.choose(28);p.locator('#assign').click()
        self.choose(13);p.locator('.mark-options [data-mark=connected]').click();p.locator('#assign').click()
        self.choose(15);p.locator('.mark-options [data-mark=connected]').click();p.locator('#assign').click()
        self.shot('05-informed-plan')
        self.button('Commit plan & run fire →')
        self.assertIn('12.8 ha less modelled burning',p.locator('#results').inner_text())
        p.locator('#fire-time').fill('1000')
        self.shot('06-revised-consequence')
        self.button('Show without intervention')
        self.assertEqual(p.locator('#fire-title').inner_text(),'Without intervention')
        p.locator('#fire-time').fill('1000');self.shot('07-counterfactual')
        self.button('Stress-test this plan with ForeFire')
        p.get_by_role('button',name='Return to training model',exact=True).wait_for()
        self.assertIn('First modelled arrival in the refuge',p.locator('#results').inner_text())
        self.assertIn('ForeFire stress-test',p.locator('#fire-title').inner_text())
        p.locator('#fire-time').fill('1000');self.shot('15-native-stress-test')
        self.button('Show without intervention')
        self.assertIn('ForeFire stress-test · Without intervention',p.locator('#fire-title').inner_text())
        self.button('Return to training model')
        self.assertEqual(p.locator('#fire-title').inner_text(),'Without intervention')
        self.button('Finish mission')
        self.button('Reveal the 2023 mapped fire')
        self.assertIn('MapBiomas',p.locator('#view-caption').inner_text())
        self.shot('08-history')
        p.reload();p.wait_for_selector('#loading',state='hidden')
        self.assertEqual(p.locator('#phase').inner_text(),'MISSION DEBRIEF')
        self.assertIn('less modelled burning',p.locator('#results').inner_text())
        with p.expect_download() as info:
            p.get_by_role('button',name='Download your mission record ↗').click()
        self.assertEqual(info.value.suggested_filename,'pyrocene-mission.json')
        self.button('Evidence & sources')
        self.assertIn('MapBiomas',p.locator('#sources').inner_text())
        p.locator('#sources .dialog-close').click()
        (QA/'browser-performance.json').write_text(json.dumps(p.evaluate('pyroceneDiagnostics()'),indent=2)+'\n')

    def test_small_laptop_mobile_layers_and_low_detail(self):
        p=self.page
        p.set_viewport_size({'width':1280,'height':720})
        p.get_by_role('button',name='Enter the forest').click()
        self.button('Satellite');self.shot('09-satellite-1280')
        self.button('Structure');self.button('Close view');self.shot('10-close-1280')
        self.button('Mission settings');p.locator('#low-detail').check()
        p.locator('#reduced-motion').check();p.locator('#settings .dialog-close').click()
        self.assertEqual(p.evaluate('pyroceneDiagnostics().points'),100000)
        self.button('Forest');self.shot('11-low-detail-1280')
        self.assertLessEqual(p.evaluate('document.documentElement.scrollWidth'),1280)
        p.set_viewport_size({'width':390,'height':844})
        self.choose(13);p.locator('[data-action=field]').click();self.shot('12-mobile')
        self.assertLessEqual(p.evaluate('document.documentElement.scrollWidth'),390)

    def test_no_webgl_still_plays_and_replays(self):
        fallback=self.pw.chromium.launch(headless=True,args=['--disable-webgl'])
        ctx=fallback.new_context(viewport={'width':1280,'height':720})
        p=ctx.new_page();p.goto(self.base+'/mission.html');p.wait_for_selector('#loading',state='hidden')
        self.assertTrue(p.evaluate('pyroceneDiagnostics().fallback'))
        p.get_by_role('button',name='Enter the forest').click()
        p.get_by_role('button',name='Build your protection plan →').click()
        for id in [13,15]:
            p.locator(f'#map [data-sector="{id}"]').click();p.locator('#assign').click()
        p.get_by_role('button',name='Commit plan & run fire →').click()
        p.locator('#fire-time').fill('1000')
        self.assertIn('refuge holds',p.locator('#results').inner_text())
        p.screenshot(path=str(QA/'13-no-webgl.png'))
        p.get_by_role('button',name='Reveal the 2023 mapped fire').click()
        p.screenshot(path=str(QA/'14-no-webgl-history.png'))
        ctx.close();fallback.close()

    def test_optional_native_bank_missing_does_not_block_mission(self):
        p=self.page
        p.route('**/assets/forefire-bank.json',lambda route:route.fulfill(status=404,body='not installed'))
        p.get_by_role('button',name='Enter the forest').click()
        self.button('Build your protection plan →')
        for id in [13,15]: self.choose(id);p.locator('#assign').click()
        self.button('Commit plan & run fire →')
        self.button('Stress-test this plan with ForeFire')
        p.get_by_text('This event copy does not include the optional ForeFire stress-tests.',exact=True).wait_for()
        self.assertIn('refuge holds',p.locator('#results').inner_text())
        self.button('Finish mission')
        self.assertEqual(p.locator('#phase').inner_text(),'MISSION DEBRIEF')


if __name__=='__main__':unittest.main()
