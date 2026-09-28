import {WORLD} from './world.mjs';
import {INVASIVE_IDS} from './forest-flora.mjs';
import {patch} from './round-model.mjs';
const clamp=n=>Math.max(0,Math.min(1,n));
export const SEED_RECORDS={
 urochloa_brizantha:{name:'Marandu grass',
  dispersal:'Clear this patch and grass may remain beyond its edge. Its seeds can return.',
  germination:'Dormancy can delay germination. Marandu tests used alternating warm and cool conditions.',
  source:'https://doi.org/10.1590/S0103-90161992000400003',citation:'Garcia & Cícero 1992 - Marandu dormancy',
  limit:'Nearby seed supply and establishment in openings are modelled. This is not a measured dispersal route or a laboratory germination forecast.'},
 megathyrsus_maximus:{name:'Guinea grass',
  dispersal:'Look beyond the cleared patch. Nearby grass may be a source of new seeds. Their route here is still uncertain.',
  germination:'These seeds can germinate in light or darkness. Look for warmth and water before deciding where they might take hold.',
  source:'https://www.scielo.br/j/pd/a/qFLcJjyMPCWsxjf5mFYY46r/',citation:'Megathyrsus germination experiments, 2020',
  limit:'Germination experiments were in Argentina, not this forest. The seed-supply map is an authored local-source scenario.'},
 melinis_minutiflora:{name:'Molasses grass',
  dispersal:'Clearing one square can leave seed-producing grass nearby. Where might the next invasion begin?',
  germination:'A fresh seed may remain dormant. Tests show that germination changes with storage time and conditions. How long it persists in this soil is still unknown.',
  source:'https://doi.org/10.1590/S0101-31222010000400008',citation:'Melinis dormancy experiments, 2010',
  limit:'Local seed supply is modelled, not a measured dispersal mechanism. Storage experiments do not establish persistence in this soil.'},
 urochloa_decumbens:{name:'Signal grass',status:'Invasive pasture grass',
  dispersal:'A cleared patch can look empty. Nearby grass may already be supplying its next seeds.',
  germination:'An open canopy gives this grass a chance to establish. Look for a seed source nearby. A gap need not become an invasion.',
  source:'https://doi.org/10.1098/rstb.2012.0427',citation:'Silvério et al. 2013',
  extraSource:'https://doi.org/10.1111/gfs.12347',extraCitation:'Dantas-Junior et al. 2018 - seed longevity',
  limit:'The map models local seed supply, not wind direction. Signal grass can form a short-lived seed bank. This does not establish a six-month seed reserve here. Surviving stems can also regrow.'},
 cecropia_obtusa:{name:'Cecropia',status:'Native pioneer tree',
  dispersal:'Fruit bats carry the fruits. A seed may reach an opening beyond the tree that grew it.',
  germination:'Seeds can persist in the soil beneath the forest. When the canopy opens this pioneer can establish.',
  source:'https://doi.org/10.3732/ajb.90.3.388',citation:'Lobova et al. 2003',
  limit:'The map models possible bat use. It is not a record of animal sightings.'}
};
const distance=(a,b)=>Math.hypot(a%6-b%6,Math.floor(a/6)-Math.floor(b/6));
// Small teaching layers, not fitted seed kernels or germination probabilities.
// Kept separate from the accepted survival trajectories and money model.
export function seedLayers(species,previous){
 if(!SEED_RECORDS[species])return null;
 const native=species==='cecropia_obtusa',cleared=new Set(previous?[patch(previous.removal).id,patch(previous.ecology).id]:[]);
 const sources=WORLD.filter(c=>c.active&&(native?c.habitat:c.speciesIds.includes(species)));
 return WORLD.map(c=>{
  if(!c.active)return null;
  const arrival=clamp(sources.reduce((sum,s)=>sum+Math.exp(-distance(c.id,s.id)/(native?1.6:.85))*(cleared.has(s.id)&&!native?.2:1),0)/(native?3:1.8));
  const opening=cleared.has(c.id)?.9:clamp(.25+c.exposure*.6+(c.disturbance?.15:0));
  const establishment=native?clamp(opening*(.45+.55*c.moisture)):clamp(opening*(.9-.2*c.moisture));
  return {arrival,establishment};
 });
}
export const level=value=>value<.33?'low':value<.66?'moderate':'high';

