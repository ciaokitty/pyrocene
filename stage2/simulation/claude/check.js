// node check.js [log.json ...]   rebuilds each log and compares the fire band
// the game logged with the one the rebuilt board implies. No output means fine.
const fs = require("fs"), path = require("path");
const P = require("./log.js");
let files = process.argv.slice(2);
if (!files.length) {
  files = [path.join(__dirname, "..", "sample-game.json")];
  const logs = path.join(__dirname, "..", "..", "logs");
  for (const f of fs.readdirSync(logs)) if (f.endsWith(".json") && f !== "index.json") files.push(path.join(logs, f));
}
let bad = 0;
for (const f of files) {
  const log = JSON.parse(fs.readFileSync(f, "utf8"));
  if (!log.game || !log.game.terrain) { console.log(path.basename(f), "no terrain, skipped"); continue; }
  const w = P.build(log);
  const c = P.check(w);
  const miss = c.filter(x => !x.ok);
  bad += miss.length;
  const crit = w.crit;
  console.log(path.basename(f), "nights", w.nights.length, "beats", w.beats.length, "dur", w.duration.toFixed(1) + "s",
    "sev", c.map(x => x.logged + (x.ok ? "" : "!" + x.expected)).join(" "),
    `thick ${w.nights.map(n=>n.thickAfter).join(" ")} joins ${w.nights.map(n=>n.joins.length).join("")} ` + (crit ? `crit n${crit.night} size ${crit.size} T${crit.T} major n${crit.major} cut ${crit.cut && crit.cut.length} rest ${crit.rest} seeded ${crit.seededNights} old ${crit.oldComps.length}` : "no crit"));
  if (process.env.CAPS) for (const b of w.beats) console.log("  ", b.t0.toFixed(1).padStart(5), b.kind.padEnd(9), "n" + b.night, b.cap);
}
console.log(bad ? `${bad} mismatches` : "all fire bands match");
