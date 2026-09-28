"""Interactive point-cloud comparisons, not image panels."""
import threading
import unittest
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import sync_playwright, expect
from stage4.serve import create_server

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')

class StructureStudy(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=create_server('127.0.0.1',0);threading.Thread(target=cls.server.serve_forever,daemon=True).start()
  cls.base=f'http://127.0.0.1:{cls.server.server_port}';cls.p=sync_playwright().start()
  cls.browser=cls.p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  QA.mkdir(parents=True,exist_ok=True)
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce');self.page=self.context.new_page();self.errors=[]
  self.page.on('pageerror',lambda e:self.errors.append(str(e)))
 def tearDown(self):self.context.close();self.assertEqual(self.errors,[])
 def click(self,name):self.page.get_by_role('button',name=name,exact=True).click()
 def start(self):
  self.page.goto(self.base);self.page.locator('#loading').wait_for(state='hidden',timeout=60000)
  for name in ['More','Map','Explore C2','Close view']:self.click(name)
  expect(self.page.get_by_role('button',name='Examine structure',exact=True)).to_be_visible()
 def lab(self):
  self.click('Examine structure');self.page.wait_for_function('pyroceneDiagnostics().structureLab.draws>0')
 def stats(self):return self.page.evaluate('pyroceneDiagnostics().structureLab')
 def shot(self,name):self.page.wait_for_timeout(200);self.page.screenshot(path=str(QA/(name+'.png')))
 def back(self):self.page.locator('#structure-lab').get_by_role('button',name='Back',exact=True).click()
 def test_linked_rotation_zoom_and_return_preserve_baseline(self):
  self.start();before=self.page.evaluate('pyroceneDiagnostics()');self.lab();self.shot('lab-compare-v2')
  self.assertEqual(self.page.locator('#structure-lab img,#structure-lab video').count(),0)
  self.assertEqual(self.page.locator('#structure-lab canvas').count(),2)
  s=self.stats();self.assertGreater(s['models'][0]['canopyCells'],s['models'][1]['canopyCells'])
  canvases=self.page.locator('#structure-lab canvas');old=[Image.open(BytesIO(c.screenshot())) for c in canvases.all()]
  box=canvases.last.bounding_box();self.page.mouse.move(box['x']+230,box['y']+160);self.page.mouse.down();self.page.mouse.move(box['x']+290,box['y']+180,steps=10);self.page.mouse.up();self.page.wait_for_timeout(100)
  for c,previous in zip(canvases.all(),old):self.assertGreater(sum(ImageStat.Stat(ImageChops.difference(previous,Image.open(BytesIO(c.screenshot())))).mean),1)
  self.assertNotEqual(self.stats()['angle'],s['angle']);self.page.mouse.wheel(0,-250);self.page.wait_for_timeout(100);self.assertGreater(self.stats()['zoom'],1)
  self.shot('lab-orbit-v2');self.back()
  after=self.page.evaluate('pyroceneDiagnostics()');self.assertEqual(before['detailPoints'],after['detailPoints']);self.assertEqual(before['plants'],after['plants']);self.assertEqual(before['cameraTarget'],after['cameraTarget']);self.assertFalse(after['structureLab']['open'])
  self.click('Forest');expect(self.page.locator('[data-view=close]')).to_be_enabled()
 def test_growth_forms_slice_and_separate_field_conditions(self):
  self.start();self.lab()
  for focus in ['liana','shrub','grass','canopy']:
   self.page.locator('#structure-focus').select_option(focus);self.shot('lab-'+focus+'-v2');self.assertEqual(self.stats()['focus'],focus)
  self.click('Look through');expect(self.page.locator('#structure-slice')).to_be_visible()
  self.page.locator('#structure-slice').fill('8');self.page.locator('#structure-slice').dispatch_event('input');self.shot('lab-slice-v2');self.assertEqual(self.stats()['slice'],8)
  self.click('Forest floor');self.page.locator('#structure-focus').select_option('litter');self.assertTrue(self.stats()['conditions'])
  self.assertEqual(self.page.get_by_role('button',name='Check field conditions',exact=True).count(),0);expect(self.page.locator('.structure-caption').last).to_contain_text('Dead leaves break')
  self.shot('lab-floor-v2')
 def test_species_opens_its_actual_modelled_form(self):
  self.start();self.page.locator('[data-plant=doliocarpus_dentatus]').click();self.click('See its structure')
  self.page.wait_for_function('pyroceneDiagnostics().structureLab.draws>0');self.assertTrue(self.stats()['focus'].startswith('species:'))
  expect(self.page.locator('.structure-bottom')).to_contain_text('Doliocarpus dentatus');self.shot('lab-species-v2')
  self.page.keyboard.press('Escape');expect(self.page.locator('#structure-lab')).not_to_be_visible();expect(self.page.locator('#plant-guide')).to_be_visible()
 def test_damp_gap_is_not_presented_as_dry_fuel(self):
  self.start();self.click('More');self.click('Map');self.click('Explore C3');self.click('Close view');self.lab()
  self.click('Forest floor');self.shot('lab-damp-gap-v2')
  expect(self.page.locator('.structure-caption').last).to_contain_text('bends without breaking');self.assertGreater(self.stats()['models'][1]['gap'],0)
 def test_focused_section_moves_without_clipping_species_or_changing_compare(self):
  self.start();self.page.locator('[data-plant=doliocarpus_dentatus]').click();self.click('See its structure')
  self.page.wait_for_function('pyroceneDiagnostics().structureLab.draws>0')
  canvas=self.page.locator('#structure-lab canvas').last;compare=canvas.screenshot();focus=self.stats()['focus']
  self.click('Look through');self.shot('focused-section-after')
  images=[]
  for offset in ['-16','16']:
   self.page.locator('#structure-slice').fill(offset);self.page.locator('#structure-slice').dispatch_event('input');self.page.wait_for_timeout(100)
   self.assertEqual(self.stats()['focus'],focus);images.append(Image.open(BytesIO(canvas.screenshot())))
   self.shot('focused-section-depth-'+offset)
  self.assertGreater(sum(ImageStat.Stat(ImageChops.difference(*images)).mean),.5)
  # Pink selected-species pixels remain at the same locations at both extremes.
  def pink(im):return {i for i,(r,g,b) in enumerate(im.convert('RGB').getdata()) if r>140 and r>g*1.25 and b>g*1.1}
  a,b=map(pink,images);self.assertGreater(len(a),500);self.assertGreater(len(a&b)/len(a|b),.95)
  self.click('Compare');self.page.wait_for_timeout(100)
  difference=ImageChops.difference(Image.open(BytesIO(canvas.screenshot())),Image.open(BytesIO(compare)))
  self.assertLess(sum(ImageStat.Stat(difference).mean),.5)
  self.click('Look through');self.assertEqual(self.stats()['slice'],16)
  for form in ['wood','shrub','all']:
   self.page.locator('#structure-focus').select_option(form);self.shot('focused-section-'+form)
  expect(self.page.locator('.structure-slice')).to_contain_text('Everything outside stays dim')
 def test_phone_controls_and_keyboard_rotation(self):
  self.page.set_viewport_size({'width':390,'height':844});self.start();self.lab()
  self.page.locator('#structure-focus').select_option('shrub');self.page.locator('#structure-lab canvas').last.focus();self.page.keyboard.press('ArrowRight')
  self.assertGreater(self.stats()['angle'],.1);self.shot('lab-phone-v2')
  self.assertLessEqual(self.page.locator('#structure-lab').evaluate('(e)=>e.scrollWidth'),390)
  self.back();expect(self.page.locator('#plot-notes')).to_be_visible()
 def test_without_webgl_lab_remains_interactive(self):
  b=self.p.chromium.launch(args=['--disable-webgl'])
  try:
   self.page=b.new_page(viewport={'width':1280,'height':900},reduced_motion='reduce');self.page.on('pageerror',lambda e:self.errors.append(str(e)));self.start();self.lab()
   self.assertTrue(self.page.evaluate('pyroceneDiagnostics().fallback'));self.page.locator('#structure-focus').select_option('liana');self.click('Look through');self.shot('lab-no-webgl-v2')
   self.back();self.click('Forest');expect(self.page.locator('[data-view=close]')).to_be_enabled()
  finally:b.close()

if __name__=='__main__':unittest.main()
