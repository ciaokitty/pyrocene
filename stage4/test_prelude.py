"""Play the paper board through visible controls and compare the frozen rules."""
import json
import subprocess
import threading
import unittest
from pathlib import Path

from playwright.sync_api import sync_playwright, expect
from .serve import create_server

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')
ROOT=Path(__file__).resolve().parent.parent

class PreludePlay(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  QA.mkdir(parents=True,exist_ok=True)
  cls.server=create_server(port=0);threading.Thread(target=cls.server.serve_forever,daemon=True).start()
  cls.base=f'http://127.0.0.1:{cls.server.server_port}'
  cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(args=['--disable-webgl'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1280,'height':850},reduced_motion='reduce');self.page=self.context.new_page();self.errors=[];self.requests=[]
  self.page.on('pageerror',lambda e:self.errors.append(str(e)));self.page.on('request',lambda r:self.requests.append(r.url))
  self.page.goto(self.base+'/prelude/');expect(self.page.locator('#credits')).to_have_text('8')
 def tearDown(self):self.context.close();self.assertEqual(self.errors,[])
 def move(self,key):
  if key is None:self.page.locator('#wait').click()
  else:self.page.get_by_role('button',name='Inspect '+key.title(),exact=True).click();self.page.locator('#work').click()
 def model(self,trace):
  script="import {newGame,act} from './stage4/ledger-model.mjs';const g=newGame('both');for(const k of "+json.dumps(trace)+")act(g,k);console.log(JSON.stringify(g));"
  return json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=ROOT,text=True))
 def test_short_lesson_then_free_play_matches_the_forest(self):
  self.page.screenshot(path=str(QA/'prelude-start.png'))
  trace=['middle','middle','neck','middle','east']
  for key in trace:
   self.assertEqual(self.page.evaluate('preludeDiagnostics().recommendation'),key)
   self.move(key)
  self.assertEqual(self.page.evaluate('preludeDiagnostics().game'),self.model(trace))
  expect(self.page.locator('#closed')).to_have_text('1 / 3')
  expect(self.page.locator('#lesson-label')).to_have_text('FIRST RECOVERY COMPLETE')
  self.page.screenshot(path=str(QA/'prelude-first-canopy.png'))
  self.assertLess(self.page.locator('#report').bounding_box()['y'],850)
  self.page.set_viewport_size({'width':1366,'height':768})
  box=self.page.locator('#report').bounding_box();self.assertLessEqual(box['y']+box['height'],768)
  self.page.screenshot(path=str(QA/'prelude-small-laptop.png'))
  self.page.locator('#hints').click();expect(self.page.locator('#hint')).to_be_hidden()
  for key in ['neck','neck','edge','edge','east','east','edge']:trace.append(key);self.move(key)
  self.assertEqual(self.page.evaluate('preludeDiagnostics().game'),self.model(trace))
  self.assertGreaterEqual(self.page.evaluate('preludeDiagnostics().summary.closed'),3)
  self.page.screenshot(path=str(QA/'prelude-three-canopies.png'))
  self.assertFalse(any('/assets/' in u or '/vendor/' in u for u in self.requests))
 def test_fire_regrowth_repeat_harvest_and_undo_are_not_hidden(self):
  trace=['middle','middle','east']
  for key in trace:self.move(key)
  expect(self.page.locator('#report')).to_contain_text('Fire killed')
  self.assertGreater(self.page.locator('.fire-trace').count(),0)
  self.page.screenshot(path=str(QA/'prelude-fire.png'))
  self.page.locator('#undo').click();trace.pop()
  self.assertEqual(self.page.evaluate('preludeDiagnostics().game'),self.model(trace))
  self.move('neck');self.assertEqual(self.page.locator('.fire-trace').count(),0)
  self.page.locator('#restart').click()
  for key in ['middle','east','neck','middle']:self.move(key)
  expect(self.page.locator('#report')).to_contain_text('native regrowth')
  self.assertEqual(self.page.evaluate('preludeDiagnostics().game.plots.middle.nativeLoss'),2)
  self.page.locator('#undo').click();self.assertEqual(self.page.evaluate('preludeDiagnostics().game.plots.middle.nativeLoss'),0)
 def test_bankruptcy_and_extension_keep_the_actual_budget(self):
  for _ in range(3):self.move(None)
  self.assertEqual(self.page.evaluate('preludeDiagnostics().game.status'),'broke')
  expect(self.page.locator('#hint')).to_contain_text('Undo');self.page.locator('#undo').click()
  self.assertEqual(self.page.evaluate('preludeDiagnostics().game.status'),'playing')
  self.page.locator('#restart').click()
  for key in 'middle far neck far north neck neck east neck north north north'.split():self.move(key)
  credits=self.page.locator('#credits').inner_text();self.page.locator('#continue').click()
  expect(self.page.locator('#credits')).to_have_text(credits)
  self.assertEqual(self.page.evaluate('preludeDiagnostics().game.rule.seasons'),16)
 def test_keyboard_phone_and_independent_forest_save(self):
  self.page.set_viewport_size({'width':390,'height':844})
  self.page.get_by_role('button',name='Inspect Middle',exact=True).focus();self.page.keyboard.press('Enter')
  expect(self.page.locator('#patch-title')).to_have_text('Middle');self.page.locator('#work').click()
  self.page.screenshot(path=str(QA/'prelude-phone.png'),full_page=True)
  self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),390)
  # Establish an actual forest save through its UI, then practise and return.
  self.page.set_viewport_size({'width':1280,'height':850})
  self.page.goto(self.base+'/ledger.html?fresh=1&fast=1');self.page.locator('#briefing[open]').wait_for(timeout=90000);self.page.locator('#briefing-begin').click()
  self.page.get_by_role('button',name='Inspect Middle',exact=True).click();self.page.locator('#patch-actions .primary').click();self.page.wait_for_function('!ledgerDiagnostics().busy')
  saved=self.page.evaluate('ledgerDiagnostics().game')
  self.page.get_by_role('link',name='Learn to play',exact=True).click();self.move('east');self.page.get_by_role('link',name='Enter the forest',exact=True).click()
  self.page.wait_for_function('globalThis.ledgerDiagnostics?.().game?.season===2',timeout=90000)
  self.assertEqual(self.page.evaluate('ledgerDiagnostics().game'),saved)

if __name__=='__main__':unittest.main()
