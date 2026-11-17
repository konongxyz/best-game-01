// The living things of the grove: the lantern-keeper, the shadow creatures,
// their bolts and orbs, and the embers and hearts they drop.
// Update functions move and collide everything; render.js only draws.

import { ARENA, BEST_KEY, ENEMY_KINDS, PLAYER } from './config.js';

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function clampToArena(e, margin = 0) {
  const dx = e.x - ARENA.x;
  const dy = e.y - ARENA.y;
  const d = Math.hypot(dx, dy);
  const max = ARENA.r - margin;
  if (d > max && d > 0) {
    e.x = ARENA.x + (dx / d) * max;
    e.y = ARENA.y + (dy / d) * max;
  }
}

export function makePlayer() {
  return {
    x: ARENA.x,
    y: ARENA.y,
    radius: PLAYER.radius,
    speed: PLAYER.speed,
    maxHearts: PLAYER.maxHearts,
    hearts: PLAYER.maxHearts,
    heartCap: PLAYER.heartCap,
    fireInterval: PLAYER.fireInterval,
    fireTimer: 0,
    boltSpeed: PLAYER.boltSpeed,
    boltDamage: PLAYER.boltDamage,
    boltsPerShot: 1,
    pierce: 0,
    boltRange: 460,
    dashTime: 0,
    dashCooldown: PLAYER.dashCooldown,
    dashTimer: 0,
    dashDir: { x: 1, y: 0 },
    hurtInvuln: PLAYER.hurtInvuln,
    invulnTimer: 0,
    magnetRadius: PLAYER.magnetRadius,
    aimAngle: 0,
    walkCycle: 0,
  };
}

export function updatePlayer(state, input, dt) {
  const p = state.player;
  const axis = input.moveAxis();
  p.aimAngle = Math.atan2(input.mouse.y - p.y, input.mouse.x - p.x);

  p.dashTimer = Math.max(0, p.dashTimer - dt);
  p.invulnTimer = Math.max(0, p.invulnTimer - dt);
  p.fireTimer = Math.max(0, p.fireTimer - dt);

  const wantsDash = input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight') || input.wasPressed('Space');
  if (wantsDash && p.dashTimer <= 0) {
    p.dashTime = PLAYER.dashTime;
    p.dashTimer = p.dashCooldown;
    p.dashDir = axis.x !== 0 || axis.y !== 0 ? { ...axis } : { x: Math.cos(p.aimAngle), y: Math.sin(p.aimAngle) };
    state.sound.dash();
  }

  if (p.dashTime > 0) {
    p.dashTime -= dt;
    p.x += p.dashDir.x * PLAYER.dashSpeed * dt;
    p.y += p.dashDir.y * PLAYER.dashSpeed * dt;
    state.effects.trail(p.x, p.y, '#ffb347');
  } else {
    p.x += axis.x * p.speed * dt;
    p.y += axis.y * p.speed * dt;
    if (axis.x !== 0 || axis.y !== 0) p.walkCycle += dt * 11;
  }
  clampToArena(p, p.radius);

  if (input.mouse.down && p.fireTimer <= 0) {
    fireBolts(state);
    p.fireTimer = p.fireInterval;
  }
}

function fireBolts(state) {
  const p = state.player;
  const n = p.boltsPerShot;
  const spread = 0.09;
  for (let i = 0; i < n; i++) {
    const a = p.aimAngle + (i - (n - 1) / 2) * spread;
    state.bolts.push({
      x: p.x + Math.cos(a) * (p.radius + 6),
      y: p.y + Math.sin(a) * (p.radius + 6),
      vx: Math.cos(a) * p.boltSpeed,
      vy: Math.sin(a) * p.boltSpeed,
      life: p.boltRange / p.boltSpeed,
      damage: p.boltDamage,
      pierceLeft: p.pierce,
    });
  }
  state.sound.shoot();
  state.effects.burst(p.x + Math.cos(p.aimAngle) * 22, p.y + Math.sin(p.aimAngle) * 22, '#ffe9b0', 2, 60, 0.18, 2);
}

export function spawnEnemy(state, kind, x, y) {
  const base = ENEMY_KINDS[kind];
  const e = {
    kind, x, y,
    hp: base.hp, maxHp: base.hp,
    speed: base.speed, radius: base.radius,
    score: base.score, embers: base.embers,
    t: state.rng.range(0, 10),
    spawnIn: 0.7,
    flash: 0,
    lungeTimer: state.rng.range(1.2, 2.4),
    lungeTime: 0,
    shootTimer: state.rng.range(1.4, 2.6),
    burstTimer: 4.2,
    chargeTimer: 6.5,
    chargeState: 'stalk', // king: stalk | warn | charge
    chargeTime: 0,
    summonedAt: { high: false, low: false },
    vx: 0, vy: 0,
  };
  state.enemies.push(e);
  return e;
}

function seek(e, target, speed, dt) {
  const a = Math.atan2(target.y - e.y, target.x - e.x);
  e.x += Math.cos(a) * speed * dt;
  e.y += Math.sin(a) * speed * dt;
  return a;
}

