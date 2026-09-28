"""Actual browser interaction and visual captures for the reference layers."""
import threading
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from stage4.serve import create_server

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')

class Observations(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=create_server('127.0.0.1',0);threading.Thread(target=cls.server.serve_forever,daemon=True).start()
  cls.base=f'http://127.0.0.1:{cls.server.server_port}';cls.p=sync_playwright().start()
  cls.browser=cls.p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1440,'height':900});self.page=self.context.new_page();self.errors=[]
  self.page.on('pageerror',lambda e:self.errors.append(str(e)))
 def tearDown(self):self.context.close();self.assertEqual(self.errors,[])
 def start(self):
  self.page.goto(self.base+'/expedition.html?references=1');self.page.locator('#loading').wait_for(state='hidden',timeout=60000)
  for name in ['More','Map','Explore C2']:self.page.get_by_role('button',name=name,exact=True).click()
  expect(self.page.locator('[data-view=close]')).to_be_enabled()
 def layer(self,kind):
  self.page.locator('#observation-kind').select_option(kind)
  self.page.wait_for_function('(kind)=>pyroceneDiagnostics().observation===kind&&pyroceneDiagnostics().view==="overhead"',arg=kind)
  expect(self.page.locator('#observation-kind')).to_be_enabled()
  self.page.wait_for_timeout(300)
 def close(self,id):
  self.page.locator(f'[data-observation="{id}"]').click()
  self.page.wait_for_function('pyroceneDiagnostics().detailBlend===1')
  expect(self.page.locator('[data-view=forest]')).to_be_enabled()
  self.page.wait_for_timeout(300)
 def test_communities_and_return(self):
  self.start();self.layer('built');self.close(32)
  expect(self.page.locator('#plot-notes')).to_contain_text('Alter do Chao')
  self.assertEqual(self.page.locator('[data-specimen]').count(),0)
  self.assertGreater(self.page.evaluate('pyroceneDiagnostics().detailPoints'),1000)
  self.page.screenshot(path=str(QA/'observations-community.png'))
  self.page.get_by_role('button',name='Forest',exact=True).click();self.page.wait_for_function('pyroceneDiagnostics().detailBlend===0&&!pyroceneDiagnostics().tls')
  self.page.locator('#observation-kind').select_option('plants');expect(self.page.locator('[data-view=close]')).to_be_enabled()
  self.page.get_by_role('button',name='Close view',exact=True).click();self.page.wait_for_function('pyroceneDiagnostics().detailBlend===1')
  expect(self.page.locator('[data-specimen]')).to_have_count(6)
 def test_camera_each_animal_and_no_false_plant_progress(self):
  self.start();self.layer('camera')
  for id,name in [(7,'Lowland tapir'),(21,'Jaguar'),(0,'White-lipped peccary')]:
   self.close(id);expect(self.page.locator('.observation-card')).to_contain_text(name)
   self.page.locator('.observation-card canvas[data-loaded=true]').wait_for()
   self.page.screenshot(path=str(QA/f'observations-camera-{id}.png'))
   self.assertEqual(self.page.evaluate('pyroceneDiagnostics().visited'),0)
   self.page.get_by_role('button',name='Overhead',exact=True).click();expect(self.page.locator('[data-view=close]')).to_be_enabled()
  self.assertEqual(self.page.locator('.observation-card').count(),0)
 def test_real_audio_decode_waveform_and_stop(self):
  self.start();self.layer('audio');self.close(16)
  self.page.locator('.observation-card canvas[data-loaded=true]').wait_for()
  self.page.locator('audio').evaluate('(a)=>a.play()')
  self.page.wait_for_function('document.querySelector("audio").currentTime>1')
  self.page.wait_for_function('document.querySelector(".sound-wave").getContext("2d").getImageData(0,0,480,64).data.some((v,i)=>i%4===3&&v>0)')
  self.page.screenshot(path=str(QA/'observations-audio.png'))
  self.page.get_by_role('button',name='Forest',exact=True).click();expect(self.page.locator('[data-view=close]')).to_be_enabled()
  self.assertEqual(self.page.locator('audio').count(),0)
 def test_phone_camera(self):
  self.page.set_viewport_size({'width':390,'height':844});self.page.emulate_media(reduced_motion='reduce');self.start();self.layer('camera');self.close(7)
  self.page.locator('.observation-card canvas[data-loaded=true]').wait_for();self.page.screenshot(path=str(QA/'observations-phone.png'))
  box=self.page.locator('.observation-card').bounding_box();self.assertGreaterEqual(box['x'],0);self.assertLessEqual(box['x']+box['width'],390)
  self.assertEqual(self.page.evaluate('document.documentElement.scrollWidth'),390)
 def test_reference_load_failure_recovers_without_trapping_player(self):
  self.start();self.page.route('**/observations.json',lambda r:r.abort())
  self.page.locator('#observation-kind').select_option('camera');expect(self.page.locator('#observation-kind')).to_be_enabled()
  self.assertEqual(self.page.evaluate('pyroceneDiagnostics().observation'),'plants')
  self.page.unroute('**/observations.json');self.layer('camera');self.close(7)
  self.page.locator('.observation-card canvas[data-loaded=true]').wait_for()
 def test_references_do_not_require_ground_scan_downloads(self):
  self.start();self.page.route('**/tls-expanded*',lambda r:r.abort());self.page.route('**/structure-*.bin',lambda r:r.abort())
  self.layer('built');self.close(32)
  expect(self.page.locator('#plot-notes')).to_contain_text('Alter do Chao')
 def test_no_webgl_community_and_camera(self):
  browser=self.p.chromium.launch(headless=True,args=['--disable-webgl'])
  try:
   self.page=browser.new_page(viewport={'width':1440,'height':900});self.start();self.layer('built');self.close(32)
   self.assertTrue(self.page.evaluate('pyroceneDiagnostics().fallback'));self.page.screenshot(path=str(QA/'observations-cpu-community.png'))
   self.layer('camera');self.close(7);self.page.locator('.observation-card canvas[data-loaded=true]').wait_for();self.page.screenshot(path=str(QA/'observations-cpu-camera.png'))
  finally:browser.close()

if __name__=='__main__':unittest.main()
