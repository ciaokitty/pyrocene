"""Repeatable balance probes. Policy decisions use only public observable data."""
import json
from stage4.ash_game import AshGame

EARLY=['lidar','drone D4','remove D4','restore D4','drone I4','remove I4','restore I4','drone B8','remove B8','restore B8']


def dense_policy(wait=0,seed=7):
    game=AshGame(seed);history=[];pending=None;results=[]
    while (view:=game.view()['view'])['status']=='playing':
        if not history:command='lidar'
        elif len(history)<=wait:command='pass'
        elif pending:command='restore '+pending;pending=None
        else:
            size=view['action_sizes']['work']
            scores=[(sum(cell['cover']=='invasive' and cell['stage']==3 for cell in view['cells'] if r<=cell['r']<r+size and c<=cell['c']<c+size),r,c) for r in range(view['rows']) for c in range(view['cols'])]
            count,r,c=max(scores,key=lambda item:item[0])
            pending=f'{chr(65+c)}{r+1}' if count else None
            command='remove '+pending if pending else 'pass'
        history.append(command);results.append(game.command(command))
    return summary(game,results,history)


def scripted(commands,seed=7):
    game=AshGame(seed);results=[];history=[]
    for command in commands+['pass']*14:
        if game.view()['view']['status']!='playing':break
        history.append(command);results.append(game.command(command))
    return summary(game,results,history)


def summary(game,results,history):
    view=game.view()['view']
    return {**{k:view[k] for k in ('status','turn','health','wildlife')},
            'fire_cells':sum(len(event.get('firePublicCells',[])) for result in results for event in result['events']),
            'seedling_patches_retained':sum(event.get('reclaimed',0) for result in results for event in result['events']),
            'commands':history}


if __name__=='__main__':
    print(json.dumps({'early':scripted(EARLY),'wait':scripted(['pass']*14),
                     'reactive_delays':{str(n):dense_policy(n) for n in range(8)}},indent=2))
