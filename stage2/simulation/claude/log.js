/* log.js: read the event log, rebuild every board, find the moment that mattered.
 *
 * Nothing here draws. It turns the log into
 *   frames   one board per phase per night (removals, trench, spread, thicken, fire)
 *   nights   what happened each night, in plain terms
 *   crit     the first night the thick lantana was big enough for the biggest
 *            fire this game saw, and which squares made it so
 *   beats    the script the player runs, in order, with durations and captions
 *
 * Runs in the page and under node (for the checks in check.js).
 */
(function (root) {
  "use strict";

  // The game's own numbers (stage2/config.py). Severity is the size of the
  // largest 8-connected stand of thick lantana: under sev_t1 small, under
  // sev_t2 medium, else big. A stand thickens by age: young for a night, then
  // spreading for two nights, then thick. The log does not carry ages, so the
  // age of stands that were already there on night zero is assumed to be zero.
  const CONFIG = {
    sev_t1: 7, sev_t2: 13,
    age_to_established: 1, age_to_dense: 2,
    initial_stage_age: 0,
    pace: 0.88,           // multiplies every beat's length; the 1.5x button is the other knob
  };

  const NATIVE = 0, INVASIVE = 1, BARE = 2, WATER = 3, VILLAGE = 4;
  const COVER = { native: NATIVE, invasive: INVASIVE, bare: BARE, water: WATER, village: VILLAGE };

  function parseCell(name, cols) {
    const c = name.charCodeAt(0) - 65;
    const r = parseInt(name.slice(1), 10) - 1;
    return r * cols + c;
  }

  // ---- boards ------------------------------------------------------------
  function Board(n) {
    this.cover = new Uint8Array(n);
    this.stage = new Uint8Array(n);      // 1..3 for invasive, else 0
    this.age = new Uint8Array(n);
    this.fireline = new Uint8Array(n);
    this.lineNight = new Int8Array(n).fill(-1);
    this.burnt = new Int8Array(n).fill(-1);   // the last night this square burned
    this.seeded = new Int8Array(n).fill(-1);  // the night lantana arrived (0 = start)
    this.how = new Uint8Array(n);             // 0 start, 1 spread, 2 taken
  }
  Board.prototype.clone = function () {
    const b = new Board(this.cover.length);
    for (const k of ["cover", "stage", "age", "fireline", "lineNight", "burnt", "seeded", "how"]) b[k].set(this[k]);
    return b;
  };

  function neighbours8(i, cols, rows) {
    const r = (i / cols) | 0, c = i % cols, out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.push(rr * cols + cc);
    }
    return out;
  }
  function neighbours4(i, cols, rows) {
    const r = (i / cols) | 0, c = i % cols, out = [];
    if (r > 0) out.push(i - cols);
    if (r < rows - 1) out.push(i + cols);
    if (c > 0) out.push(i - 1);
    if (c < cols - 1) out.push(i + 1);
    return out;
  }

  function clusters(set, cols, rows, eight) {
    const seen = new Set(), out = [];
    const nb = eight ? neighbours8 : neighbours4;
    for (const s of set) {
      if (seen.has(s)) continue;
      const comp = [], q = [s];
      seen.add(s);
      while (q.length) {
        const i = q.pop();
        comp.push(i);
        for (const n of nb(i, cols, rows)) if (set.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
      }
      out.push(comp);
    }
    out.sort((a, b) => b.length - a.length);
    return out;
  }

  function thickSet(b) {
    const s = new Set();
    for (let i = 0; i < b.cover.length; i++) if (b.cover[i] === INVASIVE && b.stage[i] === 3) s.add(i);
    return s;
  }
  function band(n) { return n < CONFIG.sev_t1 ? 1 : n < CONFIG.sev_t2 ? 2 : 3; }

  // ---- reading the log ---------------------------------------------------
  function build(log) {
    const g = log.game, cols = g.cols, rows = g.rows, n = cols * rows;
    const hill = new Uint8Array(n), road = new Uint8Array(n), owner = new Array(n).fill(null);
    const b0 = new Board(n);
    for (const t of g.terrain) {
      const i = parseCell(t.cell, cols);
      b0.cover[i] = COVER[t.cover];
      if (t.cover === "invasive") {
        b0.stage[i] = t.stage || 2;
        b0.age[i] = CONFIG.initial_stage_age;
        b0.seeded[i] = 0;
      }
      hill[i] = t.hill ? 1 : 0;
      road[i] = t.road ? 1 : 0;
      owner[i] = t.owner || null;
    }

    const frames = [];       // {night, phase, board, health}
    const nights = [];
    function push(night, phase, board, health) {
      frames.push({ night, phase, board, health, idx: frames.length });
      return frames.length - 1;
    }
    const h0 = log.rounds.length ? log.rounds[0].health_before : health(b0);
    push(0, "fire", b0, h0);

    let prev = b0;
    for (const rec of log.rounds) {
      const k = rec.turn;
      const fire = rec.fire && rec.fire.severity > 0 && (rec.fire.burned_cells || []).length ? rec.fire : null;
      const res = rec.resilience || null;
      const burnedSet = new Set(fire ? fire.burned_cells.map(x => parseCell(x, cols)) : []);
      const trench = res && res.type === "fire_line" ? (res.cells || []).map(x => parseCell(x, cols)) : [];
      const trenchSet = new Set(trench);
      const changes = rec.landscape_changes || [];
      const last = new Map();
      changes.forEach((ch, idx) => last.set(ch.cell, idx));

      const cleared = [], taken = [], spread = [], regrow = [], clearedNative = [];
      changes.forEach((ch, idx) => {
        const i = parseCell(ch.cell, cols);
        if (ch.to === "bare" && burnedSet.has(i) && last.get(ch.cell) === idx) return;   // the fire, applied below
        if (ch.to === "bare" && trenchSet.has(i)) return;                                 // the trench, applied below
        if (ch.to === "invasive_spreading") taken.push(i);
        else if (ch.to === "invasive_young") spread.push(i);
        else if (ch.to === "invasive_thick") spread.push(i);
        else if (ch.to === "native") (ch.from === "invasive" ? clearedNative : regrow).push(i);
        else if (ch.to === "bare") cleared.push(i);
      });

      const night = { k, rec, fire, res, cleared: cleared.concat(clearedNative), taken, trench, spread, regrow,
                      thickened: [], toSpreading: [], frames: {} };
      night.frames.start = frames.length - 1;

      // 1. removals
      let b = prev.clone();
      for (const i of cleared) { b.cover[i] = BARE; b.stage[i] = 0; b.age[i] = 0; }
      for (const i of clearedNative) { b.cover[i] = NATIVE; b.stage[i] = 0; b.age[i] = 0; }
      for (const i of taken) { b.cover[i] = INVASIVE; b.stage[i] = 2; b.age[i] = 0; b.seeded[i] = k; b.how[i] = 2; }
      night.frames.elim = push(k, "elim", b, rec.health_before);

      // 2. the trench
      b = b.clone();
      for (const i of trench) {
        b.fireline[i] = 1; b.lineNight[i] = k;
        if (b.cover[i] === INVASIVE) { b.cover[i] = BARE; b.stage[i] = 0; b.age[i] = 0; }
      }
      night.frames.dig = push(k, "dig", b, rec.health_before);

      // 3. lantana spreads, bare ground regrows
      b = b.clone();
      for (const i of spread) { b.cover[i] = INVASIVE; b.stage[i] = 1; b.age[i] = 0; b.seeded[i] = k; b.how[i] = 1; }
      for (const i of regrow) { b.cover[i] = NATIVE; b.stage[i] = 0; b.age[i] = 0; }
      night.frames.spread = push(k, "spread", b, rec.health_before);

      // 4. stands that survived the night get thicker (the game's advance rule)
      b = b.clone();
      for (let i = 0; i < n; i++) {
        if (b.cover[i] !== INVASIVE || b.stage[i] < 1 || b.stage[i] >= 3) continue;
        b.age[i] += 1;
        const thr = b.stage[i] === 1 ? CONFIG.age_to_established : CONFIG.age_to_dense;
        if (b.age[i] >= thr) {
          b.stage[i] += 1; b.age[i] = 0;
          (b.stage[i] === 3 ? night.thickened : night.toSpreading).push(i);
        }
      }
      night.frames.thicken = push(k, "thicken", b, rec.health_before);

      // 5. the fire
      b = b.clone();
      if (fire) for (const i of burnedSet) { b.cover[i] = BARE; b.stage[i] = 0; b.age[i] = 0; b.burnt[i] = k; }
      night.frames.fire = push(k, "fire", b, rec.health);
      night.health_before = rec.health_before;
      night.health = rec.health;
      night.health_loss = rec.health_loss;

      // what the thick stands did tonight: sizes, joins
      const prevThick = thickSet(frames[night.frames.start].board);
      const nowThick = thickSet(frames[night.frames.thicken].board);
      const prevCl = clusters(prevThick, cols, rows, true);
      const nowCl = clusters(nowThick, cols, rows, true);
      night.thickBefore = prevCl.length ? prevCl[0].length : 0;
      night.thickAfter = nowCl.length ? nowCl[0].length : 0;
      night.biggest = nowCl.length ? nowCl[0] : [];
      night.joins = [];
      for (const comp of nowCl) {
        const old = new Set(comp.filter(i => prevThick.has(i)));
        const oldComps = clusters(old, cols, rows, true);
        if (oldComps.length >= 2 && comp.length >= 4) {
          night.joins.push({ comp, oldComps, bridge: comp.filter(i => !prevThick.has(i)) });
        }
      }
      nights.push(night);
      prev = b;
    }

    const world = { cols, rows, n, hill, road, owner, frames, nights, log, config: CONFIG };
    world.dirOf = cells => dirOf(cells, cols, rows);
    world.crit = findCritical(world);
    world.beats = script(world);
    return world;
  }

  function health(b) {
    let land = 0, nat = 0;
    for (let i = 0; i < b.cover.length; i++) {
      if (b.cover[i] === WATER) continue;
      land++;
      if (b.cover[i] === NATIVE) nat++;
    }
    return Math.round(100 * nat / Math.max(land, 1));
  }

  function dirOf(cells, cols, rows) {
    if (!cells || !cells.length) return "middle";
    let r = 0, c = 0;
    for (const i of cells) { r += (i / cols) | 0; c += i % cols; }
    r /= cells.length; c /= cells.length;
    const ns = r < rows * 0.38 ? "north" : r > rows * 0.62 ? "south" : "";
    const ew = c < cols * 0.38 ? "west" : c > cols * 0.62 ? "east" : "";
    return (ns + (ns && ew ? " " : "") + ew) || "middle";
  }

  // ---- the moment that mattered --------------------------------------------
  // The first night the largest thick stand reached the size the game uses for
  // the band of the biggest fire that actually happened. Then the squares that
  // made the difference: the smallest set of newly thick squares whose removal
  // would have kept every stand below that size, so a vote that cleared them
  // would have held the fire to the band below.
  function findCritical(world) {
    const { nights, cols, rows, frames } = world;
    let major = null;
    for (const nt of nights) {
      if (!nt.fire) continue;
      if (!major || nt.fire.burned_cells.length > major.fire.burned_cells.length) major = nt;
    }
    if (!major) return null;
    const sev = major.fire.severity;
    const T = sev >= 3 ? CONFIG.sev_t2 : sev === 2 ? CONFIG.sev_t1 : null;
    if (!T) return null;
    let critNight = null;
    if (thickSet(frames[0].board).size >= T && clusters(thickSet(frames[0].board), cols, rows, true)[0].length >= T) critNight = 0;
    for (const nt of nights) {
      if (nt.thickAfter >= T) { critNight = nt.k; break; }
    }
    if (critNight === null || critNight >= major.k) return null;

    const nt = nights.find(x => x.k === critNight);
    const board = frames[nt.frames.thicken].board;
    const before = frames[nt.frames.start].board;
    const prevThick = thickSet(before);
    const K = nt.biggest;
    const Kset = new Set(K);
    const oldSet = new Set(K.filter(i => prevThick.has(i)));
    const oldComps = clusters(oldSet, cols, rows, true);
    const fresh = K.filter(i => !prevThick.has(i));

    function maxWithout(removed) {
      const s = new Set(K.filter(i => !removed.has(i)));
      const cl = clusters(s, cols, rows, true);
      return cl.length ? cl[0].length : 0;
    }
    // candidates: fresh squares next to the old stands, then any fresh square
    let cut = null;
    const touching = fresh.filter(i => neighbours8(i, cols, rows).some(j => oldSet.has(j)));
    const pool = (touching.length ? touching : fresh).slice(0, 40);
    for (const i of pool) if (maxWithout(new Set([i])) < T) { cut = [i]; break; }
    if (!cut) {
      let best = null;
      for (let a = 0; a < pool.length && !best; a++) for (let b = a + 1; b < pool.length; b++) {
        if (maxWithout(new Set([pool[a], pool[b]])) < T) { best = [pool[a], pool[b]]; break; }
      }
      cut = best;
    }
    if (!cut && fresh.length) {
      // remove whole runs of fresh squares by the night they were seeded
      const byNight = new Map();
      for (const i of fresh) { const s = board.seeded[i]; if (!byNight.has(s)) byNight.set(s, []); byNight.get(s).push(i); }
      for (const [, cells] of [...byNight.entries()].sort((a, b) => a[1].length - b[1].length)) {
        if (maxWithout(new Set(cells)) < T) { cut = cells; break; }
      }
    }
    if (!cut && maxWithout(new Set(fresh)) < T) cut = fresh.slice();

    let rest = cut ? maxWithout(new Set(cut)) : null;
    const seededNights = cut ? [...new Set(cut.map(i => board.seeded[i]))].sort((a, b) => a - b) : [];
    const hows = cut ? [...new Set(cut.map(i => board.how[i]))] : [];
    return {
      night: critNight, T, sev, major: major.k, majorBurned: major.fire.burned_cells.length,
      size: K.length, stand: K, oldComps, fresh, cut, rest,
      restBand: rest === null ? null : band(rest),
      seededNights, hows,
      dirs: oldComps.slice(0, 2).map(c => dirOf(c, cols, rows)),
    };
  }

  // ---- captions ------------------------------------------------------------
  const BANDS = { 1: "a small fire", 2: "a fire that runs", 3: "a big fire" };
  function sq(n, word) { return n === 1 ? "one " + word : n + " " + word + "s"; }
  function nightWord(k) { return k === 0 ? "the start" : "night " + k; }

  function ignitionCaption(fire, world, cells) {
    const dir = world.dirOf(cells);
    const i = parseCell(fire.ignition_cell, world.cols);
    const b = world.frames[world.frames.length - 1].board;
    if (fire.ignition_cause === "road_human") return "Someone on the road starts a fire in the " + dir + ".";
    if (fire.ignition_cause === "dense_lantana") return "A fire starts in the thick lantana in the " + dir + ".";
    const near = neighbours4(i, world.cols, world.rows).some(j => b.cover[j] === WATER);
    return "A spark catches in the " + dir + (near ? ", by the water." : ".");
  }

  function spreadCaption(fire, night, world) {
    const pre = world.frames[night.frames.thicken].board;
    const cells = fire.burned_cells.map(x => parseCell(x, world.cols));
    let lant = 0, nat = 0;
    for (const i of cells) { if (pre.cover[i] === INVASIVE) lant++; else if (pre.cover[i] === NATIVE) nat++; }
    const n = cells.length;
    if (fire.severity <= 1 && n <= 4) return "It burns " + sq(n, "square") + " and goes out.";
    if (nat > lant) return "It runs through the fuel and on into the forest.";
    return "It runs where the fuel is continuous.";
  }

  // ---- the script ------------------------------------------------------------
  // A beat is one thing on screen for a few seconds. Everything the player
  // needs to draw any instant is here: which board to come from and go to,
  // where to look, what to say.
  function script(world) {
    const { nights, frames, crit } = world;
    const beats = [];
    let t = 0;
    function add(b) { b.dur *= CONFIG.pace; b.t0 = t; t += b.dur; b.i = beats.length; beats.push(b); return b; }
    const last = frames.length - 1;
    const endHealth = frames[last].health;
    const g = world.log.game;

    const initialLant = [];
    for (let i = 0; i < world.n; i++) if (frames[0].board.cover[i] === INVASIVE) initialLant.push(i);
    const startCl = clusters(new Set(initialLant), world.cols, world.rows, true);

    // 1. the board as the room last saw it, then the paper lifts
    add({ kind: "open", night: nights.length, dur: 2.8, from: last, to: last, tilt: 0, zoom: 1,
          cap: "The forest as you left it. " + endHealth + "% still standing.", hud: true });
    add({ kind: "lift", night: nights.length, dur: 1.7, from: last, to: last, tilt: [0, 1], zoom: [1, 1.04],
          cap: "Here is how it got there." });
    add({ kind: "rewind", night: 0, dur: 1.5, from: last, to: 0, tilt: 1, zoom: 1.04, cap: "Back to the start." });
    const where = startCl.slice(0, 3).map(c => world.dirOf(c));
    add({ kind: "hold", night: 0, dur: 2.4, from: 0, to: 0, tilt: 1, zoom: 1.04,
          focus: initialLant, cap: "Night zero. Lantana holds " + sq(initialLant.length, "square") +
          (startCl.length > 1 ? " in " + startCl.length + " patches: the " + listDirs(where) + "." : " in the " + where[0] + ".") });

    let majorNight = crit ? crit.major : null;
    if (majorNight === null) {
      let best = null;
      for (const nt of nights) if (nt.fire && (!best || nt.fire.burned_cells.length > best.fire.burned_cells.length)) best = nt;
      majorNight = best ? best.k : null;
    }

    for (const nt of nights) {
      const k = nt.k;

      // removals: what the vote and the night did to the ground
      if (nt.cleared.length && nt.taken.length) {
        add({ kind: "clear", night: k, dur: 2.4, from: nt.frames.start, to: nt.frames.elim, focus: nt.cleared.concat(nt.taken), zoom: 1.1,
          cap: "A lantana patch in the " + world.dirOf(nt.cleared) + " was pulled out. A native stand in the " + world.dirOf(nt.taken) + " was lost, and lantana moves in." });
      } else if (nt.cleared.length) {
        add({ kind: "clear", night: k, dur: 1.9, from: nt.frames.start, to: nt.frames.elim, focus: nt.cleared, zoom: 1.2,
          cap: "A lantana patch in the " + world.dirOf(nt.cleared) + " was found and pulled out. Bare ground for now." });
      } else if (nt.taken.length) {
        add({ kind: "taken", night: k, dur: 1.9, from: nt.frames.start, to: nt.frames.elim, focus: nt.taken, zoom: 1.2,
          cap: "A native stand in the " + world.dirOf(nt.taken) + " was lost. Lantana moves in." });
      } else {
        add({ kind: "hold", night: k, dur: 0.9, from: nt.frames.elim, to: nt.frames.elim, zoom: 1.04, cap: "Night " + k + ". The land is the same as it was." });
      }

      // the room's one choice
      if (nt.res) {
        if (nt.res.type === "fire_line" && nt.trench.length) {
          add({ kind: "dig", night: k, dur: 2.3, from: nt.frames.elim, to: nt.frames.dig, focus: nt.trench, zoom: 1.3,
            cap: (nt.rec.auto ? "The crew digs a fire line" : "The room spends its night digging a fire line") +
                 " on the " + world.dirOf(nt.trench) + " side of the lantana." });
        } else if (nt.res.type === "water") {
          add({ kind: "water", night: k, dur: 1.5, from: nt.frames.dig, to: nt.frames.dig, zoom: 1.04,
            cap: "A response team stands by tonight." });
        } else if (nt.res.type === "early_warning") {
          add({ kind: "ews", night: k, dur: 1.4, from: nt.frames.dig, to: nt.frames.dig, zoom: 1.04,
            cap: "A lookout goes up. The next fire will be forecast." });
        }
      }

      // lantana spreads, and what survived grows thicker
      const joined = nt.joins.length > 0;
      const critHere = crit && crit.night === k;
      let cap;
      if (nt.spread.length) cap = "Lantana spreads into " + sq(nt.spread.length, "more square") + ".";
      else cap = "Lantana did not spread tonight.";
      if (joined) cap += " Separate stands meet in the " + world.dirOf(nt.joins[0].bridge) + ".";
      else if (nt.thickened.length) cap += " Stands that survived the night grow thicker.";
      add({ kind: "grow", night: k, dur: joined ? 2.6 : nt.spread.length ? 2.0 : 1.3, from: nt.frames.dig, to: nt.frames.thicken, mid: nt.frames.spread,
            focus: nt.spread, thick: nt.thickened, bridge: joined ? nt.joins[0].bridge : null, zoom: 1.04, cap });
      if (critHere) {
        add({ kind: "connected", night: k, dur: 2.6, from: nt.frames.thicken, to: nt.frames.thicken, stand: crit.stand, zoom: 1.08,
          cap: "One connected stand of thick lantana, " + sq(crit.size, "square") + ". In this game, enough fuel for " + BANDS[crit.sev] + "." });
      }

      // the fire
      const f = nt.fire;
      if (!f) {
        add({ kind: "quiet", night: k, dur: 0.9, from: nt.frames.thicken, to: nt.frames.fire, zoom: 1.04, cap: "No fire tonight." });
        continue;
      }
      const cells = f.burned_cells.map(x => parseCell(x, world.cols));
      const ign = parseCell(f.ignition_cell, world.cols);
      const waves = f.waves && f.waves.length ? f.waves.map(w => w.map(x => parseCell(x, world.cols))) : [cells];
      const blocked = f.blocked_edges && f.blocked_edges.length;
      const major = k === majorNight;
      const big = f.severity >= 2 || cells.length >= 10;
      const small = !major && !big && !blocked && !f.village_reached && !f.capped_by_water && cells.length <= 4;
      const lost = nt.health_before - nt.health;
      if (small) {
        add({ kind: "flash", night: k, dur: 2.0, from: nt.frames.thicken, to: nt.frames.fire, ign, fire: { waves, cells, per: 0.3 }, ash: cells, zoom: 1.2, focus: cells,
              health: [nt.health_before, nt.health],
              cap: ignitionCaption(f, world, [ign]) + " " + (cells.length === 1 ? "One square burns and it goes out." : cells.length + " squares burn and it goes out.") });
        continue;
      }
      if (major && f.severity >= 2) {
        const thick = [...thickSet(frames[nt.frames.thicken].board)];
        const cl = clusters(new Set(thick), world.cols, world.rows, true);
        const standCells = cl.length ? cl[0] : thick;
        add({ kind: "fuel", night: k, dur: 2.8, from: nt.frames.thicken, to: nt.frames.thicken, stand: standCells, zoom: 1.08,
          cap: "Before the fire. The thick lantana is one connected stand of " + sq(standCells.length, "square") + "." });
      }
      add({ kind: "ignite", night: k, dur: major ? 1.9 : 1.4, from: nt.frames.thicken, to: nt.frames.thicken,
            ign, fire: { waves, cells }, zoom: major ? 1.6 : 1.4, cap: ignitionCaption(f, world, [ign]) });
      const per = major ? Math.max(0.42, Math.min(0.7, 5.0 / waves.length)) : Math.max(0.3, Math.min(0.5, 2.4 / waves.length));
      add({ kind: "burn", night: k, dur: Math.max(1.2, per * waves.length + 0.5), from: nt.frames.thicken, to: nt.frames.thicken,
            ign, fire: { waves, cells, per }, zoom: major ? 1.2 : 1.25, focus: cells, cap: spreadCaption(f, nt, world) });
      if (blocked) {
        const held = [...new Set(f.blocked_edges.map(e => parseCell(e[1], world.cols)))];
        const pressed = [...new Set(f.blocked_edges.map(e => parseCell(e[0], world.cols)))];
        const nightsDug = held.map(i => frames[nt.frames.fire].board.lineNight[i]).filter(x => x >= 0);
        const dug = nightsDug.length ? Math.min(...nightsDug) : k;
        add({ kind: "held", night: k, dur: 3.2, from: nt.frames.thicken, to: nt.frames.thicken, ign, fire: { waves, cells, per, done: true },
              held, pressed, zoom: 1.5, focus: held.concat(pressed),
              cap: "The fire line dug on night " + dug + " stops it here. The ground behind it is untouched." });
      }
      if (f.capped_by_water) {
        add({ kind: "capped", night: k, dur: 2.2, from: nt.frames.thicken, to: nt.frames.thicken, ign, fire: { waves, cells, per, done: true }, zoom: 1.3, focus: cells,
              cap: "The response team reaches it at " + sq(cells.length, "square") + " and puts it out." });
      }
      if (f.village_reached) {
        add({ kind: "village", night: k, dur: 2.2, from: nt.frames.thicken, to: nt.frames.thicken, ign, fire: { waves, cells, per, done: true }, zoom: 1.4, focus: cells,
              cap: "It reaches the edge of the homes." });
      }
      add({ kind: "after", night: k, dur: major ? 2.8 : 1.8, from: nt.frames.thicken, to: nt.frames.fire, fire: { waves, cells, per, done: true }, ash: cells,
            zoom: major ? 1.0 : 1.04, health: [nt.health_before, nt.health],
            cap: sq(cells.length, "square") + " burned." + (lost > 0 ? " The forest is down to " + nt.health + "%." : " The forest held at " + nt.health + "%.") });
    }

    // the end
    const ending = (g.ending && g.ending.text) || "The season ends.";
    add({ kind: "end", night: nights.length, dur: 3.4, from: last, to: last, tilt: 1, zoom: 1.0, cap: ending, hud: true });

    // run it back
    if (crit) {
      const nt = nights.find(x => x.k === crit.night);
      const critFrame = nt ? nt.frames.thicken : 0;
      add({ kind: "rewind", night: crit.night, dur: Math.max(2.0, 0.45 * (nights.length - crit.night) + 1.0), from: last, to: critFrame, zoom: 1.0,
            cap: "Run it back." });
      add({ kind: "crit", night: crit.night, dur: 3.4, from: critFrame, to: critFrame, stand: crit.stand, zoom: 1.08,
            cap: "Night " + crit.night + ". The first night the thick lantana was one stand of " + crit.size + " squares. In this game, enough for " + BANDS[crit.sev] + "." });
      if (crit.cut && crit.cut.length) {
        let where;
        if (crit.oldComps.length >= 2) {
          const [a, b] = crit.dirs;
          where = a === b ? "These squares joined two stands in the " + a + " into one."
                          : "These squares joined the stand in the " + a + " to the stand in the " + b + ".";
        } else {
          where = "These squares took the stand in the " + world.dirOf(crit.stand) + " past that size.";
        }
        add({ kind: "cut", night: crit.night, dur: 3.0, from: critFrame, to: critFrame, stand: crit.stand, cut: crit.cut, zoom: 1.3, focus: crit.cut, cap: where });
        const sn = crit.seededNights;
        const how = crit.hows.length === 1 ? crit.hows[0] : -1;
        let origin;
        if (sn.length === 1 && sn[0] === 0) origin = "Lantana held them from the start of the game.";
        else if (sn.length === 1 && how === 2) origin = "Lantana took them on night " + sn[0] + ", when a native stand was lost.";
        else if (sn.length === 1 && how === 1) origin = "Lantana spread into them on night " + sn[0] + ". Nobody cleared them.";
        else if (sn.length === 1) origin = "Lantana took them on night " + sn[0] + ".";
        else origin = "Lantana took them on nights " + sn.slice(0, -1).join(", ") + " and " + sn[sn.length - 1] + ", and nobody cleared them.";
        add({ kind: "cut", night: crit.night, dur: 3.0, from: critFrame, to: critFrame, stand: crit.stand, cut: crit.cut, zoom: 1.3, focus: crit.cut, cap: origin });
        if (crit.restBand !== null && crit.restBand < crit.sev) {
          add({ kind: "cut", night: crit.night, dur: 3.6, from: critFrame, to: critFrame, stand: crit.stand, cut: crit.cut, zoom: 1.2, focus: crit.cut, split: true,
                cap: "A vote that cleared them before night " + crit.night + " would have left stands of at most " + crit.rest + " squares. Under this game's rules, that is " + BANDS[crit.restBand] + "." });
        }
      }
      add({ kind: "crit", night: crit.night, dur: 4.0, from: critFrame, to: critFrame, stand: crit.stand, zoom: 1.0, hud: true, final: true,
            cap: nightsWord(crit.night) + " of arguing about who to vote out. This is what the ground was doing." });
    } else {
      const won = g.ending && g.ending.result === "win";
      add({ kind: "crit", night: nights.length, dur: 3.4, from: last, to: last, zoom: 1.0, hud: true, final: true,
            cap: won ? "The lantana was pulled out before any stand grew big enough for a big fire. Scrub back through it by hand."
                     : "No stand of thick lantana grew big enough for a big fire in this game. Scrub back through it by hand." });
    }
    world.duration = t;
    return beats;
  }

  function nightsWord(k) {
    const w = ["No nights", "One night", "Two nights", "Three nights", "Four nights", "Five nights", "Six nights", "Seven nights", "Eight nights"];
    return (w[k] || k + " nights");
  }
  function listDirs(ds) {
    if (ds.length === 1) return ds[0];
    return ds.slice(0, -1).join(", the ") + " and the " + ds[ds.length - 1];
  }

  // ---- checks used by check.js ------------------------------------------------
  function check(world) {
    const out = [];
    for (const nt of world.nights) {
      const f = nt.rec.fire;
      if (!f || !f.severity || f.capped_by_water) continue;
      const start = world.frames[nt.frames.start].board;
      const cl = clusters(thickSet(start), world.cols, world.rows, true);
      const n = cl.length ? cl[0].length : 0;
      const exp = band(n);
      let fuel = false;
      for (let i = 0; i < world.n; i++) if (start.cover[i] === INVASIVE && start.stage[i] >= 2) fuel = true;
      out.push({ night: nt.k, logged: f.severity, expected: fuel || n ? exp : 0, biggest: n, ok: f.severity === (fuel || n ? exp : 0) });
    }
    return out;
  }

  root.PyroLog = { build, check, parseCell, clusters, thickSet, band, CONFIG, COVER, neighbours4, neighbours8, dirOf };
})(typeof window !== "undefined" ? window : globalThis);
if (typeof module !== "undefined") module.exports = globalThis.PyroLog;