export function updateEnemies(state, dt) {
  const p = state.player;
  for (const e of state.enemies) {
    e.t += dt;
    e.flash = Math.max(0, e.flash - dt);
    if (e.spawnIn > 0) {
      e.spawnIn -= dt;
      continue; // still materialising: harmless and motionless
    }
    switch (e.kind) {
      case 'moth': {
        const wobble = Math.sin(e.t * 3.1) * 26;
        const a = Math.atan2(p.y - e.y, p.x - e.x) + Math.PI / 2;
        seek(e, p, e.speed, dt);
        e.x += Math.cos(a) * wobble * dt;
        e.y += Math.sin(a) * wobble * dt;
        break;
      }
      case 'mite':
        seek(e, p, e.speed, dt);
        break;
      case 'dart': {
        if (e.lungeTime > 0) {
          e.lungeTime -= dt;
          e.x += e.vx * dt;
          e.y += e.vy * dt;
        } else {
          seek(e, p, e.speed * 0.55, dt);
          e.lungeTimer -= dt;
          if (e.lungeTimer <= 0 && distance(e.x, e.y, p.x, p.y) < 300) {
            const a = Math.atan2(p.y - e.y, p.x - e.x);
            e.vx = Math.cos(a) * 430;
            e.vy = Math.sin(a) * 430;
            e.lungeTime = 0.38;
            e.lungeTimer = state.rng.range(1.5, 2.6);
          }
        }
        break;
      }
      case 'spitter': {
        const d = distance(e.x, e.y, p.x, p.y);
        if (d > 285) seek(e, p, e.speed, dt);
        else if (d < 215) seek(e, { x: e.x * 2 - p.x, y: e.y * 2 - p.y }, e.speed, dt);
        e.shootTimer -= dt;
        if (e.shootTimer <= 0 && d < 430) {
          e.shootTimer = 2.4;
          const a = Math.atan2(p.y - e.y, p.x - e.x);
          state.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * 205, vy: Math.sin(a) * 205, life: 2.6 });
          state.sound.blip({ type: 'sine', freq: 340, slideTo: 180, dur: 0.16, vol: 0.07 });
        }
        break;
      }
      case 'splitter':
      case 'brute':
        seek(e, p, e.speed, dt);
        break;
      case 'king':
        updateKing(state, e, dt);
        break;
    }
    clampToArena(e, -10);
    // Contact with the keeper.
    if (p.invulnTimer <= 0 && p.dashTime <= 0 && distance(e.x, e.y, p.x, p.y) < e.radius + p.radius - 2) {
      hurtPlayer(state);
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      const push = e.kind === 'brute' || e.kind === 'king' ? 12 : 46;
      e.x += Math.cos(a) * push;
      e.y += Math.sin(a) * push;
    }
  }
}

// The Hollow King: stalks, breathes radial bursts of shadow, charges across
// the grove, and calls moths to him as his health fails.
function updateKing(state, e, dt) {
  const p = state.player;
  const frac = e.hp / e.maxHp;
  if (!e.summonedAt.high && frac < 0.66) { e.summonedAt.high = true; summonMoths(state, e); }
  if (!e.summonedAt.low && frac < 0.33) { e.summonedAt.low = true; summonMoths(state, e); }
  const speed = e.speed * (frac < 0.25 ? 1.5 : 1);

  if (e.chargeState === 'warn') {
    e.chargeTime -= dt;
    if (e.chargeTime <= 0) {
      e.chargeState = 'charge';
      e.chargeTime = 0.55;
      const a = Math.atan2(p.y - e.y, p.x - e.x);
      e.vx = Math.cos(a) * 460;
      e.vy = Math.sin(a) * 460;
      state.sound.bossRoar();
    }
    return;
  }
  if (e.chargeState === 'charge') {
    e.chargeTime -= dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    state.effects.trail(e.x, e.y, '#5d4a8a');
    if (e.chargeTime <= 0) e.chargeState = 'stalk';
    return;
  }
  seek(e, p, speed, dt);
  e.burstTimer -= dt;
  if (e.burstTimer <= 0) {
    e.burstTimer = frac < 0.5 ? 3.4 : 4.4;
    const n = 14;
    const base = state.rng.angle();
    for (let i = 0; i < n; i++) {
      const a = base + (i / n) * Math.PI * 2;
      state.orbs.push({ x: e.x, y: e.y, vx: Math.cos(a) * 165, vy: Math.sin(a) * 165, life: 3.4 });
    }
    state.effects.ring(e.x, e.y, '#8f7fd4', 120);
    state.sound.blip({ type: 'sawtooth', freq: 130, slideTo: 60, dur: 0.4, vol: 0.16 });
  }
  e.chargeTimer -= dt;
  if (e.chargeTimer <= 0) {
    e.chargeTimer = state.rng.range(5.5, 7.5);
    e.chargeState = 'warn';
    e.chargeTime = 0.65;
  }
}

