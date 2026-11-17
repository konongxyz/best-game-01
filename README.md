# best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/konongxyz/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/konongxyz/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Emberfall: a lantern-keeper's stand — an original 2D arena survival game for the browser, built with plain HTML5 canvas and ES modules. No engine, no build step, no network. Hold a stone-ringed grove against ten waves of shadow creatures, draft a boon after every wave, and face the Hollow King on wave 10.

## Run it

```sh
node serve.ts          # http://localhost:8080
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=9m688dgh&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>

An original 2D arena survival game for the browser, built with plain
HTML5 canvas and ES modules — no engine, no build step, no network.
You are Wren, the lantern-keeper of a stone-ringed grove. When the dark
comes, shadow creatures pour in from the ring in ten growing waves.
Keep the lantern lit until dawn.

## How to play

- **Move** with WASD or the arrow keys, **aim** with the mouse, and
  **hold click** to fire ember bolts.
- **Shift** dashes through danger (with a short cooldown).
- Gather the **embers** creatures drop for score; rare **hearts** heal.
- After each wave the grove offers a **boon**: pick 1 of 3 upgrades —
  faster fire, heavier embers, twin lanterns, piercing light, a wind
  cloak and more — and your keeper keeps it for the whole run.
- Six creature kinds test you: gloam moths, dusk darts that lunge,
  spitter wisps that keep their distance, splitters that burst into
  mites, umbra brutes, and on wave 10 **the Hollow King**, who charges,
  breathes rings of shadow and calls his swarm as he weakens.
- Beat the King and dawn breaks — you win. Lose all your hearts and the
  light goes out. Either way the end screen shows your score, wave,
  banishments and time, and one key starts a fresh run. Your best score
  is kept between visits.

Pause with **P**, mute with **M**.

## Running it

Serve the `game/` folder with any static file server and open
`index.html`, or use the bundled one:

```sh
node serve.ts          # http://localhost:8080
```

## Layout

- `game/index.html` — the page shell and canvas.
- `game/src/main.js` — bootstrap, the fixed-step loop and the game modes.
- `game/src/world.js` — wave tables, spawning and run flow.
- `game/src/entities.js` — the keeper, the creatures, bolts, orbs, drops.
- `game/src/upgrades.js` — the boon draft between waves.
- `game/src/render.js` — all drawing: grove, creatures, HUD and screens.
- `game/src/particles.js` — sparks, rings, drifting embers, floating text.
- `game/src/audio.js` — WebAudio-synthesised effects and generative music.
- `game/src/input.js` — keyboard and mouse state.
- `game/src/random.js` — the seeded RNG that makes runs reproducible.
- `game/src/config.js` — tuning, palette and arena geometry.
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=…`).
- `main.ts` — the entry program that hands the game in (copies `game/`
  and `screenshots/` out and writes the dossier).
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

MIT licensed — see `LICENSE`.
