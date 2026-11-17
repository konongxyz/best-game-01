// Deterministic screenshot scenes.
// The game reads ?shot=<scene>&seed=<n> and builds one fixed moment of play
// with the run's seeded RNG — no wall clock, no live input — renders it once
// and sets window.__shotReady. The maker's renderer (shots.json) photographs
// title, mid-game action, the boon draft and the victory screen this way, so
// every screenshot is a real render of the game's own code.

import { ARENA } from './config.js';
import { spawnEnemy, updateEnemies, updatePickups, updatePlayer, updateProjectiles } from './entities.js';
import { startRun } from './world.js';
import { UPGRADES } from './upgrades.js';

function scriptedInput(move, mouse) {
  return {
    moveAxis: () => move,
    wasPressed: () => false,
    mouse,
    keys: new Set(),
  };
}

function settleEffects(state, frames) {
  for (let i = 0; i < frames; i++) {
    state.effects.ambient(state.rng, ARENA);
    state.effects.update(1 / 60);
  }
}

function placeBackdropCreatures(state) {
  const spots = [
    ['moth', -190, -120], ['moth', 210, -60], ['moth', 150, 150],
    ['dart', -230, 90], ['moth', 40, -215], ['dart', -90, 205],
  ];
  for (const [kind, dx, dy] of spots) {
    const e = spawnEnemy(state, kind, ARENA.x + dx, ARENA.y + dy);
    e.spawnIn = 0;
  }
}

export function runShotScene(state, scene, seed) {
  state.time = 2.4;
  if (scene === 'title') {
    state.mode = 'title';
    placeBackdropCreatures(state);
    settleEffects(state, 50);
    return scriptedInput({ x: 0, y: 0 }, { x: ARENA.x + 160, y: ARENA.y - 90, down: false });
  }

  startRun(state);
  state.time = 2.4;

  if (scene === 'play') {
    state.wave = 6;
    state.waveState = 'fighting';
    state.spawnQueue = ['moth', 'dart', 'moth'];
    state.score = 1240;
    state.embersCollected = 63;
    state.kills = 41;
    state.runTime = 268;
    state.player.hearts = 4;
    state.player.x = ARENA.x - 120;
    state.player.y = ARENA.y + 105;
    const cast = [
      ['brute', 150, -70], ['spitter', 235, 95], ['splitter', -245, -95],
      ['moth', 60, -190], ['moth', 195, -150], ['dart', -60, 190], ['dart', 120, 205],
    ];
    for (const [kind, dx, dy] of cast) {
      const e = spawnEnemy(state, kind, ARENA.x + dx, ARENA.y + dy);
      e.spawnIn = 0;
    }
    // Two and a half seconds of scripted play: the keeper strafes up-left,
    // firing at the brute, so bolts, bursts and drifting embers are live.
    const input = scriptedInput({ x: -0.55, y: -0.83 }, { x: ARENA.x + 150, y: ARENA.y - 70, down: true });
    for (let i = 0; i < 150; i++) {
      updatePlayer(state, input, 1 / 60);
      updateEnemies(state, 1 / 60);
      updateProjectiles(state, 1 / 60);
      updatePickups(state, 1 / 60);
      state.effects.ambient(state.rng, ARENA);
      state.effects.update(1 / 60);
      state.time += 1 / 60;
    }
    state.player.hearts = 4;
    state.player.invulnTimer = 0;
    return input;
  }

  if (scene === 'draft') {
    state.wave = 5;
    state.mode = 'draft';
    state.score = 980;
    state.embersCollected = 47;
    state.kills = 33;
    state.runTime = 231;
    state.draft = ['twin-lanterns', 'kindled-heart', 'swift-hands'].map((id) => UPGRADES.find((u) => u.id === id));
    placeBackdropCreatures(state);
    state.enemies = [];
    settleEffects(state, 40);
    // The pointer hovers the middle card, as a player deciding would.
    return scriptedInput({ x: 0, y: 0 }, { x: ARENA.x, y: 380, down: false });
  }

  if (scene === 'win') {
    state.wave = 10;
    state.mode = 'win';
    state.score = 8650;
    state.kills = 148;
    state.embersCollected = 212;
    state.runTime = 754;
    state.newBest = true;
    state.best = 8650;
    state.effects.ring(state.player.x, state.player.y, '#ffcf6e', 250);
    state.effects.burst(state.player.x, state.player.y, '#ffcf6e', 46, 280, 1.1, 3);
    settleEffects(state, 30);
    return scriptedInput({ x: 0, y: 0 }, { x: ARENA.x + 120, y: ARENA.y - 60, down: false });
  }

  // 'over': the light has gone out on wave 7.
  state.wave = 7;
  state.mode = 'over';
  state.score = 3120;
  state.kills = 86;
  state.embersCollected = 121;
  state.runTime = 402;
  placeBackdropCreatures(state);
  settleEffects(state, 30);
  return scriptedInput({ x: 0, y: 0 }, { x: ARENA.x, y: ARENA.y, down: false });
}
