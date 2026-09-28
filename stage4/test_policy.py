"""Play the three payment rules and the funder's visible experiment."""
import threading
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from .serve import create_server

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')
class PolicyPlay(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  QA.mkdir(exist_ok=True,parents=True);cls.server=create_server(port=0)
  threading.Thread(target=cls.server.serve_forever,daemon=True).start();cls.base=f'http://127.0.0.1:{cls.server.server_port}'
  cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
 def setUp(self):
  self.ctx=self.browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce');self.page=self.ctx.new_page();self.errors=[];self.watch(self.page)
 def watch(self,p):
  p.on('pageerror',lambda e:self.errors.append(str(e)))
  p.on('console',lambda m:self.errors.append(m.text) if m.type=='error' and ('Shader' in m.text or 'VALIDATE_STATUS' in m.text) else None)
 def tearDown(self):self.ctx.close();self.assertEqual(self.errors,[])
 def click(self,name):self.page.get_by_role('button',name=name,exact=True).click()
 def start(self,mission):
  self.page.goto(self.base+'/policy.html?fast=1&mission='+mission);self.page.locator('#loading').wait_for(state='hidden',timeout=90000)
  self.page.locator('#briefing').get_by_role('button',name='Begin',exact=True).click()
 def settle(self):
  for _ in range(600):
   if self.page.locator('#result').is_visible() or not self.page.evaluate("document.body.classList.contains('busy')"):return
   if self.page.locator('#call').is_visible():self.page.locator('#call-ok').click()
   self.page.wait_for_timeout(100)
  self.fail('Season did not finish')
 def play(self,name):
  self.page.locator(f'.policy-pin:has-text("{name}")').click();self.page.locator('#patch-actions .primary').click();self.settle()
 def play_wait(self):self.page.locator('#patch-actions .wait').click();self.settle()
 def shot(self,name):self.page.wait_for_timeout(150);self.page.screenshot(path=str(QA/('policy-'+name+'.png')))
 def test_by_the_tonne(self):
  self.start('tonne')
  for name in ['Middle','East','North','Edge','Middle','Neck']:self.play(name)
  result=self.page.locator('#result');expect(result).to_be_visible();expect(result).to_contain_text('6 seasons done');expect(result).to_contain_text('You never planted')
  self.assertGreater(int(self.page.locator('#credits').inner_text()),25)
  self.click('Ten years on');expect(result).to_contain_text('TEN YEARS ON',timeout=60000);expect(result).to_contain_text('By the tonne, a healed forest is lost income.');self.shot('by-the-tonne')
 def test_by_the_tree_runs_out(self):
  self.start('tree')
  for name in ['Far','Far','Neck','Far']:self.play(name)
  for _ in range(4):
   if self.page.locator('#result').is_visible():break
   self.play_wait()
  expect(self.page.locator('#result')).to_be_visible();expect(self.page.locator('#result')).to_contain_text('Out of money')
 def test_cannot_spend_living_costs(self):
  self.start('both');self.play('Far');self.page.locator('.policy-pin:has-text("Far")').click()
  expect(self.page.locator('#patch-actions .primary')).to_be_disabled();expect(self.page.locator('#status')).to_contain_text('not yours to spend')
 def test_both_then_funder(self):
  self.start('both')
  for name in ['North','North','Middle','Middle','East','Neck','Neck','Edge','Edge','East','East','Edge']:self.play(name)
  result=self.page.locator('#result');expect(result).to_contain_text('12 seasons done')
  self.click('Ten years on');expect(result).to_contain_text('The forest pays for the people who keep it.',timeout=60000)
  self.click('What would you pay for?');expect(self.page.locator('#lab')).to_be_visible();self.click('Let a crew loose')
  expect(self.page.locator('#lab-verdict')).to_contain_text('That is a rule worth paying for.',timeout=120000);self.shot('both-then-funder')
  self.page.evaluate("""() => {for(const id of ['d-forest','d-pioneer']){const d=document.getElementById(id);d.value=0;d.dispatchEvent(new Event('input',{bubbles:true}));}}""")
  self.click('Try another rule');expect(self.page.locator('#lab-verdict')).to_contain_text('It never led back to the forest.',timeout=120000)
 def test_phone(self):
  self.page.set_viewport_size({'width':390,'height':800});self.start('tonne');self.play('Middle')
  self.assertEqual(self.errors,[]);expect(self.page.locator('#round-panel')).to_be_visible();self.shot('phone')

if __name__=='__main__':unittest.main()
