"""Actual browser exploration, including revisits and the discovery map."""
import threading
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from .serve import create_server

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-explore')
class ExplorePlay(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  QA.mkdir(exist_ok=True,parents=True);cls.server=create_server(port=0)
  threading.Thread(target=cls.server.serve_forever,daemon=True).start()
  cls.base=f'http://127.0.0.1:{cls.server.server_port}';cls.pw=sync_playwright().start()
  cls.browser=cls.pw.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.pw.stop();cls.server.shutdown();cls.server.server_close()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1440,'height':900})
  self.errors=[];self.external=[];self.page=self.context.new_page()
  self.page.on('pageerror',lambda e:self.errors.append(str(e)))
  def route(r):
   if r.request.url.startswith(self.base):r.continue_()
   else:self.external.append(r.request.url);r.abort()
  self.page.route('**/*',route);self.page.goto(self.base+'/explore.html');self.page.wait_for_selector('#loading',state='hidden')
  self.assertTrue(self.page.url.endswith('/explore.html'))
  self.assertTrue(self.page.locator('.lia-portrait').evaluate('(img)=>img.complete && img.naturalWidth>0 && img.getAttribute("src")==="lia-v1.png"'))
 def tearDown(self):self.context.close();self.assertEqual(self.errors,[]);self.assertEqual(self.external,[])
 def button(self,name):self.page.get_by_role('button',name=name,exact=True).click()
 def screenshot(self,name):self.page.wait_for_timeout(500);self.page.screenshot(path=str(QA/f'{name}.png'))
 def visit(self,id,first=False):
  if first:self.button('Find a place to start')
  else:self.page.locator(f'[data-plot="{id}"]').click()
  self.button('Look closer');self.button('Scan from the ground');self.button('Send the field team')
  expect(self.page.locator('[data-specimen]')).to_have_count(3)
 def find_all(self,id):
  for i in range(3):
   self.page.locator(f'[data-specimen="{id}-{i}"]').click()
   expect(self.page.locator('#plant-guide')).to_be_visible()
   self.button('Back to the plot')
 def test_two_plots_species_sort_map_settlement_and_reload(self):
  self.assertEqual(self.page.locator('#plants-open').is_visible(),False)
  self.screenshot('01-forest');self.visit(13,True);self.screenshot('02-tls-plants')
  self.page.locator('[data-specimen="13-0"]').click();self.screenshot('03-plant-card');self.button('Back to the plot')
  self.find_all(13);self.button('Back to the forest')
  self.visit(8);self.screenshot('04-other-strata');self.find_all(8)
  self.button('Go overhead');self.button('Open Plants');self.screenshot('05-plant-guide')
  self.page.locator('#plant-sort').select_option('dry')
  rows=self.page.locator('.plant-list-item')
  self.assertEqual(rows.first.get_attribute('data-species'),'urochloa_brizantha')
  self.page.get_by_role('checkbox',name='Map Marandu grass',exact=True).check()
  self.page.get_by_role('checkbox',name='Map Guinea grass',exact=True).check()
  self.button('Find selected plants');self.button('Show the settlement');self.screenshot('06-pattern-map')
  self.assertIn('2 plants',self.page.locator('#match-count').inner_text())
  expect(self.page.locator('.settlement')).to_be_visible()
  self.page.reload();self.page.wait_for_selector('#loading',state='hidden')
  self.assertEqual(self.page.locator('#plant-count').inner_text(),'6')
  self.assertIn('2 plants',self.page.locator('#match-count').inner_text())
  self.page.locator('[data-plot="13"]').click();self.button('Look closer')
  expect(self.page.locator('[data-specimen]')).to_have_count(3)
  self.page.locator('[data-specimen="13-0"]').click()
  self.assertIn('Marandu grass',self.page.locator('#plant-guide').inner_text())
  self.button('Close plant guide');self.button('Sources')
  self.assertIn('not measured at the selected Amazon',self.page.locator('#sources').inner_text())
  self.assertIn('fictional field ecologist',self.page.locator('#sources').inner_text())
 def test_mobile_and_reduced_detail(self):
  self.page.set_viewport_size({'width':390,'height':844})
  self.button('Settings');self.page.locator('#low-detail').check();self.page.locator('#reduced-motion').check();self.button('Close settings')
  self.visit(13,True);self.page.locator('[data-specimen="13-0"]').click();self.screenshot('07-mobile-card')
  self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),390)
  self.button('Back to the plot');self.button('Forest');self.screenshot('08-mobile-forest')
 def test_no_webgl_ground_scan_and_plant_card(self):
  b=self.pw.chromium.launch(headless=True,args=['--disable-webgl'])
  p=b.new_page(viewport={'width':1280,'height':720});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(self.base+'/explore.html');p.wait_for_selector('#loading',state='hidden')
  for name in ['Find a place to start','Look closer','Scan from the ground','Send the field team']:p.get_by_role('button',name=name,exact=True).click()
  p.locator('[data-specimen="13-0"]').click();p.screenshot(path=str(QA/'09-fallback-tls.png'))
  self.assertIn('Marandu grass',p.locator('#plant-guide').inner_text());self.assertTrue(p.evaluate('pyroceneDiagnostics().fallback'))
  self.assertEqual(errors,[]);b.close()
if __name__=='__main__':unittest.main()
