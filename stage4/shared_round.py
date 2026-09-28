"""One small collaborative round. Role tokens are capabilities, not accounts."""
import copy
import json
import secrets
import threading
from collections import OrderedDict
from pathlib import Path

CONFIG = json.loads(Path(__file__).with_name('round-config.json').read_text())
CANDIDATES = {c['key']: c for c in CONFIG['candidates']}
FOLLOWUP = CONFIG['followup']
NEW_PATCHES = {c['key']:c for c in FOLLOWUP['newPatches']}

def followup_budget(previous, choice):
    care = choice == previous['ecology']
    p = NEW_PATCHES.get(choice)
    if not care and p is None:
        raise RoundError(400, 'Choose a follow-up patch.')
    cost = FOLLOWUP['careCost'] if care else p['removalCost']
    returns = FOLLOWUP['careReturn'] if care else p['removalCost'] + p['income']
    starting = previous['left'] + FOLLOWUP['grant']
    return dict(care=care,cost=cost,returns=returns,starting=starting,left=starting+returns-cost)

def budget(removal, ecology):
    r, e = CANDIDATES[removal], CANDIDATES[ecology]
    cost = e['planting'] + (0 if removal == ecology else CONFIG['clearingCost'])
    return {'income': r['income'], 'cost': cost, 'removalCost':r['removalCost'], 'returns':r['income']+r['removalCost'],
            'totalCost':cost+r['removalCost'], 'healthLoss':r['healthLoss'], 'healthGain':e['healthGain'], 'left': CONFIG['grant'] + r['income'] - cost,
            'damage': r['damage'], 'cover': e['cover'], 'shared': removal == ecology}

class RoundError(Exception):
    def __init__(self, status, message):
        self.status = status
        super().__init__(message)

class RoundStore:
    def __init__(self):
        self.sessions = OrderedDict()
        self.lock = threading.RLock()

    def request(self, action, body):
        with self.lock:
            if action == 'new':
                sid = secrets.token_urlsafe(12)
                tokens = {r: secrets.token_urlsafe(24) for r in ('room','removal','ecology')}
                s = {'id': sid, 'tokens': tokens, 'revision': 0, 'phase': 'survey', 'round': 1,'mission':'cooperation','screen':'play','previous':None,
                     'proposals': {'removal': None, 'ecology': None},
                     'visited': {'removal': [], 'ecology': []}, 'committed': None}
                self.sessions[sid] = s
                while len(self.sessions) > 128:
                    self.sessions.popitem(last=False)
                return self.view(s, 'room')
            sid, token = body.get('session'), body.get('token')
            if not isinstance(sid, str) or not isinstance(token, str):
                raise RoundError(403, 'Open your team link.')
            s = self.sessions.get(sid)
            if s is None:
                raise RoundError(404, 'This round has ended. Ask for a new team link.')
            role = next((r for r,t in s['tokens'].items() if secrets.compare_digest(t,token)), None)
            if not role:
                raise RoundError(403, 'Open your team link.')
            if action == 'state':
                return self.view(s, role)
            owner = body.get('team') if role == 'room' else role
            if 'round' in body and body['round'] != s['round']:
                raise RoundError(409, 'The room started a new game. Try again.')
            independent = (action in ('visit','enter') and body.get('round') == s['round']) or (action == 'propose'
                and body.get('round') == s['round'] and body.get('phase') == s['phase']
                and isinstance(owner,str) and owner in s['proposals']
                and body.get('prior') == s['proposals'][owner])
            if type(body.get('revision')) is not int or (body['revision'] != s['revision'] and not independent):
                raise RoundError(409, 'The plan changed. Review it and try again.')
            if action in ('reveal','commit') and role != 'room':
                raise RoundError(403, 'The room makes this decision.')
            if action == 'replay':
                destination = body.get('destination','play')
                if destination not in ('play','expedition'):
                    raise RoundError(400, 'Choose Expedition or Cooperation.')
                s.update(phase='survey',mission='cooperation',screen=destination,previous=None, proposals={'removal':None,'ecology':None}, visited={'removal':[],'ecology':[]}, committed=None, round=s['round']+1)
            elif action == 'enter':
                s['screen'] = 'play'
            elif action == 'advance':
                if s['mission'] != 'cooperation' or s['phase'] != 'committed':
                    raise RoundError(409, 'Commit Cooperation first.')
                previous = copy.deepcopy(s['committed'])
                s.update(mission='negligence',screen='play',previous=previous,phase='survey',proposals={'removal':None,'ecology':None},visited={'removal':[],'ecology':[]},committed=None,round=s['round']+1)
            elif s['phase'] == 'committed':
                raise RoundError(409, 'This plan is committed.')
            elif action in ('visit','propose'):
                team = body.get('team') if role == 'room' else role
                if team not in ('removal','ecology') or (role != 'room' and body.get('team',role) != role):
                    raise RoundError(403, 'Use your own team view.')
                patch = body.get('patch')
                allowed = CANDIDATES if s['mission']=='cooperation' else {s['previous']['ecology'],*NEW_PATCHES}
                if not isinstance(patch,str) or patch not in allowed:
                    raise RoundError(400, 'Choose one of the three patches.')
                if action == 'visit':
                    if patch not in s['visited'][team]:
                        s['visited'][team].append(patch)
                elif patch not in s['visited'][team]:
                    raise RoundError(400, 'Look closely at this patch first.')
                else:
                    s['proposals'][team] = patch
            elif action == 'reveal':
                if not all(s['proposals'].values()):
                    raise RoundError(400, 'Both teams need a proposal.')
                s['phase'] = 'review'
            elif action == 'commit':
                if s['phase'] != 'review' or not all(s['proposals'].values()):
                    raise RoundError(400, 'Reveal both proposals first.')
                if s['mission']=='negligence' and s['proposals']['removal']!=s['proposals']['ecology']:
                    raise RoundError(400, 'Agree on one follow-up patch.')
                result = budget(**s['proposals']) if s['mission']=='cooperation' else followup_budget(s['previous'],s['proposals']['removal'])
                if result['left'] < 0:
                    raise RoundError(400, 'This plan costs more than the available funds.')
                s['committed'] = {**s['proposals'], **result}
                s['phase'] = 'committed'
            else:
                raise RoundError(404, 'Unknown round action.')
            s['revision'] += 1
            return self.view(s, role)

    def view(self, s, role):
        shown = s['phase'] != 'survey' or role == 'room'
        view = {k: copy.deepcopy(s[k]) for k in ('id','revision','phase','round','committed','mission','screen','previous')}
        view.update(role=role, token=s['tokens'][role], ready={k:v is not None for k,v in s['proposals'].items()},
                    proposals={k:v if shown or k==role else None for k,v in s['proposals'].items()},
                    visited={k:list(v) for k,v in s['visited'].items() if role=='room' or k==role})
        if role == 'room':
            view['teams'] = {k:v for k,v in s['tokens'].items() if k!='room'}
        if s['phase'] != 'survey' and all(s['proposals'].values()):
            view['budget'] = budget(**s['proposals']) if s['mission']=='cooperation' else followup_budget(s['previous'],s['proposals']['removal'])
        return view
