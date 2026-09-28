"""Real browser play regressions. Requires installed Python Playwright/Chromium."""
import threading
import unittest
from pathlib import Path

from playwright.sync_api import sync_playwright
from stage4 import serve

WIN = ['lidar','drone D4','remove D4','restore D4','drone I4','remove I4','restore I4','drone B8','remove B8','restore B8']
LATE = ['lidar']+['pass']*6+['remove B2','restore B2','remove B8','restore B8','remove I4','restore I4','remove C4']
SHOTS = Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')


class AshPlayTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=serve.create_server('127.0.0.1',0)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.base=f'http://127.0.0.1:{cls.server.server_port}'
        cls.p=sync_playwright().start()
        cls.browser=cls.p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        SHOTS.mkdir(parents=True,exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close();cls.thread.join(timeout=3)

    def setUp(self):
        self.context=self.browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
        self.page=self.context.new_page();self.errors=[]
        self.page.on('pageerror',lambda e:self.errors.append(str(e)))
        self.page.goto(self.base+'/ash.html')
        self.page.locator('#loading').wait_for(state='hidden',timeout=60000)
        self.page.locator('#type-open').click()
        self.page.locator('#command:enabled').wait_for(timeout=60000)

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors,[])

    def command(self,text):
        self.page.locator('#command').fill(text)
        self.page.locator('#go').click()
        self.page.wait_for_function("!document.getElementById('go').disabled || document.getElementById('ending').open",timeout=60000)

    def shot(self,name):
        self.page.wait_for_timeout(450)
        self.page.screenshot(path=str(SHOTS/name))

    def test_cinematic_mouse_only_route(self):
        self.page.locator('#type-open').click()
        self.assertFalse(self.page.locator('#mini').is_visible())
        self.assertFalse(self.page.locator('#command-form').is_visible())
        self.assertTrue(self.page.locator('.cinema-forest').evaluate('(img)=>img.complete && img.naturalWidth>1000'))
        self.assertEqual(self.page.evaluate('pyroceneDiagnostics().presentation'),'cinematic')
        self.shot('cinema-start.png')
        self.page.locator('[data-command="lidar"]').click()
        self.page.wait_for_function("!document.getElementById('go').disabled")
        self.assertEqual(self.page.locator('#night').inner_text(),'Night 2 / 14')
        self.assertFalse(self.page.evaluate('pyroceneDiagnostics().tiled'))
        self.assertFalse(self.page.evaluate('pyroceneDiagnostics().visibleGrid'))
        self.assertEqual(self.page.evaluate('pyroceneDiagnostics().points'),420000)
        self.shot('cinema-sat.png')
        for coord in ['D4','I4','B8']:
            if self.page.locator('#back-air').is_visible():self.page.locator('#back-air').click()
            # Project a public world coordinate, then click the actual canvas.
            # No direct call into selection code or access to hidden game state.
            point=self.page.evaluate('''coord=>{
              const col=coord.charCodeAt(0)-65,row=+coord.slice(1)-1;
              const u=(col+.5-11)*50,v=(row+.5-6)*50;
              const p=new THREE.Vector3((u-v)/Math.SQRT2,25,(u+v)/Math.SQRT2);
              const cam=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,1,5000);
              cam.position.set(Math.cos(.54)*Math.cos(.67)*1250,8+Math.sin(.67)*1250,Math.sin(.54)*Math.cos(.67)*1250);
              cam.lookAt(0,8,0);cam.updateMatrixWorld();p.project(cam);
              return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};
            }''',coord)
            self.page.mouse.click(point['x'],point['y'])
            self.assertEqual(self.page.locator('#patch-label').inner_text(),f'Patch {coord}')
            for action in ['drone','remove','restore']:
                self.page.locator(f'[data-command="{action}"]').click()
                self.page.wait_for_function("!document.getElementById('go').disabled || document.getElementById('ending').open",timeout=60000)
                if action=='drone':
                    self.assertIn('GROUND SCAN',self.page.locator('#view-name').inner_text())
                    if coord=='D4':self.shot('cinema-drone.png')
        self.assertEqual(self.page.locator('#ending-title').inner_text(),'The forest holds')
        self.assertIn('87%',self.page.locator('#ending-line').inner_text())
        self.assertFalse(self.page.locator('#mini').is_visible())
        self.shot('cinema-mouse-win.png')

    def test_scan_is_immediate_and_reading_and_back_are_free(self):
        self.command('drone Z99')
        self.assertEqual(self.page.locator('#night').inner_text(),'Night 1 / 14')
        self.assertIn('Unknown cell',self.page.locator('#message').inner_text())
        self.command('lidar')
        self.assertEqual(self.page.locator('#view-name').inner_text(),'AIRBORNE')
        self.shot('ash-airborne.png')
        self.command('drone D4')
        self.assertIn('GROUND SCAN',self.page.locator('#view-name').inner_text())
        self.assertTrue(self.page.locator('#back-air').is_visible())
        self.assertEqual(self.page.locator('#map-grid .in-area').count(),16)
        self.assertIn('invasive patches',self.page.locator('#message').inner_text())
        self.shot('ash-close-scan.png')
        night=self.page.locator('#night').inner_text()
        self.page.locator('#plant-open').click()
        self.assertEqual(self.page.locator('#plants .plant-record').count(),2)
        self.page.locator('[data-close="plants"]').click()
        self.page.locator('#back-air').click()
        self.assertEqual(self.page.locator('#night').inner_text(),night)
        self.page.reload();self.page.locator('#loading').wait_for(state='hidden',timeout=60000)
        self.assertEqual(self.page.locator('#night').inner_text(),night)

    def test_informed_route_wins_and_terminal_save_resumes(self):
        for command in WIN:self.command(command)
        self.assertEqual(self.page.locator('#ending-title').inner_text(),'The forest holds')
        self.assertIn('87%',self.page.locator('#ending-line').inner_text())
        self.shot('ash-win.png')
        self.page.reload();self.page.locator('#ending[open]').wait_for(timeout=60000)
        self.assertEqual(self.page.locator('#ending-title').inner_text(),'The forest holds')
        self.assertTrue(self.page.locator('#go').is_disabled())

    def test_delayed_response_reinvades_and_burns(self):
        feedback=[]
        for command in LATE:
            self.command(command);feedback.append(self.page.locator('#message').inner_text())
        self.assertTrue(any('Fire crossed' in line for line in feedback))
        self.assertEqual(self.page.locator('#ending-title').inner_text(),'The forest slipped away')
        self.assertIn('season ended',self.page.locator('#ending-line').inner_text())
        self.page.locator('[data-close="ending"]').click()
        self.shot('ash-fire-loss.png')

    def test_phone_and_no_webgl_can_still_play(self):
        fallback=self.p.chromium.launch(headless=True,args=['--disable-webgl'])
        page=fallback.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
        try:
            page.goto(self.base+'/ash.html');page.locator('#loading').wait_for(state='hidden',timeout=60000);page.locator('#type-open').click();page.locator('#command:enabled').wait_for(timeout=60000)
            self.assertTrue(page.locator('.ash-fallback-canvas').is_visible())
            page.locator('#command').fill('drone D4');page.locator('#go').click()
            page.wait_for_function("!document.getElementById('go').disabled",timeout=60000)
            self.assertIn('GROUND SCAN',page.locator('#view-name').inner_text())
            self.assertTrue(page.locator('#back-air').is_visible())
            page.locator('#coordinates-open').click()
            self.assertTrue(page.locator('#map-grid').is_visible())
            self.assertLessEqual(page.locator('body').bounding_box()['width'],390)
            page.screenshot(path=str(SHOTS/'ash-phone-fallback.png'))
        finally:fallback.close()


if __name__=='__main__':unittest.main()
