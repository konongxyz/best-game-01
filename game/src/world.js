// The run itself: wave tables, spawning, and the flow from one wave to the
// next — announce, spawn, fight, draft a boon, on to the harder dark.
// main.js owns the top-level modes; this file owns everything inside a run.

import { ARENA, BEST_KEY, FINAL_WAVE } from './config.js';
import { makePlayer, spawnEnemy } from './entities.js';
import { drawDraft } from './upgrades.js';

// Each wave is a list of [kind, count] groups, sent in a shuffled stream.
export const WAVE_TABLE = [
  null,
  [['moth', 6]],
  [['moth', 9], ['dart', 2]],
  [['moth', 10], ['dart', 4]],
  [['moth', 10], ['spitter', 3]],
  [['moth', 8], ['dart', 5], ['splitter', 4]],
  [['moth', 12], ['spitter', 3], ['brute', 2]],
  [['moth', 10], ['dart', 10], ['splitter', 5]],
  [['dart', 6], ['spitter', 5], ['brute', 3]],
  [['moth', 12], ['dart', 8], ['splitter', 6], ['brute', 3]],
  [['king', 1], ['moth', 6]],
];

export function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function startRun(state) {
  state.player = makePlayer();
  state.enemies = [];
  state.bolts = [];
  state.orbs = [];
  state.pickups = [];
  state.score = 0;
  state.kills = 0;
  state.embersCollected = 0;
  state.runTime = 0;
  state.newBest = false;
  state.boss = null;
  state.effects.particles = [];
  state.effects.texts = [];
  startWave(state, 1);
}

export function startWave(state, n) {
  state.wave = n;
  state.mode = 'playing';
  state.waveState = 'announce';
  state.announceTimer = 1.7;
  state.spawnQueue = [];
  for (const [kind, count] of WAVE_TABLE[n]) {
    for (let i = 0; i < count; i++) state.spawnQueue.push(kind);
  }
  // Shuffle so groups interleave instead of arriving in blocks.
  for (let i = state.spawnQueue.length - 1; i > 0; i--) {
    const j = state.rng.int(0, i);
    [state.spawnQueue[i], state.spawnQueue[j]] = [state.spawnQueue[j], state.spawnQueue[i]];
  }
  state.spawnTimer = 0.6;
  state.spawnInterval = Math.max(0.45, 1.15 - n * 0.07);
  state.sound.waveStart();
}

export function updateWorld(state, dt) {
  if (state.waveState === 'announce') {
    state.announceTimer -= dt;
    if (state.announceTimer <= 0) state.waveState = 'fighting';
    return;
  }
  if (state.spawnQueue.length > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      state.spawnTimer = state.spawnInterval;
      spawnNext(state);
    }
  }
  // Track the boss for the HUD health bar.
  state.boss = state.enemies.find((e) => e.kind === 'king' && e.hp > 0) ?? null;

  const fighting = state.spawnQueue.length === 0 && state.enemies.length === 0;
  if (fighting && state.mode === 'playing') {
    if (state.wave >= FINAL_WAVE) {
      winRun(state);
    } else {
      state.draft = drawDraft(state.rng);
      state.mode = 'draft';
      state.sound.upgrade();
    }
  }
}

function spawnNext(state) {
  const kind = state.spawnQueue.shift();
  // Creatures slip in from the ring of stones, never on top of the keeper.
  let x = 0;
  let y = 0;
  for (let tries = 0; tries < 12; tries++) {
    const a = state.rng.angle();
    const r = ARENA.r - 14;
    x = ARENA.x + Math.cos(a) * r;
    y = ARENA.y + Math.sin(a) * r;
    const dx = x - state.player.x;
    const dy = y - state.player.y;
    if (dx * dx + dy * dy > 190 * 190) break;
  }
  const e = spawnEnemy(state, kind, x, y);
  if (kind === 'king') {
    state.boss = e;
    state.sound.bossRoar();
    state.effects.floatText(ARENA.x, ARENA.y - 130, 'THE HOLLOW KING', '#ffd23e', 26);
    state.effects.addShake(6);
  }
}

export function chooseUpgrade(state, index) {
  const card = state.draft[index];
  if (!card) return;
  card.apply(state.player);
  state.effects.floatText(state.player.x, state.player.y - 34, card.name, '#ffcf6e', 17);
  state.sound.upgrade();
  startWave(state, state.wave + 1);
}

function winRun(state) {
  state.mode = 'win';
  state.score += 500; // the grove relit: a flat dawn bonus
  state.sound.win();
  state.effects.ring(state.player.x, state.player.y, '#ffcf6e', 260);
  state.effects.burst(state.player.x, state.player.y, '#ffcf6e', 60, 300, 1.1, 3);
  if (state.score > state.best) {
    state.best = state.score;
    state.newBest = true;
    try { localStorage.setItem(BEST_KEY, String(state.best)); } catch { /* private mode */ }
  }
}
