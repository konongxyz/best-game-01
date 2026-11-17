// Emberfall — shared tuning, palette and arena geometry.
// Every number the game is balanced by lives here so the other files only
// describe behaviour, never magic constants.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// The grove is a circular clearing; the dark woods close in at this radius.
export const ARENA = { x: VIEW_W / 2, y: VIEW_H / 2 + 8, r: 318 };

export const FINAL_WAVE = 10;

export const PLAYER = {
  radius: 14,
  speed: 238,
  maxHearts: 5,
  heartCap: 8,
  fireInterval: 0.19,
  boltSpeed: 540,
  boltDamage: 1,
  dashTime: 0.16,
  dashCooldown: 2.1,
  dashSpeed: 880,
  hurtInvuln: 0.9,
  magnetRadius: 74,
};

// Colours: a deep night grove lit by warm lantern amber.
export const PALETTE = {
  nightTop: '#0b1026',
  nightBottom: '#131b3a',
  groveFloor: '#1d2b26',
  groveFloorEdge: '#2c463a',
  ringStone: '#3d4a63',
  ringStoneDark: '#2a3448',
  lanternAmber: '#ffb347',
  lanternCore: '#ffe9b0',
  ember: '#ffcf6e',
  heart: '#ff6b81',
  shadow: '#0a0a18',
  mothWing: '#8f7fd4',
  dartWing: '#d47fb8',
  bruteHide: '#5d4a8a',
  spitterGlow: '#6ee7c8',
  miteBody: '#b8a6e8',
  bossCrown: '#ffd23e',
  textCream: '#f5ead2',
  textDim: '#a8a29a',
  danger: '#ff5470',
};

// Wave composition is data, not code: world.js reads these rows to spawn.
// Each row lists enemy kinds and how many of each the wave sends in.
export const ENEMY_KINDS = {
  moth:    { hp: 2,  speed: 92,  radius: 15, score: 20,  embers: 1 },
  dart:    { hp: 1,  speed: 178, radius: 11, score: 30,  embers: 1 },
  mite:    { hp: 1,  speed: 132, radius: 9,  score: 10,  embers: 0 },
  spitter: { hp: 3,  speed: 62,  radius: 16, score: 45,  embers: 2 },
  splitter:{ hp: 4,  speed: 74,  radius: 19, score: 50,  embers: 2 },
  brute:   { hp: 11, speed: 44,  radius: 27, score: 90,  embers: 4 },
  king:    { hp: 240, speed: 52, radius: 46, score: 1500, embers: 40 },
};

export const BEST_KEY = 'emberfall-best-score';
