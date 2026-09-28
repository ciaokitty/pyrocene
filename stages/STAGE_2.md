Pyrocene: Stage 2
---

The game till now is in three stages, with the online pyrocene game
(https://github.com/bprashanth/pyrocene) Stage 3. Stage 3 itself has many
stages, and the goal is to tech players to asses incomplete ecological
information when several threats are competing for limited attention - within
the scope of ecological invasion, wildfires and native forests. 

This document briefly describes stage 1, and then mainly focuses on stage 2,
which  is the transition phase from an in person to an online game.

## Stage 1: Hidden Invasive Species 

Learn: Invasion, detection, removal 

To simplify the game, we have transposed it to Mafia with the following roles: 
* Mafia: Lantana
* Angel: Ranger 
* Sheriff: Ecologist
* Villager: Native trees

This stage has the same framework as Mafia. Every night the village sleeps. The
game master asks the ecologist to wake up and point at someone to learn about.
The game master gives a thumbs up if that player is lantana, and  a thumbs down
if not. Then they ask the Ranger to wake up and point at someone to save. And
Lantana to wake up and point at someoene to infest or take out of the game. 

The game ends if all natives are removed, or ecologist and ranger are removed,
or all lantana are removed (which happens through voting every night). In stage
1, fire is just a narrative closing line "the forest burned down because all
natives died..". 

## Stage 2: Ignition 

This is the challenge we will be desinging. 

The main idea is this. 

### Stage 2.a: A shared map that mirrors room state 

1. We need a companion app/pwa/site that helps the game master. 
2. This app registers users and assigns roles to them.
3. The game master just updates this app as players are removed. 
4. There is a shread forest map (this is the pyrocene map) that will be
projected  on screen. 
5. Every native / invasive in the game is assigned some portion of this map. Of
course their names won't be revealed. They can see their own roles on their
phones. 
6. If lantana survives one more night, it grows outwards to simulate
infestation. 
7. If an invasive/lanatna is removed  from play (gamemaster updates their
phone), that patch owned by it turns into native forest. 
8. If native is removed from the game (game master updates their phone), that
patch owned by it is turned into invasive. 

### Stage 2.b: Fire

Every night, instead of voting for just removal  of lanatan, we introduce
another  strategic choice.  The gropu can choose: go after lantana or build
fire resilience. 

1. Every night, fire is simulated on the map. 
2. The fire reduces forest health. 
3. We are not reflecting map damange back into the room, meaning if a players
segment is elimited by fire on the map but theyre still in game, they are not
removed  from game. 
4. Early in the game, there will be less lantana, and so the fires will be
tinier and random. As the game progresses, if lantana is allowed to spread more
and more, the fire also becomes more catastrophic. So basically as the game
progresses, the wildfires get more "connected" and erode the health score of
the shared forest even more - but of course, eliminitagin a lantana player will
help revive their entire region and result in less severe fires. 
5. Basically neglecting the fires can damange the forest and lose the game,
neglecting lantana can make the game go forever but never win since root cause
is not found.  

### Stage 2.c: Resilience

The group only has to make one choice regarding resilience. If they choose
resilience,  the system picks the action. The  goal here is to teach the room
these resilicence actions through  first telling them them embedding it in the
simulation or gameplay. The  resiliences  are

1. Fire line: On the map a visible fire break is placed  along a high risk
boundary, around the thing  that needs protection - this is usually native
forest, or village/houses. This happens in the same simulation turn and then
the fire breaks out and is shown on the map. The fire line stays for the whole
game around that asset protecting it. We can play around with this config later
- for now its simpler to retain it for all subsequent turns.

2. Early warning system: The players get a clue aboutt tthe _next_ night, eg:
tehre will be no fire next night, or there will be a big fire next night, or it
will be of severity 1 due  to low wind.. like that. _This_ nights fire still
happens as it was supposed to. 

3. Water: Reduces  the impact of  fire to 1. That is no matter the state of
lantana, if water / response team happens the  fire starts but dies quickly. 

The map must show meaningful simulations of these and the fire and explain the
action every night using concise text and simple language and this should be
stored  in some config that can easliy be modified without mucking with source
code. No AI tropes here, no emdash no "Not X, Y" language, don't use "the
whole"  and "not merely" and other random pseudo poetic language etc. 

The projected map has to tell a causal story so people learn. Eg: 

First the fire simulation, then: 

> A fire ignites inside a dense Lantana patch.
It spreads rapidly toward native forest.  Last night's fire line blocks its
path.

Or 

> A small ignition was detected early and controlled before it spread (for
> turn+1 and early warning). 


## New things that need building 

So this will need the game management interface itself.  The players register,
the game master sees roles. The game master updates removals. The game master
otherwise, presses the resilience button (or even chooses the resilience action
- water, ews etc).  I guess it will need a resolve night/submit kidn of button
  for scenarios like where everyone chose to remove lantana, but the lantana
was saved by the angel/ranger.  All this could just happen on a room server,
like the pwa takes the wifi address of a server for now.  And then of course
the map sync with the phone. Removal of players takes the right corresponding
action on the map. Simulate the correct types of fires basis the resilience
action. 

