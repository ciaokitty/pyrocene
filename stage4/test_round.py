"""Play through the visible expedition, briefing, proposal and shared sliders."""
import threading
import unittest
import json
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import sync_playwright, expect
from .serve import create_server

QA=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition')
class RoundPlay(unittest.TestCase):
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
 def click(self,name,p=None):(p or self.page).get_by_role('button',name=name,exact=True).click()
 def begin(self,p=None):
  p=p or self.page;p.locator('#briefing[open]').wait_for();self.click('Begin',p)
 def start(self,p=None,url=None):
  p=p or self.page;p.goto(url or self.base+'/round.html');p.locator('#loading').wait_for(state='hidden',timeout=60000)
  if '/expedition.html' in p.url:p.locator('#game-mode').select_option('play')
  self.begin(p)
 def inspect(self,key,p=None):
  p=p or self.page;self.click('Patch '+key,p);p.wait_for_function('!roundDiagnostics().busy')
  if p.evaluate('roundDiagnostics().view')!='close':self.click('Close view',p)
  p.wait_for_function('!roundDiagnostics().busy');expect(p.get_by_role('button',name='Propose',exact=True)).to_be_visible()
 def shot(self,name):self.page.wait_for_timeout(150);self.page.screenshot(path=str(QA/(name+'.png')))
 def seek(self,id,value,p=None):
  p=p or self.page;p.locator('#'+id).fill(str(value));p.locator('#'+id).dispatch_event('input');p.wait_for_timeout(100)
 def test_expedition_role_briefing_play_sliders_and_reset(self):
  self.page.goto(self.base+'/expedition.html');self.page.locator('#loading').wait_for(state='hidden');self.shot('play-01-expedition')
  self.page.locator('#role').select_option('ecology');self.page.locator('#game-mode').select_option('play');self.page.locator('#briefing[open]').wait_for()
  expect(self.page.locator('#briefing-role')).to_have_text('Role: ecologist');expect(self.page.locator('#game-mode option:checked')).to_have_text('Cooperation');self.shot('play-02-briefing');self.begin()
  self.inspect('C');expect(self.page.locator('#finding')).to_contain_text('Cost: 9 credits. Health: +6');expect(self.page.locator('#finding')).not_to_contain_text('shared')
  self.assertEqual(self.page.locator('#patch-actions button').all_text_contents(),['Propose','Structure'])
  self.shot('play-03-choice');self.click('Structure');self.page.wait_for_function('roundDiagnostics().lab.draws>0');self.click('Look through');self.page.locator('#structure-focus').select_option('liana')
  self.page.locator('#structure-lab').get_by_role('button',name='Back',exact=True).click();self.click('Propose');self.begin();expect(self.page.locator('#role')).to_have_value('removal')
  self.inspect('A');self.click('Propose');self.begin();self.click('Reveal plans');self.click('Forest');self.page.wait_for_function('!roundDiagnostics().busy')
  self.assertEqual(self.page.locator('#patch-actions button').count(),0);expect(self.page.locator('#status')).to_contain_text('Cost: 13. Return: 16. Left: 5.')
  self.shot('play-04-review');self.click('Commit plan');expect(self.page.locator('#task')).to_have_text('Shared plan')
  self.seek('recovery',0);self.seek('fire-time',20);young=self.page.evaluate('roundDiagnostics().fire.future');self.shot('play-05-young-fire')
  canvas=self.page.locator('#landscape>canvas');before=Image.open(BytesIO(canvas.screenshot()))
  self.seek('recovery',10);grown=self.page.evaluate('roundDiagnostics().fire.future');self.shot('play-06-recovered-fire');after=Image.open(BytesIO(canvas.screenshot()))
  self.assertLess(grown,young);self.assertGreater(sum(ImageStat.Stat(ImageChops.difference(before,after)).mean),.05)
  self.assertGreater(self.page.evaluate('roundDiagnostics().growthPoints'),2000)
  self.seek('recovery',0);self.assertEqual(self.page.evaluate('roundDiagnostics().fire.future'),young);self.seek('recovery',10)
  self.click('Without plan');expect(self.page.locator('#status')).to_contain_text('60/100');self.shot('play-07-without');self.click('With plan')
  elevation=self.page.evaluate('roundDiagnostics().forest.elevation');self.page.mouse.move(1080,460);self.page.mouse.down();self.page.mouse.move(1190,545,steps=12);self.page.mouse.up()
  self.page.wait_for_function('(old)=>Math.abs(roundDiagnostics().forest.elevation-old)>.01',arg=elevation)
  self.seek('fire-time',0);self.click('Close view');self.page.wait_for_function('!roundDiagnostics().busy');self.shot('play-08-restored-close')
  self.page.reload();self.page.locator('#loading').wait_for(state='hidden');self.assertEqual(self.page.evaluate('roundDiagnostics().state.phase'),'committed')
  self.page.locator('#game-mode').select_option('expedition');self.page.wait_for_url('**/expedition.html?fresh=1#*');self.page.locator('#loading').wait_for(state='hidden')
  self.page.locator('#role').select_option('ecology');self.page.locator('#game-mode').select_option('play');self.begin()
  self.assertEqual(self.page.evaluate('roundDiagnostics().state.phase'),'survey');self.assertEqual(self.page.evaluate('roundDiagnostics().state.proposals'),{'removal':None,'ecology':None})
  self.assertEqual(self.page.evaluate('roundDiagnostics().state.visited'),{'removal':[],'ecology':[]})
 def test_two_team_privacy_reveal_revision_and_shared_commit(self):
  self.start();self.click('Teams');links=[self.page.get_by_label(role+' team link').input_value() for role in ['Removal','Ecologist']];self.click('Back')
  contexts=[self.browser.new_context(viewport={'width':1280,'height':900},reduced_motion='reduce') for _ in links]
  try:
   pages=[c.new_page() for c in contexts]
   for p,url in zip(pages,links):self.watch(p);self.start(p,url);expect(p.locator('#role')).to_be_disabled()
   r,e=pages;self.inspect('C',r);self.click('Propose',r);self.inspect('A',e);self.click('Propose',e)
   e.wait_for_function('roundDiagnostics().state.ready.removal');self.assertIsNone(e.evaluate('roundDiagnostics().state.proposals.removal'))
   self.page.locator('#role').select_option('room');self.begin();self.page.wait_for_function('Object.values(roundDiagnostics().state.ready).every(Boolean)');self.click('Reveal plans')
   expect(self.page.get_by_role('button',name='Commit plan',exact=True)).to_be_disabled();expect(self.page.locator('#status')).to_contain_text('Left: -2.')
   e.wait_for_function('roundDiagnostics().state.phase==="review"');self.inspect('C',e);self.click('Propose',e)
   expect(self.page.get_by_role('button',name='Commit plan',exact=True)).to_be_enabled();self.click('Commit plan')
   for p in pages:
    p.wait_for_function('roundDiagnostics().state.phase==="committed"');self.assertEqual(p.evaluate('roundDiagnostics().state.committed.left'),2)
   self.shot('play-two-team-commit');self.page.locator('#game-mode').select_option('negligence');self.begin()
   for p in pages:
    p.wait_for_function('roundDiagnostics().state.mission==="negligence"');self.begin(p);p.wait_for_function('!roundDiagnostics().busy');self.assertEqual(p.evaluate('roundDiagnostics().view'),'forest')
   self.inspect('D',r);self.click('Propose',r);self.inspect('C',e);self.click('Propose',e)
   self.page.locator('#role').select_option('room');self.begin();self.page.wait_for_function('Object.values(roundDiagnostics().state.ready).every(Boolean)');self.click('Reveal plans')
   expect(self.page.get_by_role('button',name='Commit plan',exact=True)).to_be_disabled();e.wait_for_function('roundDiagnostics().state.phase==="review"');self.inspect('D',e);self.click('Propose',e)
   expect(self.page.get_by_role('button',name='Commit plan',exact=True)).to_be_enabled();self.click('Commit plan')
   for p in pages:p.wait_for_function('roundDiagnostics().state.phase==="committed"');self.assertFalse(p.evaluate('roundDiagnostics().state.committed.care'))
   self.shot('neglect-two-team-commit')
   e.locator('#game-mode').select_option('play');self.begin(e)
   for p in [self.page,r,e]:p.wait_for_function('roundDiagnostics().state.mission==="cooperation"&&roundDiagnostics().state.phase==="survey"')
   e.locator('#game-mode').select_option('expedition')
   for p in [self.page,r,e]:p.wait_for_url('**/expedition.html**');p.locator('#loading').wait_for(state='hidden')
   e.locator('#game-mode').select_option('play');self.begin(e);self.assertEqual(e.evaluate('roundDiagnostics().state.previous'),None)
  finally:
   for c in contexts:c.close()
 def test_phone_without_webgl_still_explores_and_plays(self):
  b=self.p.chromium.launch(args=['--disable-webgl'])
  try:
   self.page=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');self.watch(self.page);self.start()
   self.assertTrue(self.page.evaluate('roundDiagnostics().forest.fallback'))
   self.inspect('B');self.click('Propose');self.begin();self.click('Propose');self.begin();self.click('Reveal plans');self.click('Forest');self.page.wait_for_function('!roundDiagnostics().busy')
   self.seek('recovery',10);self.click('Commit plan');self.seek('fire-time',10);self.shot('play-phone-fire')
   self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),390)
   self.seek('recovery',0);self.seek('fire-time',0);self.assertEqual(self.page.evaluate('roundDiagnostics().mode'),'recovery')
   self.page.locator('#game-mode').select_option('negligence');self.begin();self.page.wait_for_function('!roundDiagnostics().busy');self.inspect('B');self.seek('recovery',10);self.click('Without removal');self.shot('neglect-phone-no-webgl')
   self.assertEqual(self.page.evaluate('roundDiagnostics().forecast.alive'),15);self.assertGreater(self.page.evaluate('roundDiagnostics().regrowthPoints'),2000)
   self.click('Structure');self.page.wait_for_function('roundDiagnostics().lab.draws>0');self.seek('structure-year',3);self.assertEqual(self.page.evaluate('roundDiagnostics().years'),3)
   self.page.locator('#structure-lab').get_by_role('button',name='Back',exact=True).click();self.inspect('D');self.seek('recovery',.5);self.assertEqual(self.page.evaluate('roundDiagnostics().forecast.invasive'),.08);self.shot('removal-phone-cleared')
   self.seek('recovery',10);self.assertGreater(self.page.evaluate('roundDiagnostics().forecast.invasive'),.9);self.shot('removal-phone-regrown');self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),390)
   self.page.locator('#role').select_option('ecology');self.begin();self.page.locator('[data-specimen="urochloa_decumbens"]').click();self.page.get_by_role('tab',name='Germination').click();self.shot('record-phone-no-webgl');expect(self.page.locator('.seed-clue')).not_to_be_visible();expect(self.page.locator('.reading')).to_have_count(4);self.click('Back')
  finally:b.close()
 def test_briefing_types_and_can_be_dismissed_early(self):
  self.page.emulate_media(reduced_motion='no-preference');self.page.goto(self.base+'/round.html#role=removal')
  self.page.locator('#briefing[open]').wait_for();expect(self.page.locator('#briefing-role')).to_have_text('Role: removal')
  self.assertEqual(self.page.locator('.facilitator-photo span').count(),0)
  expect(self.page.locator('#briefing-accessible')).not_to_contain_text('The return helps pay')
  expect(self.page.locator('#briefing-accessible')).not_to_contain_text('Commit the shared plan')
  self.page.wait_for_function('document.querySelector("#briefing-text").textContent.length>12')
  full=self.page.locator('#briefing-accessible').text_content();partial=self.page.locator('#briefing-text').text_content();self.assertLess(len(partial),len(full))
  self.shot('play-briefing-typing');self.click('Begin');expect(self.page.locator('#briefing')).not_to_be_visible()
  self.page.locator('#role').select_option('ecology');self.page.locator('#briefing[open]').wait_for();expect(self.page.locator('#briefing-role')).to_have_text('Role: ecologist');expect(self.page.locator('#briefing-accessible')).not_to_contain_text('Commit the shared plan');self.click('Begin')
 def test_cooperation_room_previews_each_patch_without_changing_proposals(self):
  self.start();self.inspect('A');self.click('Propose');self.begin();self.inspect('C');self.click('Propose');self.begin();self.click('Reveal plans');self.click('Forest');self.page.wait_for_function('!roundDiagnostics().busy')
  proposals=self.page.evaluate('roundDiagnostics().state.proposals');budget=self.page.evaluate('roundDiagnostics().budget');images=[]
  for key in ['A','B','C']:
   self.click('Patch '+key);self.seek('recovery',10);expect(self.page.locator('#finding')).to_contain_text('Preview: restore '+key)
   self.assertEqual(self.page.evaluate('roundDiagnostics().previewPlan.ecology'),key);self.assertEqual(self.page.evaluate('roundDiagnostics().state.proposals'),proposals);self.assertEqual(self.page.evaluate('roundDiagnostics().budget'),budget)
   self.shot('cooperation-review-'+key);images.append(Image.open(BytesIO(self.page.locator('#landscape>canvas').screenshot())))
  for a,b in zip(images,images[1:]):self.assertGreater(sum(ImageStat.Stat(ImageChops.difference(a,b)).mean),.05)
  self.click('Patch B');self.seek('recovery',3);self.assertEqual(self.page.evaluate('roundDiagnostics().previewPlan.ecology'),'B')
  self.click('Commit plan');self.page.wait_for_function('roundDiagnostics().state.phase==="committed"');self.assertEqual(self.page.evaluate('roundDiagnostics().previewPlan.ecology'),'C');self.assertEqual(self.page.evaluate('roundDiagnostics().state.committed.ecology'),'C');self.seek('fire-time',20)
 def test_negligence_forecast_before_proposal_and_structure_tracks_year(self):
  self.start();self.inspect('C');self.click('Propose');self.begin();self.click('Propose');self.begin();self.click('Reveal plans');self.click('Commit plan')
  self.page.locator('#game-mode').select_option('negligence');self.begin();self.page.wait_for_function('!roundDiagnostics().busy')
  self.assertEqual(self.page.evaluate('roundDiagnostics().state.previous.ecology'),'C');self.assertEqual(self.page.evaluate('roundDiagnostics().years'),.5)
  self.assertEqual(self.page.get_by_role('button',name='Six months later',exact=True).count(),0)
  self.assertEqual(self.page.locator('#patches button').all_text_contents(),['C','D','E']);self.shot('neglect-01-return')
  self.inspect('C');self.seek('recovery',10);self.click('With removal');self.shot('neglect-02-cared-close')
  self.assertEqual(self.page.evaluate('roundDiagnostics().forecast.alive'),80)
  self.click('Without removal');self.shot('neglect-03-uncared-close');self.assertEqual(self.page.evaluate('roundDiagnostics().forecast.alive'),15)
  self.assertEqual(self.page.evaluate('roundDiagnostics().state.proposals.removal'),None)
  self.click('Structure');self.page.wait_for_function('roundDiagnostics().lab.draws>0');self.shot('neglect-04-structure-year10')
  old=self.page.evaluate('roundDiagnostics().lab.models[0]');high=self.page.evaluate('roundDiagnostics().lab.models[1]')
  self.seek('structure-year',3);self.shot('neglect-05-structure-year3');self.assertEqual(self.page.evaluate('roundDiagnostics().years'),3)
  young=self.page.evaluate('roundDiagnostics().lab.models[1]');self.assertGreater(high['kinds'][4],young['kinds'][4]);self.assertEqual(old,self.page.evaluate('roundDiagnostics().lab.models[0]'))
  self.page.locator('#structure-lab').get_by_role('button',name='With removal',exact=True).click();self.seek('structure-year',10);self.shot('neglect-06-structure-cared')
  good=self.page.evaluate('roundDiagnostics().lab.models[1]');self.assertGreater(good['upper'],high['upper']);self.assertLess(good['kinds'][4],high['kinds'][4])
  self.page.locator('#structure-lab').get_by_role('button',name='Back',exact=True).click()
  for key in ['D','E']:
   self.inspect(key);self.seek('recovery',.5);expect(self.page.locator('#forecast-metrics')).to_have_text(key+': 8% invasive cover. No trees planted.')
   self.assertEqual(self.page.evaluate('roundDiagnostics().forecast.key'),key);self.assertGreater(self.page.evaluate('roundDiagnostics().clearingPoints'),2000)
   self.shot('removal-'+key+'-cleared');self.click('Structure');self.page.wait_for_function('roundDiagnostics().lab.draws>0');self.shot('removal-'+key+'-structure-cleared')
   reference=self.page.evaluate('roundDiagnostics().lab.models[0]');cleared=self.page.evaluate('roundDiagnostics().lab.models[1]')
   self.page.locator('#structure-lab').get_by_role('button',name='Without removal',exact=True).click();overgrown=self.page.evaluate('roundDiagnostics().lab.models[1]');self.assertGreater(overgrown['kinds'][4],cleared['kinds'][4])
   self.page.locator('#structure-lab').get_by_role('button',name='With removal',exact=True).click();self.seek('structure-year',3);self.shot('removal-'+key+'-structure-year3')
   self.seek('structure-year',10);self.shot('removal-'+key+'-structure-year10');late=self.page.evaluate('roundDiagnostics().lab.models[1]')
   self.assertGreater(late['kinds'][4],cleared['kinds'][4]);self.assertLess(late['upper'],cleared['upper']);self.assertEqual(reference,self.page.evaluate('roundDiagnostics().lab.models[0]'))
   self.page.locator('#structure-lab').get_by_role('button',name='Back',exact=True).click();expect(self.page.locator('#forecast-metrics')).to_have_text(key+': 95% invasive cover. No trees planted.');self.shot('removal-'+key+'-regrown')
  self.inspect('D');self.click('Forest');self.page.wait_for_function('!roundDiagnostics().busy');self.shot('neglect-07-new-clearing')
  self.click('Propose');self.begin();self.inspect('C');self.click('Propose');self.begin();self.click('Reveal plans');expect(self.page.get_by_role('button',name='Commit plan',exact=True)).to_be_disabled()
  self.page.locator('#role').select_option('ecology');self.inspect('D');self.click('Propose');self.click('Commit plan');self.seek('fire-time',20);self.shot('neglect-08-committed')
  self.page.reload();self.page.locator('#loading').wait_for(state='hidden');self.assertEqual(self.page.evaluate('roundDiagnostics().state.mission'),'negligence');self.assertEqual(self.page.evaluate('roundDiagnostics().state.committed.removal'),'D')
  self.page.locator('#game-mode').select_option('expedition');self.page.wait_for_url('**/expedition.html?fresh=1#*');self.page.locator('#loading').wait_for(state='hidden');self.page.locator('#role').select_option('removal');self.page.locator('#game-mode').select_option('play');self.begin();self.assertEqual(self.page.evaluate('roundDiagnostics().state.mission'),'cooperation')

 def test_seed_study_and_broad_scar_playthrough(self):
  self.start();self.inspect('C');self.page.locator('[data-specimen="urochloa_brizantha"]').click();expect(self.page.locator('.species-status')).to_have_text('Invasive');self.page.get_by_role('tab',name='Dispersal').click();self.shot('record-cooperation-removal');self.click('Back');self.click('Propose');self.begin();self.click('Propose');self.begin();self.click('Reveal plans');self.click('Commit plan')
  self.click('Overhead');self.page.wait_for_function('!roundDiagnostics().busy')
  self.seek('recovery',10);self.click('Without plan')
  for time in [5,10,20]:self.seek('fire-time',time);self.shot('scar-without-'+str(time))
  self.click('Close view');self.page.wait_for_function('!roundDiagnostics().busy');self.shot('scar-close-canopy');self.click('Overhead');self.page.wait_for_function('!roundDiagnostics().busy')
  without=self.page.evaluate('roundDiagnostics().fire.baseline');self.click('With plan');self.shot('scar-restored-20')
  self.assertLess(self.page.evaluate('roundDiagnostics().fire.future'),without/2)
  self.seek('fire-time',0);self.page.locator('#game-mode').select_option('negligence');self.begin();self.page.wait_for_function('!roundDiagnostics().busy');self.inspect('C')
  self.assertEqual(self.page.get_by_role('button',name='Seeds',exact=True).count(),0)
  self.page.locator('#role').select_option('ecology');self.begin();self.page.locator('[data-specimen="urochloa_brizantha"]').click()
  expect(self.page.locator('.species-status')).to_have_text('Invasive');self.page.locator('.phosphor-frame canvas[data-loaded=true]').wait_for();self.shot('record-marandu-about')
  self.page.get_by_role('tab',name='Dispersal').click();self.shot('record-marandu-dispersal');self.page.get_by_role('tab',name='Germination').click();self.shot('record-marandu-germination')
  grass=Image.open(BytesIO(self.page.locator('.seed-readings').screenshot()))
  self.click('Back');self.page.locator('[data-specimen="cecropia_obtusa"]').click();expect(self.page.locator('.species-status')).to_have_text('Native');self.page.get_by_role('tab',name='Germination').click();self.shot('record-native-germination')
  native=Image.open(BytesIO(self.page.locator('.seed-readings').screenshot()));self.assertGreater(sum(ImageStat.Stat(ImageChops.difference(grass,native.resize(grass.size))).mean),.5)
  self.page.get_by_role('tab',name='Dispersal').click();expect(self.page.locator('.seed-copy')).to_contain_text('bats');self.shot('seeds-native-dispersal')
  self.page.get_by_role('tab',name='Dispersal').press('ArrowRight');expect(self.page.get_by_role('tab',name='Germination')).to_have_attribute('aria-selected','true')
  self.assertEqual(self.page.evaluate('roundDiagnostics().state.proposals.ecology'),None)
  self.click('See its structure');self.page.wait_for_function('roundDiagnostics().lab.draws>0');self.shot('seeds-to-structure');self.page.locator('#structure-lab').get_by_role('button',name='Back',exact=True).click()
  self.inspect('D');self.page.locator('[data-specimen="urochloa_decumbens"]').click();self.page.get_by_role('tab',name='Dispersal').click();expect(self.page.locator('.seed-clue')).not_to_be_visible();expect(self.page.locator('.seed-copy')).to_contain_text('Green squares record this species');self.shot('record-new-patch');self.click('Back')
  self.inspect('C');self.page.locator('[data-specimen="urochloa_brizantha"]').click();self.page.get_by_role('tab',name='Germination').click();self.page.set_viewport_size({'width':390,'height':844});self.shot('record-phone');self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),390)
  self.click('Back');self.page.set_viewport_size({'width':1440,'height':1000});self.click('Propose');self.click('Propose');self.begin();self.click('Reveal plans');self.click('Commit plan')
  self.page.wait_for_function('roundDiagnostics().state.phase==="committed"');self.assertTrue(self.page.evaluate('roundDiagnostics().state.committed.care'))

 def test_compact_panels_species_picker_and_care_health(self):
  self.start();self.click('Patch C')
  self.assertEqual(self.page.locator('#round-panel').evaluate('(e)=>getComputedStyle(e).borderRadius'),'0px')
  self.assertGreater(self.page.locator('.game-navigation').bounding_box()['x'],self.page.locator('.chapter').bounding_box()['x'])
  expect(self.page.locator('#plot-plants')).to_be_visible();self.page.locator('#plot-plants').select_option('cecropia_obtusa')
  self.page.get_by_role('tab',name='Germination').click();expect(self.page.locator('.reading')).to_have_count(4)
  expect(self.page.locator('.seed-clue')).not_to_be_visible();expect(self.page.locator('.readings-date')).to_have_count(0)
  expect(self.page.locator('.reading-legend')).to_contain_text('Species thrives in')
  boxes=[self.page.locator(f'.reading[data-metric={k}]').bounding_box() for k in ['temperature','water','ph','light']]
  self.assertTrue(all(a['y']<b['y'] for a,b in zip(boxes,boxes[1:])))
  self.assertLessEqual(self.page.locator('#plant-guide').bounding_box()['width'],360)
  self.shot('compact-cooperation-native');self.click('Back');expect(self.page.locator('#plot-plants')).to_have_value('')
  self.page.locator('#plot-plants').select_option('doliocarpus_dentatus');self.page.get_by_role('tab',name='Germination').click()
  expect(self.page.locator('.reading-band')).to_have_count(4);expect(self.page.locator('.seed-copy')).not_to_contain_text('documented')
  self.click('Back');self.inspect('C');self.click('Propose');self.begin();self.click('Propose');self.begin();self.click('Reveal plans');self.click('Commit plan')
  self.page.locator('#game-mode').select_option('negligence');self.begin();self.page.wait_for_function('!roundDiagnostics().busy')
  expect(self.page.locator('#finding')).to_contain_text('Health: +4.9 by 10y');expect(self.page.locator('#status')).not_to_contain_text('Open Close view')
  expect(self.page.locator('#mission-goal')).to_contain_text('Remove invasives for credit')
  self.shot('compact-negligence-care')
  self.click('Patch D');expect(self.page.locator('#finding')).to_contain_text('Health: -3');self.shot('compact-negligence-d')
  self.click('Patch E');expect(self.page.locator('#finding')).to_contain_text('Health: -1')
  self.click('Patch C');self.seek('recovery',10);self.page.locator('#plot-plants').select_option('urochloa_brizantha');self.page.get_by_role('tab',name='Germination').click()
  cared=self.page.locator('[data-metric=temperature] .reading-value').inner_text();self.shot('compact-cared-microclimate')
  self.click('Without removal');neglected=self.page.locator('[data-metric=temperature] .reading-value').inner_text()
  self.assertNotEqual(cared,neglected);expect(self.page.get_by_role('tab',name='Germination')).to_have_attribute('aria-selected','true')
  self.shot('compact-neglected-microclimate');self.page.get_by_role('tab',name='Dispersal').click()
  expect(self.page.locator('.seed-copy')).not_to_contain_text('teaching inventory');expect(self.page.locator('.seed-clue')).not_to_be_visible()
  self.shot('compact-dispersal');self.page.get_by_role('tab',name='Germination').click();self.page.set_viewport_size({'width':390,'height':844})
  self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),390);self.shot('compact-phone');self.click('Back')

 def test_extensions_can_be_disabled_without_changing_the_loop(self):
  config=json.loads(Path(__file__).with_name('round-config.json').read_text());config['extensions']={'seedStudy':False,'broadFire':False}
  self.page.route('**/round-config.json',lambda route:route.fulfill(content_type='application/json',body=json.dumps(config)))
  self.start();self.inspect('C');self.click('Propose');self.begin();self.click('Propose');self.begin();self.click('Reveal plans');self.click('Commit plan');self.page.wait_for_function('roundDiagnostics().state.phase==="committed"')
  self.seek('fire-time',20);self.shot('extensions-disabled-fire')
  self.page.locator('#game-mode').select_option('negligence');self.begin();self.page.wait_for_function('!roundDiagnostics().busy');self.page.locator('#role').select_option('ecology');self.begin();self.inspect('C')
  expect(self.page.locator('#briefing-accessible')).not_to_contain_text('open Seeds');self.assertEqual(self.page.get_by_role('button',name='Seeds',exact=True).count(),0);self.click('Structure');self.page.wait_for_function('roundDiagnostics().lab.draws>0')

if __name__=='__main__':unittest.main()
