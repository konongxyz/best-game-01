// Emberfall — bootstrap and the top-level state machine.
// Owns the canvas, the fixed-step loop and the modes (title, playing, draft,
// paused, over, win); the run's insides belong to world.js and entities.js,
// and everything visible belongs to render.js.

import { SoundBank } from './audio.js';
import { ARENA } from './config.js';
import { makePlayer, spawnEnemy, updateEnemies, updatePickups, updatePlayer, updateProjectiles } from './entities.js';
import { Effects } from './particles.js';
import { Input } from './input.js';
import { Random } from './random.js';
import { drawGame, DRAFT_CARDS } from './render.js';
import { runShotScene } from './shots.js';
import { chooseUpgrade, loadBest, startRun, updateWorld } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);

const state = {
  mode: 'title',
  time: 0,
  wave: 0,
  waveState: 'fighting',
  announceTimer: 0,
  spawnQueue: [],
  spawnTimer: 0,
  spawnInterval: 1,
  draft: [],
  boss: null,
  score: 0,
  kills: 0,
  embersCollected: 0,
  runTime: 0,
  best: loadBest(),
  newBest: false,
  player: makePlayer(),
  enemies: [],
  bolts: [],
  orbs: [],
  pickups: [],
  rng: new Random((Date.now() % 2147483646) + 1),
  fxRng: new Random(987654321),
  sound: new SoundBank(),
  effects: new Effects(),
};

canvas.addEventListener('pointerdown', () => state.sound.ensure());

// On the title screen a few shadow moths drift behind the lettering.
function driftBackdrop(dt) {
  if (state.enemies.length < 5 && state.rng.chance(dt * 0.7)) {
    const a = state.rng.angle();
    const e = spawnEnemy(state, 'moth', ARENA.x + Math.cos(a) * 250, ARENA.y + Math.sin(a) * 190);
    e.spawnIn = 0;
  }
  for (const e of state.enemies) {
    e.t += dt;
    e.x += Math.cos(e.t * 0.6 + e.hp) * 14 * dt;
    e.y += Math.sin(e.t * 0.45 + e.hp * 2) * 11 * dt;
  }
}

function step(dt) {
  state.time += dt;
  state.sound.updateMusic(dt, state.fxRng);
  if (state.fxRng.chance(dt * 9)) state.effects.ambient(state.fxRng, ARENA);
  state.effects.update(dt);

  if (input.wasPressed('KeyM')) {
    state.sound.ensure();
    state.sound.toggleMute();
  }

  switch (state.mode) {
    case 'title': {
      driftBackdrop(dt);
      if (input.clicked || input.wasPressed('Enter') || input.wasPressed('Space')) {
        state.sound.ensure();
        state.enemies = [];
        startRun(state);
      }
      break;
    }
    case 'playing': {
      state.runTime += dt;
      updatePlayer(state, input, dt);
      updateEnemies(state, dt);
      updateProjectiles(state, dt);
      updatePickups(state, dt);
      updateWorld(state, dt);
      if (state.mode === 'playing' && (input.wasPressed('KeyP') || input.wasPressed('Escape'))) {
        state.mode = 'paused';
      }
      break;
    }
    case 'draft': {
      for (let i = 0; i < 3; i++) {
        if (input.wasPressed(`Digit${i + 1}`)) chooseUpgrade(state, i);
      }
      if (input.clicked && state.mode === 'draft') {
        const i = DRAFT_CARDS.findIndex(
          (r) => input.mouse.x >= r.x && input.mouse.x <= r.x + r.w && input.mouse.y >= r.y && input.mouse.y <= r.y + r.h,
        );
        if (i >= 0) chooseUpgrade(state, i);
      }
      break;
    }
    case 'paused': {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape')) state.mode = 'playing';
      break;
    }
    case 'over':
    case 'win': {
      if (input.wasPressed('KeyR') || input.wasPressed('Enter') || input.clicked) {
        state.sound.ensure();
        startRun(state);
      }
      break;
    }
  }

  // One-frame input pulses are consumed by the step, not the frame, so a
  // hitched frame that runs two steps can never toggle a mode twice.
  input.endFrame();
}

// Screenshot mode: build one deterministic scene, draw it once, and tell
// the maker's renderer the frame is ready. No loop, no live input.
const params = new URLSearchParams(location.search);
if (params.has('shot')) {
  state.rng = new Random(Number(params.get('seed') || 1));
  const shotInput = runShotScene(state, params.get('shot'), Number(params.get('seed') || 1));
  drawGame(ctx, state, shotInput);
  window.__shotReady = true;
} else {
  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;
  const frame = (now) => {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    while (acc >= STEP) {
      step(STEP);
      acc -= STEP;
    }
    drawGame(ctx, state, input);
  };
  requestAnimationFrame(frame);
}
