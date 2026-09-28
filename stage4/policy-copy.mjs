// Every word the player reads. Edit here without touching the game.
// Short, plain, said once. The card says what happened; the player supplies why.
export const MISSIONS={
 tonne:{number:1,title:'By the tonne',intro:{title:'You are paid by the tonne.',paragraphs:[
  'Six patches of this island are under invasive grass. A funder pays for every tonne you remove, weighed the day you cut it.',
  'You have one crew. Each season, choose where it goes. Click a patch on the forest. The ground decides the job: grass gets cleared, bare ground gets planted, young trees get tended.',
  'The community lives on what the crew earns. Keep them solvent. Leave a forest if you can.']},
  lesson:'By the tonne, a healed forest is lost income.'},
 tree:{number:2,title:'By the tree',intro:{title:'Now you are paid by the tree.',paragraphs:[
  'A different funder. Nothing for tonnes removed. They pay every season for carbon in standing trees, a little for a young stand and more for forest.',
  'This is the better thing to pay for. The grant is larger this time.',
  'Same island, same crew. Grow something that pays before the grant runs out.']},
  lesson:'By the tree, the money arrives after the people have left.'},
 both:{number:3,title:'Both',intro:{title:'Now both are paid.',paragraphs:[
  'Tonnes today. Carbon later. Twelve seasons.',
  'You cannot restore everything, and the only early money is in clearing. Some ground you will keep working. Some you will turn back into forest. Choose which is which.',
  'A stand that closes its canopy is not forest yet. Canopy trees have to arrive. Bats and birds carry them in for free, if they still visit.']},
  lesson:'What you keep working decides what can come back.'},
};
export const JOBS={
 clear:{verb:'Clear',done:k=>`Cleared ${k}.`},
 plant:{verb:'Plant',done:k=>`Planted ${k} with fast pioneers.`},
 tend:{verb:'Tend',done:k=>`Weeded among the young trees in ${k}.`},
 burn:{verb:'Burn',done:k=>`Lit a burn in ${k}.`},
 enrich:{verb:'Plant canopy trees',done:k=>`Planted canopy trees under ${k} by hand.`},
};
export const STATE_LINE={
 invaded:'Invasive grass, waist high.',
 open:'Bare ground. Grass is coming back from the edges.',
 young:'Young pioneers. Grass will smother them if it gets ahead.',
 pioneer:'A closed stand of pioneers. It shades out the grass without help. It is not forest yet.',
 forest:'Forest. Damp, shaded, and it feeds the animals that carry seed.',
};
// Calls from Hazel. Each fires once, when the thing it explains has just happened or is about to.
export const CALLS={
 dryNext:'This is a dry season. After the crew has worked, fire will start in the pasture and run through joined-up grass. The Neck is the only way in.',
 fireKilled:k=>`The young trees in ${k} burned. Grass carried the fire to them.`,
 fireHeld:'The fire found nothing to carry it past the pasture.',
 returned:(k,pays)=>pays?`${k} has grown back. It would pay ${pays} again.`:`${k} has grown back.`,
 smothered:k=>`Grass smothered the young trees in ${k}. Nobody came back to weed.`,
 closed:k=>`The canopy has closed over ${k}. It holds without the crew, but it is not forest yet.`,
 slipping:k=>`${k} needs the crew. One more season and the grass takes it back.`,
 noAnimals:(k,because,need=1)=>`No bats or birds come to ${k}. ${because} ${because.includes(' and ')?'are':'is'} grass or bare ground, and they will not cross it, so no canopy seed arrives. Get ${need>1?need+' of them':'one of them'} under trees and they will come.`,
 animals:k=>`Bats and birds are feeding there, and they bring canopy seed with them.`,
 forest:(k,how)=>how==='animals'?`${k} is forest. Nobody planted the canopy trees. They were carried in.`:`${k} is forest, planted by hand.`,
 neckAgain:'You keep coming back to the Neck. A stand of trees there would keep fire out for good, and would not need clearing again.',
 broke:'The money is gone. The crew has taken work in town.',
};
export const about='A fictional island. The forest points are a measured airborne scan of Amazon forest. The patches, prices, growth, fire and animals are invented for teaching. Nothing here is a forecast or a carbon price.';
export const LAB={intro:'You are the funder now. Set what gets paid, then let a crew loose on the island. This crew follows the money and nothing else, though it can see ten years ahead. A rule is good if even they leave a forest, the community stays, and you can afford it.',
 good:'They followed the money and left a forest. That is a rule worth paying for.',
 mined:'They followed the money. It never led back to the forest.',
 broke:'The money ran out before anything paid. Nobody is left to keep the forest.',
 partial:'Some of it held. Most of the money was still in the grass.'};
export const HARD={intro:{title:'The harder island.',paragraphs:['Sixteen seasons. Living costs more. Nobody will call to explain what just happened.','You can also burn. A prescribed burn clears grass for almost nothing, and nobody pays for it, because nobody can verify it was additional. It needs thick dry grass to carry. It runs into any neighbour a wildfire would run into.','Try things. When something fails, look at what it touched.']},
 burnNote:'Costs 1. Pays nothing. It will run into any joined-up grass beside it.',burnDamp:'Too thin and damp to carry a burn.'};