// Evidence for the shared field record, not a new survival or payment model.
// Temperature bands distinguish protocols from observed favourable ranges.
// Moisture/light bands are qualitative categories, never invented % thresholds.
const ref=(title,url)=>({title,url});
const marandu=ref('Garcia & Cícero 1992 - Marandu dormancy and alternating test temperatures','https://doi.org/10.1590/S0103-90161992000400003');
const guinea=ref('Cabrera et al. 2020 - Guinea grass temperature, light and water experiments','https://doi.org/10.1590/S0100-83582020380100054');
const signal=ref('Njehoya et al. 2021 - Basilisk seed tests at 28 °C','https://doi.org/10.1038/s41598-021-94246-w');
const cecropia=ref('Holthuijzen & Boerboom 1982 - Cecropia obtusa and C. sciadophylla seed bank','https://www.jstor.org/stable/2387761');
const carapa=ref('McHargue & Hartshorn 1983 - Carapa seed and seedling ecology','https://repositorio.catie.ac.cr/handle/11554/12044');
export const GERMINATION_EVIDENCE={
 urochloa_brizantha:{temperature:[20,35],tempLabel:'20/35 °C test cycle',water:[1,2],waterLabel:'Moistened substrate',light:null,
  detail:'This Marandu experiment alternated 20 °C in darkness and 35 °C in light. The band spans that protocol, not an optimum at every temperature. Dormancy treatments affected the result. No light-response threshold was established.',
  advice:'Closing the canopy can restrict grass establishment, but dormant seeds may remain.',sources:[marandu]},
 megathyrsus_maximus:{temperature:[25,30],tempLabel:'Higher constant-test results',water:[1,2],waterLabel:'Water stress reduced germination',light:[0,2],lightLabel:'Light and darkness',
  detail:'Argentina laboratory tests had higher light-treatment germination at constant 25 and 30 °C. Germination also occurred in darkness. Osmotic stress reduced germination; the moisture strip shows that direction, not a conversion from PEG to soil water content.',
  advice:'Shade can limit later grass growth even when seeds still germinate.',sources:[guinea]},
 urochloa_decumbens:{temperature:[28,28],tempLabel:'Tested at 28 °C',water:[1,2],waterLabel:'Moistened substrate',light:[0,0],lightLabel:'Dark treatment tested',
  detail:'Basilisk was the U. decumbens comparison cultivar in a Cameroon seed-quality experiment. Its laboratory treatment was 28 °C in darkness on saturated paper. These are test conditions, not an optimum or proof that light is harmful.',
  advice:'Canopy recovery can restrict grass establishment; it does not remove every seed.',sources:[signal,ref('Silvério et al. 2013 - Amazon forest openings and grass invasion','https://doi.org/10.1098/rstb.2012.0427')]},
 andropogon_gayanus:{temperature:[17,39],tempLabel:'Observed constant-temperature range',water:null,light:null,
  detail:'Queensland experiments recorded germination at constant temperatures from 17 to 39 °C, with lower germination near the extremes. This is not a uniformly favourable band. Species-specific moisture and light ranges have not been entered.',
  advice:'A temperature match does not predict invasion. Check seed supply and new growth.',sources:[ref('Bebawi et al. 2018 - Gamba grass germination','https://era.dpi.qld.gov.au/id/eprint/6476/')]},
 melinis_minutiflora:{temperature:null,water:null,light:null,
  detail:'The available dormancy study concerns storage and germination treatments. It does not provide a defensible field optimum for these three axes. No numeric band is inferred from other grasses.',
  advice:'Dormancy can delay emergence. A cleared square may need another visit.',sources:[ref('Melinis dormancy experiments, 2010','https://doi.org/10.1590/S0101-31222010000400008')]},
 cecropia_obtusa:{temperature:[20,30],tempLabel:'20/30 °C alternating test',water:null,light:[2,2],lightLabel:'Daylight promotes germination',
  detail:'Surinam experiments included C. obtusa and C. sciadophylla. Daylight strongly promoted germination. Alternating 20/30 °C allowed some dark germination; the temperature span is a treatment, not a field optimum. No quantitative soil-moisture band is asserted.',
  advice:'This native pioneer needs openings. Canopy closure can reduce new germination.',sources:[cecropia,ref('Lobova et al. 2003 - Cecropia and fruit bats','https://doi.org/10.3732/ajb.90.3.388')]},
 piper_aduncum:{temperature:[25,30],tempLabel:'25 °C seedlings / 30 °C roots',water:null,light:[1,2],lightLabel:'Light required in the tests',
  detail:'Dousseau et al. found strictly light-dependent germination in their tested conditions. Root protrusion was best at 30 °C and normal seedlings at 25 °C. The categorical light strip is not a measured canopy-transmission threshold.',
  advice:'This native is an opening specialist too. More shade does not favour every native seed.',sources:[ref('Dousseau et al. 2011 - Piper aduncum germination','https://repositorio.ufla.br/handle/1/11994')]},
 euterpe_oleracea:{temperature:[25,30],tempLabel:'Successful laboratory regimes',water:[1,2],waterLabel:'Avoid drying the seeds',light:null,
  detail:'Moreira tested constant 25 and 30 °C and alternating 20/30 °C; the constant temperatures were not significantly different for two fruit maturity classes. This band is a studied regime, not a universal optimum. Water evidence concerns seed desiccation, not a measured soil-water threshold.',
  advice:'Canopy shelter can reduce drying around these seeds; flooding and seed condition still matter.',sources:[ref('Moreira 1989 - Euterpe oleracea seed temperatures','https://teses.usp.br/teses/disponiveis/11/11142/tde-20191218-113804/'),ref('Euterpe oleracea seed desiccation experiments','https://www.scielo.br/j/rbs/a/jsvyn6twMMYJYrNkVmdXRfp/?lang=pt'),ref('Açaí germination under aerobic and anaerobic conditions, 2010','https://www.scielo.br/j/rarv/a/B7fjLVzmb5MX9hc3dbmsXDx/?lang=en')]},
 carapa_guianensis:{temperature:[30,40],tempLabel:'Favourable laboratory treatments',water:[1,1],waterLabel:'Damp, not dry or waterlogged',light:[0,0],lightLabel:'Darkness favoured germination',
  detail:'The 2015 laboratory study reported favourable germination at 30–40 °C and higher, faster germination in darkness. Costa Rican field observations found both desiccation and waterlogging could prevent germination. These findings do not imply that cooling improves every germination metric. Laboratory darkness is not a measured field shade threshold.',
  advice:'Canopy shelter can prevent drying. This species also needs a site that does not stay waterlogged.',sources:[ref('Carapa light, temperature and substrate, 2015','https://academicjournals.org/journal/JMPR/article-abstract/350C2C053448'),carapa]}
};

