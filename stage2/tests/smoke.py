"""Play one whole game headless and print every frame to the terminal so a
human (or a screenshot) can check the map tells the story. Not a test; a look."""
import os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from stage2.game import Game, LANTANA, NATIVE_P
from stage2 import frames

def main():
    seed = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    delay = float(os.environ.get("DELAY", "0"))
    g = Game(seed=seed)
    for i in range(12):
        g.add_player(f"P{i+1}")
    g.start()
    roles = {p.id: p.role for p in g.players.values()}
    print("roles:", roles)
    print("\x1b[2J", end="")
    print(frames.frame_bytes(frames.render_beat({"kind": "round", "text": "start", "fire": [], "view": g.view()})))
    time.sleep(delay)
    plan = [("hunt", None, "lantana"), ("resilience", "fireline", None), ("hunt", None, "native"),
            ("resilience", None, None), ("hunt", None, "lantana"), ("resilience", "water", None),
            ("hunt", None, "lantana"), ("hunt", None, None)]
    for choice, action, kill in plan:
        if g.phase != "playing":
            break
        if kill:
            victim = next((p for p in g.players.values() if p.alive and p.role == kill), None)
            if victim:
                g.eliminate(victim.id)
        g.choose(choice, action)
        for b in g.resolve():
            print(frames.frame_bytes(frames.render_beat(b)))
            time.sleep(delay * (b["hold_ms"] / 1000))
    print()
    for h in g.history:
        print(f"round {h['round']}: {h['choice']}/{h['action']} elim={[e['role'] for e in h['eliminations']]} "
              f"fire sev {h['fire']['severity']} burned {len(h['fire']['cells'])} health {h['health']}")
    print("ending:", g.ending)

if __name__ == "__main__":
    main()
