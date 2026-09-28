import { INVENTORY_TREES, INVENTORY_PROFILE } from './inventory-trees.mjs';
export { INVENTORY_PROFILE };
const source=(title,url)=>({title,url});
const kws=(name,id)=>[source('Kew: '+name,'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:'+id)];
const additions=[
  {id:'andropogon_gayanus',name:'Gamba grass',scientific:'Andropogon gayanus',status:'Invasive',growthForm:'Tall pasture grass',layer:'understory',form:'grass',description:'An introduced African grass recorded in burned forest edges in an Amazon fire experiment.',plainUse:'People introduced it as pasture for cattle.',sources:[source('Silvério et al. 2013: Amazon fire and grass invasion','https://doi.org/10.1098/rstb.2012.0427')]},
  {id:'melinis_minutiflora',name:'Molasses grass',scientific:'Melinis minutiflora',status:'Invasive',growthForm:'Pasture grass',layer:'ground',form:'grass',description:'An African grass that invades Brazilian savanna and forest edges. Its inclusion here is a regional teaching example.',plainUse:'It was introduced for pasture. Dense growth can hinder the establishment of other plants.',sources:[source('Hoffmann et al. 2004: savanna-forest ecotone','https://doi.org/10.1111/j.1366-9516.2004.00063.x')]},
  {id:'piper_aduncum',name:'Spiked pepper',scientific:'Piper aduncum',status:'Native',growthForm:'Shrub or small tree',layer:'understory',form:'shrub',description:'A native tropical American shrub or small tree. It is invasive in some countries outside its native range, not an alien here.',plainUse:'Its leaves have recorded traditional uses. Being common in an opening does not make it an alien plant.',sources:kws('Piper aduncum','680296-1')},
  {id:'palicourea_tomentosa',name:'Soldier’s cap',scientific:'Palicourea tomentosa',status:'Native',growthForm:'Shrub',layer:'understory',form:'shrub',description:'A native tropical American shrub. Older records may call it Psychotria poeppigiana.',plainUse:'Regional records describe traditional uses. Here it is a native part of the lower forest.',sources:kws('Palicourea tomentosa','77115635-1')},
  {id:'uncaria_tomentosa',name:'Cat’s claw',scientific:'Uncaria tomentosa',status:'Native',growthForm:'Woody liana',layer:'understory',form:'liana',description:'A native woody climber. Its stems use other vegetation for support and can reach above the lower forest.',plainUse:'It has recorded traditional uses. A climber is not necessarily invasive.',sources:kws('Uncaria tomentosa','768322-1')},
  {id:'doliocarpus_dentatus',name:'Doliocarpus dentatus',scientific:'Doliocarpus dentatus',status:'Native',growthForm:'Woody liana',layer:'understory',form:'liana',description:'A native tropical American woody climber recorded in the Guianas and northern Brazil.',plainUse:'It climbs through other vegetation. Its shape is a clue to growth form, not to whether it is invasive.',sources:kws('Doliocarpus dentatus','82916-2')},
];
export const ADDITIONAL_SPECIES=[...additions,...INVENTORY_TREES.map(([scientific,family,records,plots,median,p90])=>({
  id:scientific.toLowerCase().replaceAll(' ','_'),name:scientific,scientific,status:'Native',growthForm:family==='Arecaceae'?'Forest palm':'Forest tree',form:family==='Arecaceae'?'palm':'tree',
  // A displayed small individual is not a claim about this species' adult height.
  layer:median<16?'understory':'canopy',displayStage:median<16?'small individual':'upper tree',
  family,inventory:{records,plots,medianDbhCm:median,p90DbhCm:p90},
  description:`Recorded in ${plots} GUYADIV survey plots in French Guiana. It belongs to the ${family} family.`,
  plainUse:`Among measured trunks at least 10 cm wide, the middle diameter was ${median} cm. These are French Guiana survey records, not measurements of this game square.`,
  sources:[source('Sabatier et al.: GUYADIV v2, CC BY 4.0','https://doi.org/10.23708/RLYCVQ')]
}))];
export const INVASIVE_IDS=new Set(['urochloa_brizantha','megathyrsus_maximus','urochloa_decumbens','andropogon_gayanus','melinis_minutiflora']);
const layers={urochloa_brizantha:'ground',urochloa_decumbens:'ground',megathyrsus_maximus:'understory',nephrolepis_biserrata:'ground',phenakospermum_guyannense:'understory',manihot_esculenta:'understory',paullinia_cupana:'understory',theobroma_grandiflorum:'understory'};
export function plantLayer(sp){return sp.layer||layers[sp.id]||'canopy';}
export function plantForm(sp){return sp.form||(/grass/i.test(sp.growthForm)?'grass':/fern/i.test(sp.growthForm)?'shrub':sp.id==='paullinia_cupana'?'liana':sp.id==='manihot_esculenta'?'shrub':/palm/i.test(sp.growthForm)?'palm':'tree');}
export const LAYERS={ground:{name:'Near the ground',colour:'#dc719d',range:[.3,1.8]},understory:{name:'Below the canopy',colour:'#69bccc',range:[2,8]},canopy:{name:'Canopy',colour:'#99d8ab',range:[14,30]}};

// Existing named discoveries are preserved; the new inventory is deliberately
// not a complete botanical census of a 150 x 150 m square.
export function expandPlotSpecies(id,original,plotIndex){
  const result=[...original],add=sp=>{if(!result.includes(sp))result.push(sp);};
  const invaded=original.some(sp=>INVASIVE_IDS.has(sp));
  if(invaded)add(plotIndex%2?'andropogon_gayanus':'melinis_minutiflora');
  add(plotIndex%2?'piper_aduncum':'palicourea_tomentosa');
  add(plotIndex%2?'uncaria_tomentosa':'doliocarpus_dentatus');
  // Eight successive inventory trees ensure all 96 occur on the map. Further
  // records vary richness without removing the original discoveries.
  const trees=ADDITIONAL_SPECIES.slice(6);
  for(let n=0;n<8;n++)add(trees[(plotIndex*8+n)%trees.length].id);
  const target=14+(id%5);
  for(let n=0;result.length<target;n++)add(trees[(plotIndex*13+n*7)%trees.length].id);
  return result;
}
