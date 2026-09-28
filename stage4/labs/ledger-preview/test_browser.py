"""Exercise live forest previews without writing to the accepted shared room."""
import importlib
import threading
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')

class LedgerPreview(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=importlib.import_module('stage4.labs.ledger-preview.serve').create_server(port=0)
  threading.Thread(target=cls.server.serve_forever,daemon=True).start()
  cls.base=f'http://127.0.0.1:{cls.server.server_port}/labs/ledger-preview/index.html'
  cls.p=sync_playwright().start()
  cls.browser=cls.p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  QA.mkdir(parents=True,exist_ok=True)
 @classmethod
 def tearDownClass(cls):
  cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
 def test_variants_and_shared_seed_panel(self):
  page=self.browser.new_page(viewport={'width':1440,'height':1000});errors=[];writes=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:writes.append(r.url) if r.method=='POST' else None)
  try:
   page.goto(self.base);page.locator('#loading').wait_for(state='hidden')
   for style in ['chain','fill','rail']:
    page.locator(f'button[data-style={style}]').click()
    expect(page.locator('body')).to_have_attribute('data-style',style)
    page.screenshot(path=str(QA/f'ledger-preview-{style}.png'))
   page.locator('button[data-style=chain]').click()
   page.get_by_role('button',name='Patch D (C4): Weeds returning',exact=True).click()
   expect(page.locator('#patch-name')).to_have_text('C4')
   page.get_by_role('button',name='Close view',exact=True).click()
   page.locator('[data-specimen="urochloa_decumbens"]').click(timeout=20000)
   expect(page.locator('.species-status')).to_have_text('Invasive')
   page.get_by_role('tab',name='Dispersal').click()
   expect(page.locator('.seed-clue')).to_contain_text('Patch D (C4)')
   page.screenshot(path=str(QA/'ledger-preview-dispersal.png'))
   page.get_by_role('tab',name='Germination').click()
   expect(page.locator('.reading')).to_have_count(3)
   expect(page.locator('.seed-map')).not_to_be_visible()
   page.screenshot(path=str(QA/'ledger-preview-germination.png'))
   page.get_by_role('button',name='Back',exact=True).click()
   page.get_by_role('button',name='Patch A (C2): Young canopy',exact=True).click()
   page.locator('#species-picker').select_option('cecropia_obtusa')
   expect(page.locator('.species-status')).to_have_text('Native')
   page.get_by_role('tab',name='Germination').click()
   expect(page.locator('.seed-clue')).to_contain_text('native pioneer')
   page.screenshot(path=str(QA/'ledger-preview-native.png'),animations='disabled')
   page.get_by_role('button',name='Back',exact=True).click()
   page.get_by_role('button',name='Patch D (C4): Weeds returning',exact=True).click()
   page.get_by_text('Try ledger changes',exact=True).click()
   page.get_by_role('button',name='Canopy closes',exact=True).click()
   expect(page.locator('#ledger-count')).to_have_text('3 / 5 plots')
   expect(page.locator('#demo-status')).to_contain_text('Care complete')
   page.get_by_role('button',name='Patch A (C2): Young canopy',exact=True).click()
   page.get_by_role('button',name='Reinvaded',exact=True).click()
   expect(page.locator('#demo-status')).to_contain_text('Restoration lost')
   expect(page.locator('#ledger-count')).to_have_text('2 / 5 plots')
   page.get_by_role('button',name='Reset preview',exact=True).click()
   page.get_by_role('button',name='Work another plot',exact=True).click()
   expect(page.locator('#ledger-count')).to_have_text('5 / 5 plots')
   expect(page.get_by_role('button',name='Work another plot',exact=True)).to_be_disabled()
   page.locator('#preview-stage').select_option('Negligence');expect(page.locator('#ledger')).not_to_be_visible()
   page.locator('#preview-stage').select_option('Vigilance');expect(page.locator('#ledger')).to_be_visible()
   page.set_viewport_size({'width':390,'height':844})
   self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'),390)
   page.screenshot(path=str(QA/'ledger-preview-phone.png'))
   self.assertEqual(errors,[]);self.assertEqual(writes,[])
  finally:page.close()
 def test_cpu_forest_and_panels(self):
  browser=self.p.chromium.launch(args=['--disable-webgl']);page=browser.new_page(viewport={'width':1280,'height':900});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  try:
   page.goto(self.base);page.locator('#loading').wait_for(state='hidden')
   page.wait_for_function('''()=>{const c=document.querySelector('.fallback-overlay');return c&&c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0);}''')
   page.locator('#species-picker').select_option('urochloa_brizantha')
   page.get_by_role('tab',name='Germination').click();expect(page.locator('.reading')).to_have_count(3)
   page.screenshot(path=str(QA/'ledger-preview-cpu.png'))
   self.assertEqual(errors,[])
  finally:browser.close()

if __name__=='__main__':unittest.main()
