"""Consistent record, overlapping transitions and cancellation through visible UI."""
import threading
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from .serve import create_server

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')
class FieldRecord(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=create_server(port=0);threading.Thread(target=cls.server.serve_forever,daemon=True).start();cls.base=f'http://127.0.0.1:{cls.server.server_port}'
  cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
 def test_expedition_records_and_overlapping_cancellable_close(self):
  page=self.browser.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  try:
   page.goto(self.base+'/expedition.html?fresh=1');page.locator('#loading').wait_for(state='hidden')
   page.evaluate('''async()=>{const {ExpeditionForest}=await import('./expedition-render.mjs');window.closeSamples=[];const enter=ExpeditionForest.prototype._enterTLS;ExpeditionForest.prototype._enterTLS=function(...args){window.overlapped=!!this.cameraMotion;return enter.apply(this,args);};const view=ExpeditionForest.prototype.setView;ExpeditionForest.prototype.setView=async function(...args){const r=await view.apply(this,args);if(args[0]==='close'&&r)closeSamples.push(this.closeTiming);return r;};}''')
   for name in ['More','Map','Explore C2','Close view']:page.get_by_role('button',name=name,exact=True).click()
   page.wait_for_function('closeSamples.length===1');self.assertTrue(page.evaluate('overlapped'));timing=page.evaluate('closeSamples[0]');self.assertLess(timing['totalMs'],1700);print('Overlapping Close view:',timing)
   page.locator('[data-specimen="urochloa_brizantha"]').click();expect(page.locator('.species-status')).to_have_text('Invasive');page.locator('.phosphor-frame canvas[data-loaded=true]').wait_for();page.screenshot(path=str(QA/'record-expedition-about.png'))
   page.get_by_role('tab',name='Germination').click();expect(page.locator('.seed-copy')).to_contain_text('simulated');expect(page.locator('.seed-clue')).to_contain_text('Patch A (C2):');expect(page.locator('.reading')).to_have_count(3);expect(page.locator('#record-seed figure')).not_to_be_visible();page.screenshot(path=str(QA/'record-expedition-germination.png'))
   page.locator('#book-close').click();page.locator('[data-specimen="doliocarpus_dentatus"]').click();page.get_by_role('tab',name='Dispersal').click();expect(page.locator('.seed-copy')).to_contain_text('teaching inventory');expect(page.locator('#record-seed figure')).to_be_visible();page.get_by_role('tab',name='Germination').click();expect(page.locator('.reading-band')).to_have_count(0);expect(page.locator('.seed-clue')).to_contain_text('not yet documented');page.locator('#book-close').click();page.get_by_role('button',name='Forest',exact=True).click();page.wait_for_function('!pyroceneDiagnostics().tls&& !pyroceneDiagnostics().transition');page.wait_for_timeout(1000)
   page.get_by_role('button',name='Close view',exact=True).click();expect(page.get_by_role('button',name='Forest',exact=True)).to_be_enabled();page.get_by_role('button',name='Forest',exact=True).click();page.wait_for_timeout(1800)
   self.assertEqual(page.evaluate('pyroceneDiagnostics().view'),'forest');self.assertFalse(page.evaluate('pyroceneDiagnostics().tls'));expect(page.get_by_role('button',name='Close view',exact=True)).to_be_enabled()
   page.get_by_role('button',name='Close view',exact=True).click();page.wait_for_function('pyroceneDiagnostics().detailBlend===1');page.locator('[data-specimen="cecropia_obtusa"]').click();page.get_by_role('tab',name='Dispersal').click();expect(page.locator('.seed-copy')).to_contain_text('bats')
   self.assertEqual(errors,[])
  finally:page.close()

if __name__=='__main__':unittest.main()
