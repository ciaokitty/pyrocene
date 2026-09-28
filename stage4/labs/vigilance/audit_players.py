"""Replay actual CLI tool calls. Never trust a player's self-reported score.

Reads external JSONL transcripts; does not print model reasoning or credentials.
Only recognised game tokens become engine input. No transcript shell is executed.
"""
import json
import re
import shlex
import subprocess
from pathlib import Path

from .run_players import ROOT, OUT

SCRIPT = """
import {newGame,act,buy,observe} from './stage4/labs/vigilance/model.mjs';
const input=JSON.parse(process.argv[1]),g=newGame(input.seed,input.distribution);
let refused=null;
for(const token of input.tokens){const [a,b,c]=token.split(':');
 try{a==='buy'?buy(g,b,c||null):act(g,a,b||null);}catch(e){refused={token,reason:e.message};break;}}
const v=observe(g);
console.log(JSON.stringify({metrics:v.metrics,refused,moves:g.moves,cue:v.cue,
  plots:v.plots.map(p=>({key:p.key,state:p.state,canopy:p.canopy,last:p.last}))}));
"""

def commands(path):
    for line in path.read_text().splitlines():
        try:
            record=json.loads(line)
        except ValueError:
            continue
        for block in record.get('message',{}).get('content',[]):
            if isinstance(block,dict) and block.get('type')=='tool_use':
                yield block.get('input',{}).get('command','')
        if record.get('type')=='tool_call' and record.get('subtype')=='started':
            yield record.get('tool_call',{}).get('shellToolCall',{}).get('args',{}).get('command','')

def parse(command):
    try:
        parts=shlex.split(command)
    except ValueError:
        return None
    if len(parts)<3 or parts[:2]!=['node','stage4/labs/vigilance/play.mjs'] or not parts[2].isdigit():
        return None
    seed=int(parts[2]);tokens=parts[3:];distribution='varied'
    if tokens[:1]==['--distribution']:
        distribution=tokens[1];tokens=tokens[2:]
    if distribution not in ['varied','gentle','severe'] or any(not re.fullmatch(r'[a-z]+(?::[a-z]+){0,2}',t) for t in tokens):
        return None
    return dict(seed=seed,distribution=distribution,tokens=tokens)

def audit(path):
    calls=[parse(c) for c in commands(path)];valid=[c for c in calls if c]
    if not valid:
        return {'file':path.name,'error':'No permitted game commands found.'}
    run=valid[-1]
    state=json.loads(subprocess.check_output(['node','--input-type=module','-e',SCRIPT,json.dumps(run)],cwd=ROOT,text=True))
    return {'file':path.name,'calls':len(valid),'unrecognised':len(calls)-len(valid),**run,**state}

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('paths',nargs='*');args=parser.parse_args()
    for path in [Path(p) for p in args.paths] if args.paths else sorted(OUT.glob('*.jsonl')):
        print(json.dumps(audit(path)))