// Occurrence is deliberately not a seed-rain probability. All species can use
// the same inventory map without fabricating their dispersal biology.
export function occurrenceStudy(species,plot){
 const cells=WORLD.map(c=>c.active?{present:c.speciesIds.includes(species)}:null);
 const neighbours=WORLD.filter(c=>c.active&&c.id!==plot&&Math.abs(c.id%6-plot%6)<=1&&Math.abs(Math.floor(c.id/6)-Math.floor(plot/6))<=1);
 return {cells,nearby:neighbours.filter(c=>c.speciesIds.includes(species)).length,total:neighbours.length};
}

export function patchReadings(plot,previous=null,context=null){
 const c=context?.plot||WORLD[plot];if(!c?.active)return null;
 const cleared=previous&&[previous.removal,previous.ecology].some(k=>k&&patch(k).id===plot);
 const exposure=cleared?.92:clamp(c.exposure+(c.disturbance?.12:0));
 const water=clamp(c.moisture-(cleared?.08:0));
 // Teaching ground-level readings. No conversion to measured soil water,
 // relative humidity, seed moisture content, or laboratory osmotic potential.
 return {temperature:Math.round((25+7*exposure+2*(1-water))*10)/10,water:water*2,light:exposure*2,
  closed:{temperature:Math.round((25.5+1.5*(1-water))*10)/10,water:Math.max(water,.72)*2,light:.22},
  caption:context?.plot?'Current turn (simulated)':previous?'Six-month conditions (simulated)':'Patch conditions (simulated)'};
}

