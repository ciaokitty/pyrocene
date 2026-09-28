"""Visible-control playthroughs and alternate pacing experiments."""
import json
import threading
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from .serve import create_server

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')
class ExpeditionPlay(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  QA.mkdir(exist_ok=True,parents=True);cls.server=create_server(port=0)
  threading.Thread(target=cls.server.serve_forever,daemon=True).start();cls.base=f'http://127.0.0.1:{cls.server.server_port}'
  cls.pw=sync_playwright().start();cls.browser=cls.pw.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.pw.stop();cls.server.shutdown();cls.server.server_close()
 def setUp(self):
  self.ctx=self.browser.new_context(viewport={'width':1440,'height':900});self.page=self.ctx.new_page();self.errors=[];self.external=[];self.bad=[]
  self.page.on('pageerror',lambda e:self.errors.append(str(e)))
  self.page.on('response',lambda r:self.bad.append((r.status,r.url)) if r.status>=400 else None)
  def route(r):
   if r.request.url.startswith(self.base) or r.request.url.startswith('blob:'):r.continue_()
   else:self.external.append(r.request.url);r.abort()
  self.page.route('**/*',route)
 def tearDown(self):self.ctx.close();self.assertEqual(self.errors,[]);self.assertEqual(self.external,[]);self.assertEqual(self.bad,[])
 def button(self,name):self.page.get_by_role('button',name=name,exact=True).click()
 def start(self,mode='cases',references=False):
  self.page.goto(self.base+'/expedition.html?mode='+mode+('&references=1' if references else ''));self.page.wait_for_selector('#loading',state='hidden')
 def visit(self,id):
  self.button('More');self.button('Map');self.button('Explore '+chr(65+id//6)+str(id%6+1))
  expect(self.page.locator('#place-coordinate')).to_have_text('FIELD POSITION '+chr(65+id//6)+str(id%6+1))
  expect(self.page.locator('[data-view=close]')).to_be_enabled()
  if self.page.evaluate('pyroceneDiagnostics().view')!='close':self.button('Close view')
  self.page.wait_for_function('(id)=>pyroceneDiagnostics().detailSector===id && pyroceneDiagnostics().detailBlend===1',arg=id)
  expect(self.page.locator('[data-view=forest]')).to_be_enabled()
  expect(self.page.locator('[data-specimen]')).to_have_count(3 if self.page.viewport_size['width']<=700 else 6)
 def plants(self):
  names=self.page.locator('[data-specimen]').all_text_contents()
  for name in names:
   self.page.locator('[data-specimen]').filter(has_text=name).click()
   expect(self.page.locator('.plain-note')).to_be_visible()
   self.page.locator('#book-close').click()
  return names
 def mission(self,n):
  self.page.locator('#assignment').click();self.page.locator('#mission-list .mission-option button').nth(n).click()
 def notes(self,kind):
  self.button('Field notes');self.page.locator('#note-tabs').get_by_role('button',name=kind,exact=True).click()
 def shot(self,name):self.page.wait_for_timeout(600);self.page.screenshot(path=str(QA/f'{name}.png'))
 def test_four_missions_read_uses_recall_and_restore(self):
  self.start();self.assertEqual(self.page.locator('.plot-pin').count(),0)
  for id in [13,0,1]:self.visit(id);self.plants()
  self.page.locator('#assignment').click();self.button('Report findings');self.button('Back');self.mission(1)
  self.visit(15);self.assertIn('cut',self.page.locator('#plot-notes').inner_text());self.plants();self.shot('11-disturbance')
  self.page.locator('#assignment').click();self.button('Report findings');self.button('Back');self.mission(2)
  self.visit(14);self.assertIn('moist',self.page.locator('#plot-notes').inner_text());self.shot('12-damp-gap')
  self.page.locator('#assignment').click();self.button('Report findings');self.button('Back');self.mission(3)
  self.visit(2);self.assertIn('carbon',self.page.locator('#plot-notes').inner_text());self.plants()
  self.visit(29);self.assertIn('fruit',self.page.locator('#plot-notes').inner_text());self.plants()
  self.page.locator('#assignment').click();self.button('Report findings');self.button('Back');self.button('More');self.button('Game master');self.shot('15-gm-recall')
  self.assertIn('Which small patches joined up?',self.page.locator('#gm').inner_text());self.assertEqual(self.page.evaluate('pyroceneDiagnostics().completed'),4)
  self.page.reload();self.page.wait_for_selector('#loading',state='hidden');self.assertEqual(self.page.evaluate('pyroceneDiagnostics().completed'),4)
  self.button('More');self.button('Sources');self.assertIn('Verra',self.page.locator('#sources').inner_text())
 def test_three_pacing_variants(self):
  results=[]
  for mode in ['wander','collection','cases']:
   self.page.goto(self.base+'/expedition.html?mode='+mode);self.page.wait_for_selector('#loading',state='hidden')
   findings=[]
   for id in [13,0,1]:self.visit(id);findings.extend(self.plants())
   self.page.locator('#assignment').click();self.shot('variant-'+mode)
   results.append({'mode':mode,'findings':findings,'missions':self.page.locator('#missions').inner_text()})
   # Isolate the next rules experiment through the visible reset action.
   self.button('Back');self.button('More');self.button('Settings');self.page.once('dialog',lambda d:d.accept());self.button('Start a new exploration');self.page.wait_for_selector('#loading',state='hidden')
  (QA/'pacing-observations.json').write_text(json.dumps(results,indent=2))
 def test_assistant_absent_on_start_mission_selection_and_reload(self):
  self.start();self.assertEqual(self.page.locator('dialog[open],#radio-open,.radio-portrait').count(),0)
  self.shot('assistant-removed-start');self.mission(2)
  self.assertEqual(self.page.locator('dialog[open]').count(),0);self.visit(14)
  self.page.reload();self.page.wait_for_selector('#loading',state='hidden')
  self.assertEqual(self.page.locator('dialog[open],#radio-open,.radio-portrait').count(),0)
  self.button('More');self.button('Sources');self.assertNotIn('Lia',self.page.locator('#sources').inner_text())
 def test_mobile_all_named_plants_and_photo(self):
  self.page.set_viewport_size({'width':390,'height':844});self.start();self.visit(13);self.plants();self.shot('16-mobile')
  self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),390)
  self.assertEqual(self.page.locator('.plot-pin').count(),0)
 def test_free_world_pick_and_ground_fallback(self):
  self.start();self.button('Overhead');expect(self.page.locator('[data-view="overhead"]')).to_be_enabled()
  self.page.locator('#landscape canvas').click(position={'x':700,'y':420})
  expect(self.page.locator('#place-context')).to_be_visible();self.button('Close view')
  expect(self.page.locator('[data-specimen]')).to_have_count(6);expect(self.page.locator('[data-view=forest]')).to_be_enabled();self.plants();self.shot('25-free-world-pick')
  b=self.pw.chromium.launch(headless=True,args=['--disable-webgl']);p=b.new_page(viewport={'width':1280,'height':720});p.on('pageerror',lambda e:self.errors.append(str(e)))
  p.goto(self.base+'/expedition.html');p.wait_for_selector('#loading',state='hidden')
  for name in ['More','Map','Explore C2','Close view']:p.get_by_role('button',name=name,exact=True).click()
  expect(p.locator('[data-specimen]')).to_have_count(6);expect(p.locator('[data-view=forest]')).to_be_enabled();p.locator('[data-specimen]').first.click()
  self.assertIn('Marandu grass',p.locator('#plant-guide').inner_text());self.assertTrue(p.evaluate('pyroceneDiagnostics().fallback'));p.screenshot(path=str(QA/'26-ground-fallback.png'));b.close()
 def test_sensor_grant_temporal_compare_and_team_pool(self):
  self.start(references=True);self.button('More');self.button('Sensor network');self.page.locator('#sensor-team').fill('Camera team');self.button('Camera traps')
  self.page.locator('.sensor-stations button').first.click();self.shot('21-camera-day0')
  first=self.page.locator('#station-detail').inner_text();self.page.locator('#sensor-interpretation').fill('Compare the edge with the damp station before assigning a cause.');self.button('Keep this thought')
  for _ in range(3):self.button('Finish this field round')
  self.page.locator('.sensor-stations button').first.click();last=self.page.locator('#station-detail').inner_text();self.assertNotEqual(first,last)
  self.button('Day 0');self.assertIn('Compare the edge',self.page.locator('#sensor-interpretation').input_value());self.button('Day 3')
  other=self.browser.new_context(viewport={'width':1440,'height':900});p=other.new_page()
  p.on('pageerror',lambda e:self.errors.append(str(e)))
  p.goto(self.base+'/expedition.html?references=1');p.wait_for_selector('#loading',state='hidden');p.get_by_role('button',name='More',exact=True).click();p.get_by_role('button',name='Sensor network',exact=True).click();p.locator('#sensor-team').fill('Sound team');p.get_by_role('button',name='Sound recorders',exact=True).click()
  for _ in range(3):p.get_by_role('button',name='Finish this field round',exact=True).click()
  with p.expect_download() as download:p.get_by_role('button',name='Save records for another team',exact=True).click()
  packet=Path(download.value.path()).read_bytes();other.close()
  self.page.locator('#sensor-import').set_input_files({'name':'sound-team.json','mimeType':'application/json','buffer':packet})
  expect(self.page.locator('.sensor-stations button').first).to_contain_text('2 record types');self.page.locator('.sensor-stations button').first.click();self.assertIn('Different kinds of evidence',self.page.locator('#station-detail').inner_text());self.shot('22-pooled-evidence')
  self.page.locator('#sensor-import').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{"topic":"wrong"}'})
  expect(self.page.locator('#toast')).to_contain_text('Cannot add');self.assertEqual(self.page.locator('.sensor-record').count(),2)
  self.button('Compare canopy surveys');self.assertIn('Practice canopy openings',self.page.locator('#match-count').inner_text());self.shot('23-changing-canopy')
  self.page.reload();self.page.wait_for_selector('#loading',state='hidden');self.assertEqual(self.page.evaluate('pyroceneDiagnostics().network.day'),3)
  self.assertEqual(self.page.evaluate('pyroceneDiagnostics().network.shared'),4)
 def test_memory_reconstruction_fire_and_blank_print(self):
  self.page.goto(self.base+'/memory.html?blank=1');expect(self.page.locator('#status')).to_have_text('Paper map ready');self.page.locator('#team').fill('Field recollections')
  for cell,marks,why in [(13,['dry','invasive'],'Dry grass joined the opening.'),(14,['damp','disturbance'],'A tree fell but the litter was damp.'),(33,['people','ignition'],'A planned field burn needed coordination.'),(2,['habitat','people'],'Standing forest had several uses.')]:
   self.page.locator('#sector-picker').select_option(str(cell))
   for mark in marks:self.page.locator(f'fieldset input[value="{mark}"]').check()
   self.page.locator('#why').fill(why);self.button('Paint recollection')
  self.button('Commit paper map');self.button('Play fire');expect(self.page.locator('#result')).to_be_visible();self.page.wait_for_timeout(1200);self.assertGreater(float(self.page.locator('#time').input_value()),0);self.button('Pause fire');self.page.locator('#time').focus();self.page.locator('#time').press('End');self.shot('24-recall-fire');self.button('Back to paper map')
  self.page.get_by_text('Historical evidence',exact=True).click();self.button('Load 2023 mapped fire');self.page.locator('#show-history').check();self.assertIn('separate evidence',self.page.locator('#history-note').inner_text())
  with self.page.expect_download() as download:self.button('Export JSON')
  record=json.loads(Path(download.value.path()).read_text());self.assertTrue(record['committed']);self.assertEqual(record['snapshotDay'],3);self.assertEqual(len(record['cells']),4)
  self.button('Open fire comparison')
  for name in ['Second team','Third team']:
   other={**record,'teamName':name};self.page.locator('#compare').set_input_files({'name':'team.json','mimeType':'application/json','buffer':json.dumps(other).encode()});expect(self.page.locator('#comparison')).to_contain_text(name)
  expect(self.page.locator('#leaderboard li')).to_have_count(3);self.button('Back to paper map')
  self.page.goto(self.base+'/memory.html?blank=1');expect(self.page.locator('#status')).to_have_text('Paper map ready');self.page.emulate_media(media='print');self.page.pdf(path=str(QA/'blank-memory-map.pdf'),format='A4')
if __name__=='__main__':unittest.main()
