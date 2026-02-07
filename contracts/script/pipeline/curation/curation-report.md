# Anons Head Trait Curation Report

## Overview

Curated the 254 Nouns head traits down to 148 mechanical/geometric/object heads that fit the Anons robot aesthetic. 106 organic/animal/plant/wearable heads were removed. 40 new robot-themed heads are specified for future creation.

**Final expected head count: 148 kept + 40 new = 188 heads**

---

## Excluded Heads (106)

### Animals (54)
aardvark, ape, bat, bear, beluga, bigfoot, bigfoot-yeti, capybara, cat, chameleon, chicken, cow, crab, crane, croc-hat, dino, dog, duck, ducky, flamingo, fox, frog, ghost-B, gnome, goat, goldfish, green-snake, grouper, horse-deepfried, jellyfish, kangaroo, moose, mosquito, mouse, orangutan, orca, otter, owl, oyster, panda, pufferfish, rabbit, raven, scorpion, shark, shrimp-tempura, squid, tiger, undead, unicorn, werewolf, whale, whale-alive, zebra

### Body Parts (4)
lips, brain, hair, tooth

### Plants (8)
bonsai, clover, fir, flower, peyote, rosebud, saguaro, weed

### Raw Organic Foods (20)
banana, beet, blueberry, cherry, chilli, garlic, mushroom, onion, peanut, pickle, pineapple, potato, pumpkin, watermelon, egg, coffeebean, bubblegum, cottonball, lint, sponge

### Wearables / Sports (20)
bagpipe, backpack, beanie, baseball-gameball, basketball, volleyball, hockeypuck, boxingglove, boot, highheel, pillow, retainer, thumbsup, smile, heart, chefhat, wizardhat, skeleton-hat, queencrown, crown

---

## Included Heads (148)

abstract, bag, bank, beer, bell, blackhole, bomb, boombox, box, bubble-speech, burger-dollarmenu, cake, calculator, calendar, camcorder, cannedham, car, cash-register, cassettetape, cd, chain, chainsaw, chart-bars, cheese, chipboard, chips, chocolate, cloud, clutch, cone, console-handheld, cookie, cordlessphone, cotton-candy, couch, crt-bsod, crystalball, curling-stone, diamond-blue, diamond-red, dictionary, dna, doughnut, drill, earth, faberge, factory-dark, fan, fax-machine, fence, film-35mm, film-strip, firehydrant, gavel, glasses-big, goldcoin, hanger, hardhat, helicopter, hotdog, house, icepop-b, igloo, index-card, island, jupiter, ketchup, laptop, lightning-bolt, lipstick2, lock, macaroni, mailbox, maze, microwave, milk, mirror, mixer, moon, mountain-snowcap, mug, mustard, nigiri, noodles, outlet, paintbrush, paperclip, pencil-tip, piano, pie, piggybank, pill, pipe, pirateship, pizza, plane, pop, porkbao, pyramid, rainbow, rangefinder, rgb, ring, road, robot, rock, ruler-triangular, sailboat, sand-castle, sandwich, satellite, saturn, saw, shower, skateboard, skilift, snowglobe, snowman, snowmobile, spaghetti, stapler, star-sparkles, steak, sunset, taco-classic, taxi, toaster, toiletpaper-full, toothbrush-fresh, tornado, trashcan, treasurechest, tuba, turing, ufo, vending-machine, vent, void, volcano, wall, wallet, wallsafe, washingmachine, watch, wave, weight, wine, wine-barrel

---

## New Robot Heads to Create (40)

### Screens & Monitors (8)
1. crt-static — CRT TV showing static/snow
2. oscilloscope — Green waveform display
3. terminal — Green text on black terminal
4. broken-lcd — Cracked LCD with glitch colors
5. security-monitor — Split-screen security cam view
6. led-matrix — Dot matrix display with simple face
7. e-ink — E-ink display, low contrast
8. hologram — Translucent blue holographic display

### Cameras & Surveillance (5)
9. cctv — Dome security camera
10. webcam — Simple webcam with LED
11. polaroid — Instant camera front
12. projector — Film projector with light beam
13. dashcam — Dashboard camera

### Industrial & Urban (6)
14. traffic-light — 3-light traffic signal
15. parking-meter — Coin-operated meter
16. atm — ATM screen and slot
17. gas-pump — Vintage gas pump
18. circuit-breaker — Electrical panel with switches
19. transformer — Electrical transformer box

### Audio & Music (5)
20. speaker-stack — Marshall-style amp stack
21. vinyl — Record on turntable
22. radio-vintage — 1950s tube radio
23. walkie-talkie — Two-way radio
24. synthesizer — Modular synth panel

### Retro Tech (5)
25. floppy — 3.5" floppy disk
26. gameboy — Handheld game console
27. pager — 90s pager with LCD
28. vcr — VCR with tape slot
29. rotary-phone — Rotary dial telephone

### Appliances (5)
30. blender — Kitchen blender
31. coffee-maker — Drip coffee machine
32. air-conditioner — Window AC unit
33. space-heater — Portable heater with coils
34. vacuum — Vacuum cleaner

### Weird / Fun (6)
35. lava-lamp — Lava lamp with blobs
36. disco-ball — Mirrored disco ball
37. gumball — Gumball machine
38. slot-machine — Casino slot display
39. vaporwave — Aesthetic bust with grid
40. magic-8ball — Fortune telling 8-ball

---

## Pipeline Integration

The curation step runs between `decode` and `roboticize`:

```
decode → curate → roboticize → generate-specs → generate-antennas → encode
```

- `curate-heads.js` reads `curation/included-heads.json` and copies 148 PNGs to `curated-traits/heads/`
- `roboticize.js` reads heads from `curated-traits/heads/` instead of `decoded-traits/heads/`
- Bodies and accessories remain unchanged (still read from `decoded-traits/`)

---

## Example Layer Compositions

```
Background → Body → Head → Specs → Antenna → Accessory

1. bg-warm-3 → body-robot-steel → head-crt-bsod → specs-led-green → antenna-whip → acc-chain
2. bg-cool-7 → body-robot-chrome → head-satellite → specs-led-red → antenna-dish → acc-pipe
3. bg-warm-1 → body-robot-matte → head-calculator → specs-led-blue → antenna-coil → acc-bolt
4. bg-cool-2 → body-robot-copper → head-toaster → specs-led-white → antenna-fork → acc-wrench
```