export function germinationAssessment(species,readings){
 const e=GERMINATION_EVIDENCE[species];if(!readings)return 'No patch reading available.';
 if(!e)return 'Species-specific germination conditions are not yet documented.';
 if(species==='cecropia_obtusa'||species==='piper_aduncum')return readings.light>1.2?'An opening may favour this native pioneer; closing shade can reduce new germination.':'Shade may limit this native pioneer’s germination; it is not a late-forest seed.';
 if(species==='carapa_guianensis')return readings.water<.7?'Dry ground may hinder germination; canopy shelter can reduce drying.':'Moisture may suit germination; waterlogged ground is a different risk.';
 if(species==='euterpe_oleracea')return readings.water<.7?'Drying is a risk for these native seeds; canopy shelter can help.':readings.water>=1.65?'Wet ground may reduce drying, but these seeds still need oxygen.':'The damp ground may protect these native seeds from drying.';
 if(INVASIVE_IDS.has(species))return readings.light>1.2?'Open ground can favour invasion; canopy closure can limit establishment, not erase seeds.':'Shade can restrict grass establishment; keep watching for new seedlings.';
 return e.advice;
}

// Illustrative establishment profiles for the immersive round UI. These are
// NOT the laboratory GERMINATION_EVIDENCE above, nor measured species limits.
// Profiles stay fixed when patches change, including the native pioneers.
export function habitatBand(species){
 const id=typeof species==='string'?species:species.id;
 const profile=INVASIVE_IDS.has(id)?'grass':['cecropia_obtusa','piper_aduncum','manihot_esculenta','bactris_gasipaes'].includes(id)?'opening':/liana/i.test(species.growthForm||'')?'climber':['euterpe_oleracea','mauritia_flexuosa'].includes(id)?'wetForest':'forest';
 const bands={
  grass:{temperature:[28,36],water:[.3,1.4],ph:[4.3,6.5],light:[1.2,2]},
  opening:{temperature:[26,34],water:[.7,1.7],ph:[4.2,6.2],light:[.9,2]},
  climber:{temperature:[25,32],water:[.8,1.8],ph:[4,6.2],light:[.4,1.7]},
  wetForest:{temperature:[24,30],water:[1.3,2],ph:[4,6],light:[.1,1.2]},
  forest:{temperature:[24,29],water:[1.1,1.9],ph:[4,6],light:[.1,.9]}
 };
 return {...bands[profile],profile};
}

export function habitatReadings(plot,previous=null,context=null){
 let input=context;
 const f=context?.forecast,base=WORLD[plot];
 if(f){
  const growth=f.kind==='planted'?f.nativeFraction*f.year/10:null;
  input={plot:{...base,moisture:growth===null?f.moisture:.15+.79*growth,exposure:growth===null?f.exposure:.9-.65*growth,disturbance:null}};
 }else if(context?.recovery!=null){
  const growth=clamp(context.recovery/10);input={plot:{...base,moisture:.22+.72*growth,exposure:.85-.6*growth,disturbance:null}};
 }
 const r=patchReadings(plot,input?.plot?null:previous,input);if(!r)return null;
 // Acidic-soil scenario, not a prediction that canopy closure engineers pH.
 // Parent material is held fixed for both markers.
 const ph=Number((4.5+(plot%5)*.15).toFixed(1));
 return {...r,ph,closed:{...r.closed,ph}};
}
