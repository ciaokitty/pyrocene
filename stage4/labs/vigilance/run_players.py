"""Actual CLI players. Runtime transcripts live outside Git, with no source access requested."""
import argparse
import concurrent.futures
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
OUT=Path('/mnt/seagate/models/pyrocene/stage4/qa-expedition/vigilance-players')
def run(kind,seed,label,distribution,lesson='',cursor_model='gpt-5.4-mini-low'):
    profile='Income first. Fund recovery through clearance but do not confuse bare ground with closed canopy.' if kind=='claude' else 'Ecology first. Keep earlier planting alive. Consider information before buying protection, but do not bankrupt the crew.'
    prompt=f'''Play a fictional forest game as a player, NOT a developer. {profile}
Your ONLY permitted shell command is node stage4/labs/vigilance/play.mjs SEED followed by a full move trace. No reading source, no files, no edits, no other commands. Start seed {seed}.
Tokens: clear:middle plant:middle tend:middle buy:heatmap buy:community:middle buy:firebreak:middle buy:ews buy:mulch:middle buy:dispersers:middle enrich:middle burn:middle wait. A purchase costs money but NO turn. Only buy what's useful.
Use --distribution {distribution} immediately after seed {seed} in EVERY command. Each call must include ALL previous tokens. Play one decision at a time, no hidden-state search or branching forecasts. Read each result. You may undo a bad decision by omitting a token, but this does not change the weather draw. Stop only when OBJECTIVE REACHED, status done or broke. Do not stop at a temporary setback with actions remaining. A refused wait does NOT mean bankruptcy if another harvest can earn money. At most 45 CLI calls.
Open/BARE GROUND is not restored. Planting can die. Mixed forest DOES count toward closure. Aim for THREE LOWER CANOPIES at Neck, Edge, East, not arbitrary northern patches. Sensors reveal evidence. Local protection expires. Follow-up costs capital you might otherwise use on another planting.
Finish with EXACT full token trace, actual printed turn/credits/health/target count and status. Report failure honestly. Explain one decision changed by evidence, one wasted purchase, and the shortest useful clue you wished for. Never edit any file.
{lesson}'''
    if kind=='claude':cmd=['claude','-p','--model','haiku','--permission-mode','dontAsk','--allowedTools','Bash(node stage4/labs/vigilance/play.mjs *)','--output-format','stream-json','--verbose','--',prompt]
    else:cmd=['agent','-p','--model',cursor_model,'--force','--trust','--output-format','stream-json',prompt]
    OUT.mkdir(parents=True,exist_ok=True)
    path=OUT/f'{label}-{kind}-{seed}.jsonl'
    with path.open('w') as out:
        result=subprocess.run(cmd,cwd=ROOT,stdout=out,stderr=subprocess.STDOUT,timeout=900)
    print(json.dumps({'player':kind,'model':'haiku' if kind=='claude' else cursor_model,'seed':seed,'exit':result.returncode,'transcript':str(path)}),flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--label',default='v2');p.add_argument('--claude-seed',type=int,default=113);p.add_argument('--cursor-seed',type=int,default=247);p.add_argument('--distribution',default='varied',choices=['varied','gentle','severe']);p.add_argument('--lesson',default='');a=p.parse_args()
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        jobs=[pool.submit(run,'claude',a.claude_seed,a.label,a.distribution,a.lesson),pool.submit(run,'cursor',a.cursor_seed,a.label,a.distribution,a.lesson)]
        for job in jobs:job.result()
