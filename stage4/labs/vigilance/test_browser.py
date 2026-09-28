import json
import subprocess
import threading
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from .serve import create_server

ROOT=Path(__file__).resolve().parents[3]
QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')
class VigilancePlay(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=create_server(port=0);threading.Thread(target=cls.server.serve_forever,daemon=True).start();cls.base=f'http://127.0.0.1:{cls.server.server_port}'
  cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce');self.page=self.context.new_page();self.errors=[];self.page.on('pageerror',lambda e:self.errors.append(str(e)))
  self.page.on('console',lambda m:self.errors.append(m.text) if m.type=='error' and 'Shader' in m.text else None)
  self.page.goto(self.base+'/labs/vigilance/index.html');self.page.locator('#about[open]').wait_for(timeout=90000);self.page.locator('#begin').click()
 def tearDown(self):self.context.close();self.assertEqual(self.errors,[])
 def choose(self,key):self.page.get_by_role('button',name='Inspect '+key.title(),exact=True).click()
 def work(self,key):self.choose(key);self.page.locator('#work').click();self.page.wait_for_function('!vigilanceDiagnostics().busy')
 def buy(self,name,kind='information'):
  self.page.locator('#invest').click();self.page.locator(f'[data-shop={kind}]').click();self.page.get_by_role('button',name='Buy '+name,exact=True).click();self.page.locator('#shop-close').click()
 def snapshot(self):return self.page.evaluate('vigilanceDiagnostics().public')
 def shot(self,name):self.page.screenshot(path=str(QA/('vigilance-'+name+'.png')))
 def test_paid_evidence_no_turn_undo_and_close(self):
  self.choose('middle');self.assertNotIn('invasives',self.snapshot()['plots'][0]);self.work('middle');turn=self.snapshot()['turn'];self.buy('Invasive survey')
  self.assertEqual(self.snapshot()['turn'],turn);self.assertIn('invasives',self.snapshot()['plots'][0]);self.shot('paid-map')
  self.page.get_by_role('button',name='Close view',exact=True).click();self.page.wait_for_function('!vigilanceDiagnostics().moving');self.shot('close');self.assertGreater(self.page.locator('[data-specimen]').count(),0)
  self.page.locator('[data-specimen]').first.click();self.assertEqual(self.page.locator('#guide-content [role=tab]').count(),1);self.page.locator('#record-close').click();self.page.locator('#undo').click();self.page.wait_for_function('!vigilanceDiagnostics().moving')
  self.assertNotIn('invasives',self.snapshot()['plots'][0]);self.assertEqual(self.snapshot()['turn'],turn)
 def test_protection_expires_and_same_moves_match_engine(self):
  self.work('middle');self.work('neck');self.work('neck');self.buy('Community care','protection');self.buy('Firebreak','protection');self.work('east');self.work('edge');self.work('middle')
  moves=self.page.evaluate('vigilanceDiagnostics().moves');script="import {replay,observe} from './stage4/labs/vigilance/model.mjs';console.log(JSON.stringify(observe(replay(113,"+json.dumps(moves)+"))));"
  expected=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=ROOT,text=True));self.assertEqual(self.snapshot(),expected);self.shot('protection')
 def test_complete_public_policy_through_ui(self):
  script="import {simulate} from './stage4/labs/vigilance/evaluate.mjs';console.log(JSON.stringify(simulate('informed',113)));"
  run=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=ROOT,text=True))
  names={'heatmap':'Invasive survey','ews':'Weather alerts','community':'Community care','mulch':'Protect soil','firebreak':'Firebreak'}
  for move in run['moves']:
   if move['type']=='buy':
    if move['key']:self.choose(move['key'])
    self.buy(names[move['tool']],'information' if move['tool'] in ['heatmap','ews'] else 'protection')
   elif move['verb']=='wait':self.page.locator('#wait').click();self.page.wait_for_function('!vigilanceDiagnostics().busy')
   else:self.work(move['key'])
  self.assertEqual(self.snapshot()['metrics']['targets'],run['targets']);self.assertEqual(self.snapshot()['metrics']['credits'],run['credits']);self.shot('full-run')
 def test_no_webgl_can_buy_and_read_a_weather_map(self):
  browser=self.p.chromium.launch(args=['--disable-webgl']);page=browser.new_page(viewport={'width':1280,'height':850},reduced_motion='reduce')
  try:
   page.goto(self.base+'/labs/vigilance/index.html');page.locator('#about[open]').wait_for(timeout=90000);page.locator('#begin').click();page.get_by_role('button',name='Inspect Neck',exact=True).click();page.locator('#invest').click();page.get_by_role('button',name='Buy Weather alerts',exact=True).click();page.locator('#shop-close').click();expect(page.locator('#observations')).to_contain_text('Dryness');page.locator('#work').click();page.wait_for_function('!vigilanceDiagnostics().busy');page.get_by_role('button',name='Close view',exact=True).click();page.wait_for_function('!vigilanceDiagnostics().moving');page.screenshot(path=str(QA/'vigilance-no-webgl.png'));self.assertTrue(page.evaluate('vigilanceDiagnostics().forest.fallback'));self.assertGreater(page.evaluate('vigilanceDiagnostics().forest.detailPoints'),2000)
  finally:browser.close()
 def test_actual_haiku_win_and_closed_forest(self):
  # Actual final CLI tool trace, not the player's prose or a hidden-state policy.
  tokens='clear:east plant:east buy:community:east clear:middle clear:north buy:firebreak:east buy:mulch:east wait wait wait wait clear:edge plant:edge buy:community:edge buy:firebreak:edge clear:middle clear:north clear:far clear:neck plant:neck buy:community:neck buy:firebreak:neck buy:mulch:edge buy:mulch:neck wait wait wait wait wait'.split()
  names={'community':'Community care','firebreak':'Firebreak','mulch':'Protect soil'}
  for token in tokens:
   parts=token.split(':')
   if parts[0]=='buy':self.choose(parts[2]);self.buy(names[parts[1]],'protection')
   elif parts[0]=='wait':self.page.locator('#wait').click();self.page.wait_for_function('!vigilanceDiagnostics().busy')
   else:self.work(parts[1])
  v=self.snapshot();self.assertEqual((v['turn'],v['metrics']['credits'],v['metrics']['health'],v['metrics']['targets']),(21,33,65,3));self.assertTrue(v['metrics']['won']);self.choose('neck');self.page.get_by_role('button',name='Close view',exact=True).click();self.page.wait_for_function('!vigilanceDiagnostics().moving');self.shot('haiku-win-close');expect(self.page.locator('#ledger-rows')).to_contain_text('No unfinished planting')

if __name__=='__main__':unittest.main()