function summonMoths(state, king) {
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    spawnEnemy(state, 'moth', king.x + Math.cos(a) * 90, king.y + Math.sin(a) * 90);
  }
  state.effects.ring(king.x, king.y, '#ffd23e', 140);
  state.effects.floatText(king.x, king.y - 70, 'The King calls his swarm!', '#ffd23e', 17);
}

export function hurtPlayer(state) {
  const p = state.player;
  p.hearts -= 1;
  p.invulnTimer = p.hurtInvuln;
  state.effects.addShake(7);
  state.effects.burst(p.x, p.y, '#ff6b81', 14, 190, 0.5);
  state.sound.playerHurt();
  if (p.hearts <= 0) {
    state.mode = 'over';
    state.effects.burst(p.x, p.y, '#ffb347', 42, 260, 0.9, 3.5);
    state.effects.ring(p.x, p.y, '#ffb347', 170);
    state.sound.lose();
    if (state.score > state.best) {
      state.best = state.score;
      state.newBest = true;
      try { localStorage.setItem(BEST_KEY, String(state.best)); } catch { /* private mode */ }
    }
  }
}

export function updateProjectiles(state, dt) {
  const p = state.player;
  // Keeper's bolts.
  for (const b of state.bolts) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    for (const e of state.enemies) {
      if (e.spawnIn > 0 || e.hp <= 0) continue;
      if (distance(b.x, b.y, e.x, e.y) < e.radius + 5) {
        damageEnemy(state, e, b.damage, Math.atan2(b.vy, b.vx));
        if (b.pierceLeft > 0) b.pierceLeft -= 1;
        else b.life = 0;
        break;
      }
    }
  }
  state.bolts = state.bolts.filter((b) => b.life > 0);
  // Shadow orbs.
  for (const o of state.orbs) {
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.life -= dt;
    if (p.invulnTimer <= 0 && p.dashTime <= 0 && distance(o.x, o.y, p.x, p.y) < p.radius + 6) {
      o.life = 0;
      hurtPlayer(state);
    }
  }
  state.orbs = state.orbs.filter((o) => o.life > 0);
  state.enemies = state.enemies.filter((e) => e.hp > 0);
}

export function damageEnemy(state, e, amount, angle) {
  e.hp -= amount;
  e.flash = 0.09;
  const kb = e.kind === 'brute' || e.kind === 'king' ? 3 : 13;
  e.x += Math.cos(angle) * kb;
  e.y += Math.sin(angle) * kb;
  state.sound.enemyHit();
  if (e.hp > 0) return;
  state.kills += 1;
  state.score += e.score;
  state.sound.enemyDie();
  state.effects.burst(e.x, e.y, '#8f7fd4', e.kind === 'king' ? 60 : 13, 210, 0.6);
  state.effects.floatText(e.x, e.y - e.radius - 4, `+${e.score}`, '#ffcf6e', 14);
  if (e.kind === 'brute' || e.kind === 'king') state.effects.addShake(e.kind === 'king' ? 12 : 5);
  if (e.kind === 'splitter') {
    for (let i = 0; i < 2; i++) {
      const m = spawnEnemy(state, 'mite', e.x + (i === 0 ? -14 : 14), e.y + (i === 0 ? 8 : -8));
      m.spawnIn = 0.15;
    }
  }
  // Drops: embers scatter, hearts are rare.
  for (let i = 0; i < e.embers; i++) {
    const a = state.rng.angle();
    state.pickups.push({
      kind: 'ember', x: e.x, y: e.y,
      vx: Math.cos(a) * state.rng.range(30, 110), vy: Math.sin(a) * state.rng.range(30, 110),
      t: state.rng.range(0, 6),
    });
  }
  if (state.rng.chance(0.07) && state.player.hearts < state.player.maxHearts) {
    state.pickups.push({ kind: 'heart', x: e.x, y: e.y, vx: 0, vy: -20, t: 0 });
  }
}

export function updatePickups(state, dt) {
  const p = state.player;
  for (const pk of state.pickups) {
    pk.t += dt;
    pk.x += pk.vx * dt;
    pk.y += pk.vy * dt;
    pk.vx *= 1 - dt * 3;
    pk.vy *= 1 - dt * 3;
    clampToArena(pk, 12);
    const d = distance(pk.x, pk.y, p.x, p.y);
    if (pk.kind === 'ember' && d < p.magnetRadius) {
      const a = Math.atan2(p.y - pk.y, p.x - pk.x);
      const pull = 340 * (1 - d / p.magnetRadius) + 60;
      pk.x += Math.cos(a) * pull * dt;
      pk.y += Math.sin(a) * pull * dt;
    }
    pk.collected = d < p.radius + 12;
    if (pk.collected) {
      if (pk.kind === 'ember') {
        state.score += 5;
        state.embersCollected += 1;
        state.sound.pickup();
      } else {
        p.hearts = Math.min(p.maxHearts, p.hearts + 1);
        state.effects.floatText(p.x, p.y - 26, '+1 heart', '#ff6b81', 15);
        state.sound.heart();
      }
    }
  }
  state.pickups = state.pickups.filter((pk) => !pk.collected);
}
