// Fictional teaching values. Deliberately isolated from Cooperation/Negligence.
export const VERSION='vigilance-2';
export const PLOTS=[{key:'neck',id:27,name:'Neck',target:true,yield:11},{key:'edge',id:28,name:'Edge',target:true,yield:14},{key:'east',id:22,name:'East',target:true,yield:16},{key:'middle',id:21,name:'Middle',yield:19},{key:'north',id:15,name:'North',yield:13},{key:'far',id:9,name:'Far',yield:9}];
export const LINKS=[['pasture','neck'],['pasture','edge'],['road','east'],['neck','edge'],['neck','middle'],['edge','east'],['middle','east'],['middle','north'],['north','far']];
export const TOOLS={
 heatmap:{name:'Invasive survey',cost:5,scope:'all',turns:99,kind:'information',note:'Maps current grass pressure and likely seed sources. No protection.'},
 ews:{name:'Weather alerts',cost:5,scope:'all',turns:99,kind:'information',note:'Maps next-turn dryness. Local monitors can act on fire warnings.'},
 dispersers:{name:'Seed monitoring',cost:2,scope:'plot',turns:99,kind:'information',note:'Reveals native seed routes. Useful after shade, not a substitute for planting.'},
 community:{name:'Community care',cost:4,scope:'plot',turns:4,kind:'protection',note:'Four turns of early weeding. With weather alerts, also responds to fire.'},
 firebreak:{name:'Firebreak',cost:5,scope:'plot',turns:4,kind:'protection',note:'Four turns of reduced incoming fire. Does not stop all fire.'},
 mulch:{name:'Protect soil',cost:2,scope:'plot',turns:3,kind:'protection',note:'Three turns of reduced drought stress. Does not stop grass or fire.'},
};
export const RULES={turns:24,grant:18,crew:3,plant:7,tend:1,clear:2,burn:2,enrich:8,closedPay:1,mixedPay:3,growth:.18,loss:.78,stall:.43,repeatLoss:2};
export const DISTRIBUTIONS={gentle:{grass:.75,fire:.7,drought:.75},varied:{grass:1,fire:1,drought:1},severe:{grass:1.3,fire:1.25,drought:1.2}};
