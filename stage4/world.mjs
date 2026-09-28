import { SECTORS } from './model.mjs';
import { ADDITIONAL_SPECIES, INVASIVE_IDS, expandPlotSpecies } from './forest-flora.mjs';

// A declared training world on the film's measured footprint. These values
// are NOT inferred from LiDAR or attributed to real landholders.
export const WORLD_VERSION = 'amazon-field-course-2';
export const TAXA = ['urochloa_brizantha','megathyrsus_maximus','urochloa_decumbens','cecropia_obtusa','phenakospermum_guyannense','oenocarpus_bacaba','nephrolepis_biserrata','bertholletia_excelsa','euterpe_oleracea','mauritia_flexuosa','hevea_brasiliensis','theobroma_grandiflorum','manihot_esculenta','carapa_guianensis','copaifera_reticulata','paullinia_cupana','bactris_gasipaes','astrocaryum_vulgare',...ADDITIONAL_SPECIES.map(s=>s.id)];
const species = {
  0:[7,13,14],1:[5,6,9],2:[7,10,14],3:[3,4,6],
  6:[5,8,9],7:[7,13,10],8:[3,4,6],9:[10,11,14],10:[3,4,17],
  12:[0,2,3],13:[0,1,3],14:[5,6,8],15:[1,2,4],16:[7,10,13],
  19:[0,2,3],20:[3,4,5],21:[5,6,9],22:[1,2,17],23:[10,13,14],
  26:[6,8,9],27:[0,1,3],28:[0,2,17],29:[7,11,16],
  32:[12,15,16],33:[0,1,2],34:[11,12,15],35:[5,16,17],
};
const damp = new Set([1,6,14,21,26]);
const dry = new Set([8,12,13,15,19,22,27,28,33]);
const exposed = new Set([3,8,12,13,15,19,22,28,32,33,34]);
const burns = new Set([8,13,19,27]);
const logging = new Set([3,15,22]);
const treefall = new Set([10,14,20]);
const people = new Set([2,7,16,23,29,32,33,34,35]);
const refuges = new Set([0,1,2,6,7,16,21,23,29]);
const inventories=Object.fromEntries(Object.entries(species).map(([id,ids],n)=>[id,expandPlotSpecies(Number(id),ids.map(i=>TAXA[i]),n)]));
export const WORLD = SECTORS.map(s => ({
  id:s.id, active:s.active,
  fuel:s.active ? dry.has(s.id) ? .92 : damp.has(s.id) ? .55 : .65 : 0,
  moisture:damp.has(s.id) ? .86 : dry.has(s.id) ? .16 : .47,
  exposure:exposed.has(s.id) ? .85 : .22,
  ignition:s.id === 33,
  disturbance:burns.has(s.id) ? 'fire' : logging.has(s.id) ? 'logging' : treefall.has(s.id) ? 'treefall' : null,
  invasive:(inventories[s.id] || []).some(id=>INVASIVE_IDS.has(id)), people:people.has(s.id), habitat:refuges.has(s.id),
  speciesIds:inventories[s.id] || [],
}));
export const ACTIVE = WORLD.filter(c=>c.active);
export const coordinate = id => `${String.fromCharCode(65+Math.floor(id/6))}${id%6+1}`;
const source = {
  fire:'https://doi.org/10.1098/rstb.2012.0427',
  climate:'https://doi.org/10.1890/05-0404',
  sound:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9170030/',
  people:'https://doi.org/10.1016/j.ecolecon.2019.106359',
  structure:'https://essd.copernicus.org/articles/18/1243/2026/index.html',
};
export function fieldRecord(id, snapshot=WORLD) {
  const c = snapshot[id];
  if (!c?.active) throw Error('Choose a place inside the scanned forest.');
  const wet = c.moisture>.7;
  const isDry = c.moisture<.3;
  const traces = c.disturbance === 'fire' ? {
    title:'A fire passed through',
    text:'The field team found char on several trunks and an old ash layer. Young plants now grow between standing dead stems.',
    question:'Does the new growth join this patch to its neighbour?', tag:'fire', source:source.fire,
  } : c.disturbance === 'logging' ? {
    title:'Trees were cut here',
    text:'Cut stumps and an old extraction track occur beneath the opening. Branches were left on the ground. The record does not establish who cut the trees or whether the work was permitted.',
    question:'Is the material beneath the opening still damp?', tag:'logging', source:source.structure,
  } : c.disturbance === 'treefall' ? {
    title:'A fallen tree',
    text:'An upturned root plate lies beside a fallen trunk. The team found no cut stump or char at this spot.',
    question:wet ? 'Why is the litter damp even though the canopy is open?' : 'An opening has several possible causes. What would you check next?', tag:'treefall', source:source.structure,
  } : {
    title:'No clear disturbance record',
    text:'The field team did not find char or cut stumps in this small search. That does not prove the forest has never been disturbed.',
    question:'What would a longer record tell you?', tag:'uncertain', source:source.structure,
  };
  if(c.scenarioDisturbance==='simulated timber work'){
    traces.title='Fresh cuts near an older opening';
    traces.text='The field team found fresh cut surfaces and branches beside an extraction route. Compare the dated canopy and sound records. These traces do not identify the operator or establish whether the work was permitted.';
    traces.tag='logging';
  }else if(c.scenarioDisturbance==='simulated field preparation'){
    traces.title='A field being prepared';
    traces.text='Low vegetation has been cut back. Some material remains in piles. Ask how the field will be prepared and whether neighbours are coordinating the work.';
    traces.tag='logging';
  }
  const climate = {
    title:wet ? 'Damp underfoot' : isDry ? 'Dry material beneath green plants' : 'A sheltered forest floor',
    text:wet ? 'The litter bends without breaking. The ground is shaded and moist. Nearby openings do not tell us the moisture here.' : isDry ? 'Dead leaves break easily in the hand. Living leaves are still green. A continuous layer of dry material crosses the plot.' : 'Some leaves are damp below the surface. The upper litter is drier. Do not treat the whole patch as one moisture condition.',
    morning:wet ? '23 °C - 93% humidity' : isDry ? '25 °C - 81% humidity' : '24 °C - 88% humidity',
    afternoon:wet ? '26 °C - 85% humidity' : isDry ? '32 °C - 53% humidity' : '28 °C - 72% humidity',
    wind:c.exposure>.7 ? 'The afternoon wind reaches this opening.' : 'Little wind reaches the forest floor.',
    question:wet ? 'Could this damp patch interrupt a route through dry litter?' : 'Which neighbouring patch would you check before predicting a route?',
    tag:wet ? 'damp' : isDry ? 'dry' : 'mixed', source:source.climate,
  };
  const humanId = [32,34].includes(id) ? 'garden' : id===33 ? 'burning' : [2,7,16,23].includes(id) ? 'carbon' : [29,35].includes(id) ? 'harvest' : 'shared';
  const human = {
    garden:{title:'A garden at the forest edge',text:'The practice field record describes cassava and fruit plants grown for food. The family also collects forest products. Their work does not tell us whether a fire will escape.',question:'What support would make land preparation safer?',tag:'garden'},
    burning:{title:'A planned field burn',text:'A grower plans to burn cut vegetation beside the forest. Neighbours have not yet agreed on help or timing. Dry grass continues from the field edge into nearby patches.',question:'What could change before the burn begins?',tag:'ignition'},
    carbon:{title:'Keeping forest standing',text:'A community group is considering income from a forest carbon project. They need to understand the proposed rules and how benefits would be shared. The standing trees also have other uses.',question:'What would need protecting and monitoring over time?',tag:'carbon'},
    harvest:{title:'Fruit without felling the tree',text:'The practice record describes fruit collection from palms and other trees. Travel and harvest depend on access to several patches, not just the place where people live.',question:'What would a fire interrupt besides the canopy?',tag:'harvest'},
    shared:{title:'A place connected to other people',text:'No house is recorded in this plot. That does not mean nobody uses it. Ask who gathers plants or travels through before drawing a management boundary.',question:'What is still missing from this account?',tag:'unknown'},
  }[humanId];
  const bonus = [0,7,16,21].includes(id) ? {kind:'camera',title:'A visitor after dark',text:'A practice camera-trap record shows a tapir passing at night. One sighting does not establish a population trend. This place matters even if it does not become a fire route.',source:'https://www.amazonconservation.org/what-we-do/put-science-and-tech-to-work/technology-for-conservation/'} : [8,19,23].includes(id) ? {kind:'sound',title:'Listen at a different hour',text:'This practice sound log records fewer insect calls at night than at the comparison station. Check repeated recordings and weather before explaining the difference.',source:source.sound} : null;
  const humanSource=humanId==='carbon'?'https://verra.org/programs/verified-carbon-standard/develop-a-vcs-project/':humanId==='garden'?'https://doi.org/10.3390/d2010072':humanId==='harvest'?'https://doi.org/10.1371/journal.pone.0102187':source.people;
  return {traces, climate, human:{...human,source:humanSource}, bonus};
}

