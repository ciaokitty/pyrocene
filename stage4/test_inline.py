"""Mouse-driven close detail, reverse morph and non-WebGL exploration."""
import threading
import unittest
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import sync_playwright, expect
from stage4.serve import create_server

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')

class InlineDetail(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=create_server('127.0.0.1',0)
  threading.Thread(target=cls.server.serve_forever,daemon=True).start()
  cls.base=f'http://127.0.0.1:{cls.server.server_port}';cls.p=sync_playwright().start()
  cls.browser=cls.p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  QA.mkdir(parents=True,exist_ok=True)
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1440,'height':900});self.page=self.context.new_page();self.errors=[]
  self.page.on('pageerror',lambda e:self.errors.append(str(e)))
 def tearDown(self):self.context.close();self.assertEqual(self.errors,[])
 def button(self,name):self.page.get_by_role('button',name=name,exact=True).click()
 def start(self):
  self.page.goto(self.base);self.page.locator('#loading').wait_for(state='hidden',timeout=60000)
  self.assertEqual(self.page.locator('dialog[open]').count(),0)
  self.assertEqual(self.page.locator('#radio-open,.radio-portrait').count(),0)
  self.button('More');self.button('Map');self.button('Explore C2')
  expect(self.page.locator('[data-view=close]')).to_be_enabled()
 def enter(self):
  self.button('Close view');self.page.wait_for_function('pyroceneDiagnostics().detailBlend===1')
  expect(self.page.locator('[data-specimen]')).to_have_count(3 if self.page.viewport_size['width']<=700 else 6)
  expect(self.page.locator('[data-view=forest]')).to_be_enabled()
 def test_close_labels_notes_and_reverse_in_same_scene(self):
  self.start();self.enter()
  d=self.page.evaluate('pyroceneDiagnostics()');self.assertTrue(d['airborneVisible']);self.assertEqual(d['detailSector'],13)
  self.assertTrue(d['modelledDetail']);self.assertGreater(d['detailPoints'],300000)
  self.assertEqual(d['points'],d['detailDrawn']+d['airborneDrawn'])
  self.assertEqual(self.page.locator('#observation-kind').count(),0)
  expect(self.page.locator('#network-open')).to_be_hidden()
  self.assertAlmostEqual(d['distance'],240,delta=1)
  self.assertAlmostEqual(d['elevation'],.785398,delta=.001)
  self.assertGreater(d['stemGuides'],100)
  self.assertEqual(self.page.locator('[data-plant]').count(),17)
  self.assertTrue(all(p['height']<8 for p in d['plantAnchors'] if p['id'] in ['urochloa_brizantha','megathyrsus_maximus','melinis_minutiflora']))
  self.assertAlmostEqual(d['cameraTarget'][0],-225,delta=1)
  self.assertTrue(self.page.locator('#plot-notes').is_visible())
  self.assertEqual(self.page.locator('#inspect,#notes-open,#field-action').count(),0)
  self.assertFalse(self.page.get_by_role('button',name='Send the field team',exact=True).count())
  self.page.screenshot(path=str(QA/'inline-ready.png'))
  self.page.locator('[data-specimen]').first.click()
  expect(self.page.locator('#plant-guide')).to_contain_text('invasive')
  expect(self.page.locator('#plant-guide')).to_contain_text('dry')
  expect(self.page.locator('#plant-guide')).to_contain_text('cattle')
  self.assertEqual(self.page.locator('#plant-guide img').count(),0)
  self.page.wait_for_timeout(350);self.page.screenshot(path=str(QA/'inline-plant-note.png'))
  self.button('Forest');self.page.wait_for_timeout(220)
  d=self.page.evaluate('pyroceneDiagnostics()');self.assertTrue(d['tls']);self.assertGreater(d['detailBlend'],0);self.assertLess(d['detailBlend'],1)
  self.assertAlmostEqual(d['distance'],240,delta=1)
  expect(self.page.locator('[data-view=close]')).to_be_enabled(timeout=10000)
  d=self.page.evaluate('pyroceneDiagnostics()');self.assertFalse(d['tls']);self.assertEqual(d['detailBlend'],0);self.assertGreater(d['distance'],1600)
  self.assertFalse(self.page.locator('#plot-notes').is_visible())
  self.page.screenshot(path=str(QA/'inline-forest-return.png'))
  self.enter();self.assertEqual(self.page.evaluate('pyroceneDiagnostics().plants'),1)
 def test_another_square_and_reduced_motion(self):
  self.page.emulate_media(reduced_motion='reduce');self.start();self.enter()
  first=self.page.evaluate('pyroceneDiagnostics().tlsCrop')
  self.button('More');self.button('Map');self.button('Explore B4')
  expect(self.page.locator('#place-coordinate')).to_have_text('FIELD POSITION B4')
  self.enter()
  self.page.wait_for_function('pyroceneDiagnostics().detailSector===9 && pyroceneDiagnostics().detailBlend===1')
  d=self.page.evaluate('pyroceneDiagnostics()');self.assertNotEqual(first,d['tlsCrop']);self.assertEqual(d['visited'],2)
  self.assertTrue(d['airborneVisible']);self.page.screenshot(path=str(QA/'inline-b4-final.png'))
 def test_failed_detail_keeps_map_and_can_retry(self):
  self.start();self.page.route('**/tls-expanded-*.bin',lambda r:r.abort())
  self.button('Close view');expect(self.page.locator('#toast')).to_contain_text('fetch',ignore_case=True)
  expect(self.page.locator('[data-view=close]')).to_be_enabled()
  self.assertEqual(self.page.evaluate('pyroceneDiagnostics().visited'),0)
  self.assertTrue(self.page.evaluate('pyroceneDiagnostics().airborneVisible'))
  self.page.unroute('**/tls-expanded-*.bin');self.enter()
 def test_lens_does_not_rewrite_airborne_points_and_stays_in_square(self):
  self.start()
  result=self.page.evaluate('''async()=>{
    const {ExpeditionForest}=await import('./expedition-render.mjs');
    const host=document.createElement('div');host.style.cssText='position:fixed;left:-200px;width:100px;height:100px';document.body.append(host);
    const f=new ExpeditionForest(host,{select:()=>{}});f.reducedMotion=true;await f.load();
    const original=new Float32Array(f.geometry.attributes.position.array);
    await f.setView('close',13);
    const unchanged=original.every((v,i)=>v===f.geometry.attributes.position.array[i]);
    const p=f.detailPositions;let inside=true;
    for(let n=0;n<p.length;n+=3)if(Math.abs(p[n]+225)>75||Math.abs(p[n+2]+75)>75||p[n+1]<0)inside=false;
    const visible=f.cloud.visible,blend=f.detailUniform.value,sector=f.sectorUniform.value;
    const originalDetail=new Float32Array(p),highCount=f.performance().detailDrawn;
    f.setQuality(true);const reduced=f.performance().detailDrawn<highCount;f.setQuality(false);
    await f.setView('forest',13);
    const cleared=f.detailPositions===null,restored=original.every((v,i)=>v===f.geometry.attributes.position.array[i]);
    await f.setView('close',13);const repeat=originalDetail.every((v,i)=>v===f.detailPositions[i]);
    return {unchanged,inside,visible,blend,sector,cleared,restored,reduced,repeat};
  }''')
  self.assertEqual(result,{'unchanged':True,'inside':True,'visible':True,'blend':1,'sector':13,'cleared':True,'restored':True,'reduced':True,'repeat':True})
 def test_phone_labels_are_clickable_above_notes(self):
  self.page.set_viewport_size({'width':390,'height':844});self.page.emulate_media(reduced_motion='reduce');self.start();self.enter()
  for name in self.page.locator('[data-specimen]').all_text_contents():
   self.page.locator('[data-specimen]').filter(has_text=name).click();expect(self.page.locator('#plant-guide')).to_be_visible();self.page.locator('#book-close').click()
  self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),390)
  self.page.screenshot(path=str(QA/'inline-phone.png'))
 def test_full_inventory_and_back_on_laptop_and_phone(self):
  self.page.emulate_media(reduced_motion='reduce');self.start();self.enter()
  ids=self.page.locator('[data-plant]').evaluate_all('(buttons)=>buttons.map(b=>b.dataset.plant)')
  for width in [1440,390]:
   self.page.set_viewport_size({'width':width,'height':900 if width==1440 else 844})
   for id in ids:
    self.page.locator('[data-plant="'+id+'"]').click()
    expect(self.page.locator('#plant-guide')).to_be_visible()
    self.assertEqual(self.page.evaluate('pyroceneDiagnostics().focusGuide'),id)
    expect(self.page.locator('[data-specimen="'+id+'"]')).to_have_count(1)
    self.page.locator('#book-back').click()
    expect(self.page.locator('[data-plant]')).to_have_count(17)
   self.page.screenshot(path=str(QA/f'inventory-{width}.png'))
  self.button('Forest');expect(self.page.locator('[data-view=close]')).to_be_enabled()
  self.assertEqual(self.page.evaluate('pyroceneDiagnostics().stemGuides'),0)
 def test_inventory_field_note_remains_available_without_assistant(self):
  self.page.emulate_media(reduced_motion='reduce');self.start();self.enter()
  self.page.locator('[data-plant=eugenia_sinemariensis]').click()
  expect(self.page.locator('.plain-note')).to_contain_text('GUYADIV')
  self.assertNotIn('undefined',self.page.locator('.plain-note').inner_text())
  self.assertNotIn('eugenia_sinemariensis',self.page.evaluate('JSON.parse(localStorage.getItem("pyrocene-expedition-v3")).uses'))
 def test_no_webgl_still_drags_zooms_and_opens_inline_detail(self):
  browser=self.p.chromium.launch(headless=True,args=['--disable-webgl'])
  try:
   self.page=browser.new_page(viewport={'width':1440,'height':900});self.page.on('pageerror',lambda e:self.errors.append(str(e)));self.start()
   self.assertTrue(self.page.evaluate('pyroceneDiagnostics().fallback'))
   expect(self.page.locator('.fallback-forest')).to_be_hidden()
   self.page.wait_for_timeout(300);canvas=self.page.locator('#landscape canvas')
   before=Image.open(BytesIO(canvas.screenshot()))
   self.page.mouse.move(650,400);self.page.mouse.down();self.page.mouse.move(850,460,steps=12);self.page.mouse.up();self.page.wait_for_timeout(450)
   after=Image.open(BytesIO(canvas.screenshot()))
   self.assertGreater(sum(ImageStat.Stat(ImageChops.difference(before,after)).mean),1)
   distance=self.page.evaluate('pyroceneDiagnostics().distance');self.page.mouse.wheel(0,-200);self.page.wait_for_timeout(400)
   self.assertLess(self.page.evaluate('pyroceneDiagnostics().distance'),distance)
   self.enter();self.page.locator('[data-specimen]').first.click();expect(self.page.locator('#plant-guide')).to_contain_text('cattle')
   self.page.wait_for_timeout(350);self.page.screenshot(path=str(QA/'inline-cpu-final.png'))
   self.button('Forest');expect(self.page.locator('[data-view=close]')).to_be_enabled(timeout=10000);self.assertFalse(self.page.evaluate('pyroceneDiagnostics().tls'))
  finally:browser.close()

if __name__=='__main__':unittest.main()
