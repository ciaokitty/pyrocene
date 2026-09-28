"""Visible play, not hidden state-driving: choices, inspection, replay and failure."""
import threading
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from .serve import create_server

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')
class LedgerPlay(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  QA.mkdir(parents=True,exist_ok=True);cls.server=create_server(port=0);threading.Thread(target=cls.server.serve_forever,daemon=True).start();cls.base=f'http://127.0.0.1:{cls.server.server_port}'
  cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce');self.page=self.context.new_page();self.errors=[];self.page.on('pageerror',lambda e:self.errors.append(str(e)))
  self.page.on('console',lambda m:self.errors.append(m.text) if m.type=='error' and ('Shader' in m.text or 'VALIDATE_STATUS' in m.text) else None)
 def tearDown(self):self.context.close();self.assertEqual(self.errors,[])
 def start(self,mission='both'):
  self.page.goto(self.base+'/ledger.html?fresh=1&fast=1&mission='+mission);self.page.locator('#briefing[open]').wait_for(timeout=90000);self.page.locator('#briefing-begin').click()
 def settle(self):self.page.wait_for_function('!ledgerDiagnostics().busy && !ledgerDiagnostics().moving')
 def choose(self,key):self.page.get_by_role('button',name='Inspect '+key.title(),exact=True).click();self.settle()
 def work(self,key):
  self.choose(key);self.page.locator('#patch-actions .primary').click();self.settle()
 def shot(self,name):self.page.wait_for_timeout(350);self.page.screenshot(path=str(QA/('ledger-'+name+'.png')))
 def test_canvas_selection_and_drag_keep_the_map_interactive(self):
  self.start();self.page.get_by_role('button',name='Overhead',exact=True).click();self.settle();self.page.wait_for_timeout(1000)
  pin=self.page.get_by_role('button',name='Inspect Middle',exact=True).bounding_box()
  self.page.mouse.click(pin['x']+pin['width']/2,pin['y']+pin['height']+24)
  self.page.wait_for_function('ledgerDiagnostics().selected==="middle"')
  before=self.page.get_by_role('button',name='Inspect Middle',exact=True).bounding_box()
  self.page.mouse.move(760,650);self.page.mouse.down();self.page.mouse.move(870,600,steps=12);self.page.mouse.up();self.page.wait_for_timeout(1000)
  after=self.page.get_by_role('button',name='Inspect Middle',exact=True).bounding_box()
  self.assertGreater(abs(after['x']-before['x'])+abs(after['y']-before['y']),5)
  self.assertEqual(self.page.evaluate('ledgerDiagnostics().moves.length'),0)
 def test_paced_inspection_ledger_and_rewind(self):
  self.start();self.choose('middle');self.page.get_by_role('button',name='Close view',exact=True).click();self.settle();self.shot('close')
  self.page.locator('[data-specimen="cecropia_obtusa"]').click();self.page.get_by_role('tab',name='Dispersal').click();expect(self.page.locator('.seed-clue')).to_contain_text('interrupted');self.shot('native-seeds');self.page.locator('#record-close').click()
  self.page.get_by_role('button',name='Structure',exact=True).click();self.page.wait_for_function('ledgerDiagnostics().lab.draws>0');self.shot('structure');self.page.locator('#structure-lab').get_by_role('button',name='Back',exact=True).click()
  self.page.locator('#patch-actions .primary').click();self.settle();expect(self.page.locator('#ledger-count')).to_have_text('1')
  for key in ['middle','neck','middle','east']:self.work(key)
  expect(self.page.locator('#closed-count')).to_contain_text('1 / 3');self.shot('first-shade')
  snapshot=self.page.evaluate('ledgerDiagnostics().game');self.page.locator('#history-disclosure summary').click();self.page.locator('#history').fill('1');self.page.locator('#history').dispatch_event('input');expect(self.page.locator('#status')).to_contain_text('Past turn');self.assertEqual(self.page.evaluate('ledgerDiagnostics().game'),snapshot)
  self.page.locator('#resume').click();self.page.locator('#undo').click();self.settle();self.assertEqual(self.page.evaluate('ledgerDiagnostics().moves.length'),4);self.work('east');self.assertEqual(self.page.evaluate('ledgerDiagnostics().game'),snapshot)
  for key in ['neck','neck','edge','edge','east','east','edge']:self.work(key)
  expect(self.page.locator('#result')).to_be_visible();self.assertGreaterEqual(self.page.evaluate('ledgerDiagnostics().summary.closed'),3);self.shot('paced-result')
  self.page.locator('#result-back').click();self.choose('middle');self.page.get_by_role('button',name='Close view',exact=True).click();self.settle();self.shot('restored-close')
 def test_greedy_creates_regrowth_cost_and_replay_changes_it(self):
  self.start();
  for key in ['middle','east','neck','middle']:self.work(key)
  self.assertEqual(self.page.evaluate('ledgerDiagnostics().game.plots.middle.nativeLoss'),2);expect(self.page.locator('#call-text')).to_contain_text('native regrowth');self.shot('repeat-clearance')
  self.page.locator('#undo').click();self.settle();self.assertEqual(self.page.evaluate('ledgerDiagnostics().game.plots.middle.nativeLoss'),0)
  self.work('east');self.assertEqual(self.page.evaluate('ledgerDiagnostics().game.plots.middle.nativeLoss'),0)
 def test_tree_rule_bankruptcy_is_recoverable(self):
  self.start('tree')
  for key in ['far','far','neck','far']:self.work(key)
  while self.page.evaluate('ledgerDiagnostics().game.status')=='playing':self.page.get_by_role('button',name='Let six months pass',exact=True).click();self.settle()
  expect(self.page.locator('#result-title')).to_have_text('The crew needs other work.');self.shot('tree-result');self.page.locator('#result-undo').click();self.assertEqual(self.page.evaluate('ledgerDiagnostics().game.status'),'playing')
 def test_independent_agent_paths_have_different_visible_outcomes(self):
  paths=[('income','middle east edge north middle east middle east neck middle east neck',2,44),('learning','middle east neck east east neck middle neck middle neck middle middle',3,58),('missed-fire','east middle north east middle north east middle north wait wait wait',0,26)]
  for label,trace,closed,health in paths:
   self.start()
   for key in trace.split():
    if key=='wait':self.page.get_by_role('button',name='Let six months pass',exact=True).click();self.settle()
    else:self.work(key)
   s=self.page.evaluate('ledgerDiagnostics().summary');self.assertEqual(s['closed'],closed);self.assertEqual(s['health'],health);self.shot('agent-'+label)
 def test_more_time_keeps_the_same_budget_and_can_finish_existing_work(self):
  self.start()
  for key in 'middle far neck far north neck neck east neck north north north'.split():self.work(key)
  before=self.page.evaluate('ledgerDiagnostics().summary');self.assertEqual(before['closed'],2);self.page.locator('#result-continue').click();self.assertEqual(self.page.evaluate('ledgerDiagnostics().game.credits'),before['credits'])
  self.assertEqual(self.page.evaluate('ledgerDiagnostics().game.rule.seasons'),16)
  for key in ['north','east']:self.work(key)
  self.page.goto(self.base+'/ledger.html');self.page.locator('#loading').wait_for(state='hidden');self.page.wait_for_function('ledgerDiagnostics().game?.season===15');self.assertEqual(self.page.evaluate('ledgerDiagnostics().game.rule.seasons'),16)
  for _ in range(2):self.page.get_by_role('button',name='Let six months pass',exact=True).click();self.settle()
  self.assertEqual(self.page.evaluate('ledgerDiagnostics().summary.closed'),3);self.assertGreater(self.page.evaluate('ledgerDiagnostics().summary.credits'),0);self.shot('far-route-extended')
 def test_phone_without_webgl_has_choices_records_and_history(self):
  browser=self.p.chromium.launch(args=['--disable-webgl']);page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
  try:
   page.goto(self.base+'/ledger.html?fresh=1&fast=1');page.locator('#briefing[open]').wait_for(timeout=60000);page.locator('#briefing-begin').click();page.get_by_role('button',name='Inspect Middle',exact=True).click();page.get_by_role('button',name='Close view',exact=True).click();page.wait_for_function('!ledgerDiagnostics().moving');page.locator('[data-specimen="cecropia_obtusa"]').click();page.get_by_role('tab',name='Germination').click();page.screenshot(path=str(QA/'ledger-phone-record.png'));page.locator('#record-close').click();page.locator('#patch-actions .primary').click();page.wait_for_function('!ledgerDiagnostics().busy');expect(page.locator('#ledger-count')).to_have_text('1');page.screenshot(path=str(QA/'ledger-phone-map.png'))
  finally:browser.close()

if __name__=='__main__':unittest.main()
