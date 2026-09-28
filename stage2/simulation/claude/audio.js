/* audio.js: a little sound, all made on the spot. Wind under everything, a
 * crackle that grows with the fire, a thump at ignition, a held note when the
 * line holds, a whir when time runs back. Off until the room presses play,
 * and M mutes it. */
(function (root) {
  "use strict";
  function create() {
    let ac = null, master, wind, windGain, fire, fireGain, rumble, rumbleGain, muted = false, level = { fire: 0 }, crackleTimer = 0;
    function noiseBuffer(seconds, colour) {
      const sr = ac.sampleRate, len = sr * seconds, buf = ac.createBuffer(1, len, sr), d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (colour === "pink") { b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12; }
        else d[i] = w * 0.5;
      }
      return buf;
    }
    function enable() {
      if (ac) { if (ac.state === "suspended") ac.resume(); return; }
      const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return;
      ac = new AC();
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.6; master.connect(ac.destination);
      // wind
      wind = ac.createBufferSource(); wind.buffer = noiseBuffer(4, "pink"); wind.loop = true;
      const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 380; bp.Q.value = 0.6;
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.11; const lfoG = ac.createGain(); lfoG.gain.value = 180;
      lfo.connect(lfoG); lfoG.connect(bp.frequency); lfo.start();
      windGain = ac.createGain(); windGain.gain.value = 0.35;
      wind.connect(bp); bp.connect(windGain); windGain.connect(master); wind.start();
      // fire bed
      fire = ac.createBufferSource(); fire.buffer = noiseBuffer(3, "white"); fire.loop = true;
      const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1400;
      fireGain = ac.createGain(); fireGain.gain.value = 0;
      fire.connect(hp); hp.connect(fireGain); fireGain.connect(master); fire.start();
      rumble = ac.createOscillator(); rumble.type = "sine"; rumble.frequency.value = 52;
      rumbleGain = ac.createGain(); rumbleGain.gain.value = 0; rumble.connect(rumbleGain); rumbleGain.connect(master); rumble.start();
    }
    function tone(freq, dur, type, vol, glide) {
      if (!ac) return;
      const o = ac.createOscillator(), g = ac.createGain(); o.type = type || "sine";
      o.frequency.setValueAtTime(freq, ac.currentTime);
      if (glide) o.frequency.exponentialRampToValueAtTime(glide, ac.currentTime + dur);
      g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      o.connect(g); g.connect(master); o.start(); o.stop(ac.currentTime + dur + 0.05);
    }
    function burst(dur, vol, hpf) {
      if (!ac) return;
      const s = ac.createBufferSource(); s.buffer = noiseBuffer(dur + 0.1, "white");
      const f = ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hpf || 800;
      const g = ac.createGain(); g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(); s.stop(ac.currentTime + dur + 0.1);
    }
    function cue(beat, adjacent) {
      if (!ac || !adjacent) return;
      switch (beat.kind) {
        case "ignite": tone(90, 0.7, "sine", 0.5, 38); burst(0.35, 0.25, 600); break;
        case "flash": tone(120, 0.4, "sine", 0.25, 60); burst(0.25, 0.15, 900); break;
        case "held": tone(659, 1.4, "triangle", 0.18); setTimeout(() => tone(988, 1.6, "triangle", 0.14), 160); break;
        case "capped": tone(523, 1.0, "triangle", 0.14); break;
        case "clear": tone(440, 0.25, "triangle", 0.12, 660); break;
        case "taken": tone(330, 0.35, "sawtooth", 0.05, 220); break;
        case "dig": for (let k = 0; k < 4; k++) setTimeout(() => burst(0.08, 0.12, 300), 120 * k); break;
        case "rewind": tone(420, 1.2, "sawtooth", 0.06, 120); break;
        case "crit": tone(220, 1.8, "sine", 0.16); break;
        case "connected": case "fuel": tone(196, 1.4, "sine", 0.14); break;
        case "end": tone(262, 2.0, "sine", 0.12); break;
        case "after": if (beat.fire && beat.fire.cells.length > 12) tone(65, 1.6, "sine", 0.22, 40); break;
      }
    }
    function set(s) {
      level = s;
      if (!ac) return;
      const f = s.playing ? s.fire : 0;
      fireGain.gain.setTargetAtTime(0.5 * f, ac.currentTime, 0.15);
      rumbleGain.gain.setTargetAtTime(0.35 * f * f, ac.currentTime, 0.2);
      windGain.gain.setTargetAtTime(s.playing ? (s.rewind ? 0.12 : 0.35) : 0.12, ac.currentTime, 0.4);
      const now = performance.now();
      if (f > 0.05 && now > crackleTimer) { crackleTimer = now + 40 + Math.random() * 160 / (0.3 + f); burst(0.03 + Math.random() * 0.05, 0.12 * f, 2000); }
    }
    function mute(m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : 0.6, ac.currentTime, 0.05); }
    return { enable, cue, set, mute, get muted() { return muted; } };
  }
  root.PyroAudio = { create };
})(typeof window !== "undefined" ? window : globalThis);