export const MISSIONS = [
  {id:'plants',title:'Meet the forest',brief:'Meet some plants in different parts of the forest. Look at what lies beneath them too.',task:'Find six plants in three places.',hint:'Try a canopy opening and a sheltered patch. A field team can identify the plants.',recall:'Where did you find dry material? Was it on living plants or beneath them?'},
  {id:'traces',title:'Find out what happened',brief:'Look for places where the canopy changes. Ask the field team what they find on the ground.',task:'Compare two different disturbance records.',hint:'Char, cut stumps and upturned roots support different explanations. An opening alone does not tell you its cause.',recall:'Where did people disagree about a disturbance? What evidence would settle it?'},
  {id:'climate',title:'Find the damp places',brief:'Check the air and the litter. Find a damp place and a dry place. Look at what connects them.',task:'Compare damp and dry field observations.',hint:'Green plants can stand above dry litter. Compare the morning and afternoon readings.',recall:'Which places stayed damp? Why? Could they interrupt connected fuel?'},
  {id:'people',title:'Meet the people who use the forest',brief:'Find out how people use these plants and places. Look for a possible fire source and a reason to keep forest standing.',task:'Read two different accounts and two plant uses.',hint:'Look at the forest edge and a place used for gathering or conservation. A house is not evidence of an ignition.',recall:'Who would lose food, income or access? What could people change together?'},
];
