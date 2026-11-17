// Everything the player sees. render.js draws the grove, the creatures, the
// HUD and every screen (title, draft, pause, over, win) from the state the
// other files maintain. It never changes the state it draws.

import { ARENA, PALETTE, VIEW_H, VIEW_W } from './config.js';
import { Random } from './random.js';

// Fixed decoration, generated once from its own seed so every frame and
// every screenshot shows the same grove.
const decorRng = new Random(1234);
const STARS = Array.from({ length: 110 }, () => ({
  x: decorRng.range(0, VIEW_W), y: decorRng.range(0, VIEW_H), r: decorRng.range(0.6, 1.8), tw: decorRng.range(0, 6),
}));
const FLOOR_SPOTS = Array.from({ length: 130 }, () => {
  const a = decorRng.angle();
  const r = Math.sqrt(decorRng.next()) * (ARENA.r - 18);
  return { x: ARENA.x + Math.cos(a) * r, y: ARENA.y + Math.sin(a) * r, r: decorRng.range(2, 7) };
});
const TREES = Array.from({ length: 26 }, (_, i) => {
  const a = (i / 26) * Math.PI * 2 + decorRng.range(-0.08, 0.08);
  const r = ARENA.r + decorRng.range(38, 92);
  return { x: ARENA.x + Math.cos(a) * r, y: ARENA.y + Math.sin(a) * r, s: decorRng.range(0.8, 1.5) };
});

// The draft cards' rectangles live here so main.js hit-tests the same boxes
// render.js paints.
export const DRAFT_CARDS = [0, 1, 2].map((i) => ({
  x: VIEW_W / 2 + (i - 1) * 330 - 145,
  y: 218,
  w: 290,
  h: 330,
}));

export function drawGame(ctx, state, input) {
  const shake = state.effects.shakeOffset(decorRng);
  ctx.save();
  ctx.translate(shake.x, shake.y);
  drawBackground(ctx, state);
  drawArena(ctx);
  for (const pk of state.pickups) drawPickup(ctx, pk, state.time);
  for (const e of state.enemies) drawEnemy(ctx, e, state.time);
  if (state.mode !== 'over') drawKeeper(ctx, state);
  for (const b of state.bolts) drawBolt(ctx, b);
  for (const o of state.orbs) drawOrb(ctx, o, state.time);
  state.effects.draw(ctx);
  drawLighting(ctx, state);
  ctx.restore();

  drawHud(ctx, state);
  if (state.waveState === 'announce' && state.mode === 'playing') drawWaveBanner(ctx, state);
  if (state.boss && state.mode === 'playing') drawBossBar(ctx, state);
  if (state.mode === 'title') drawTitle(ctx, state);
  if (state.mode === 'draft') drawDraftScreen(ctx, state, input);
  if (state.mode === 'paused') drawPause(ctx);
  if (state.mode === 'over') drawEndScreen(ctx, state, false);
  if (state.mode === 'win') drawEndScreen(ctx, state, true);
}

function drawBackground(ctx, state) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, PALETTE.nightTop);
  g.addColorStop(1, PALETTE.nightBottom);
  ctx.fillStyle = g;
  ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  ctx.fillStyle = '#ffffff';
  for (const s of STARS) {
    ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(state.time * 1.4 + s.tw));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // The dark woods pressing in around the clearing.
  for (const t of TREES) drawTree(ctx, t);
}

function drawTree(ctx, t) {
  ctx.fillStyle = '#0d1526';
  ctx.beginPath();
  ctx.moveTo(t.x, t.y - 46 * t.s);
  ctx.lineTo(t.x - 22 * t.s, t.y + 18 * t.s);
  ctx.lineTo(t.x + 22 * t.s, t.y + 18 * t.s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#131f38';
  ctx.beginPath();
  ctx.moveTo(t.x, t.y - 30 * t.s);
  ctx.lineTo(t.x - 16 * t.s, t.y + 16 * t.s);
  ctx.lineTo(t.x + 16 * t.s, t.y + 16 * t.s);
  ctx.closePath();
  ctx.fill();
}

function drawArena(ctx) {
  const floor = ctx.createRadialGradient(ARENA.x, ARENA.y, 40, ARENA.x, ARENA.y, ARENA.r);
  floor.addColorStop(0, '#274434');
  floor.addColorStop(0.75, PALETTE.groveFloor);
  floor.addColorStop(1, '#16241f');
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.arc(ARENA.x, ARENA.y, ARENA.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  for (const s of FLOOR_SPOTS) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // The ring of standing stones that bounds the grove.
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const x = ARENA.x + Math.cos(a) * ARENA.r;
    const y = ARENA.y + Math.sin(a) * ARENA.r;
    ctx.fillStyle = i % 2 ? PALETTE.ringStone : PALETTE.ringStoneDark;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255, 207, 110, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ARENA.x, ARENA.y, ARENA.r - 12, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPickup(ctx, pk, time) {
  const bob = Math.sin(time * 4 + pk.t * 3) * 3;
  if (pk.kind === 'ember') {
    ctx.fillStyle = PALETTE.ember;
    ctx.shadowColor = PALETTE.ember;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y + bob, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    drawHeart(ctx, pk.x, pk.y + bob, 9, PALETTE.heart);
  }
}

function drawHeart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.85);
  ctx.bezierCurveTo(x - s * 1.25, y - s * 0.1, x - s * 0.62, y - s * 1.05, x, y - s * 0.38);
  ctx.bezierCurveTo(x + s * 0.62, y - s * 1.05, x + s * 1.25, y - s * 0.1, x, y + s * 0.85);
  ctx.fill();
}

function drawKeeper(ctx, state) {
  const p = state.player;
  if (p.invulnTimer > 0 && Math.floor(state.time * 16) % 2 === 0) ctx.globalAlpha = 0.45;
  const bob = Math.sin(p.walkCycle) * 1.6;
  // Cloak: a warm rust-red robe.
  ctx.fillStyle = '#c4502e';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 15 + bob);
  ctx.quadraticCurveTo(p.x + 14, p.y + 8 + bob, p.x + 10, p.y + 16);
  ctx.lineTo(p.x - 10, p.y + 16);
  ctx.quadraticCurveTo(p.x - 14, p.y + 8 + bob, p.x, p.y - 15 + bob);
  ctx.fill();
  // Head and hood.
  ctx.fillStyle = '#f2c894';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 12 + bob, 6.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a03d22';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 14 + bob, 7.6, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();
  // The lantern, held toward the aim.
  const lx = p.x + Math.cos(p.aimAngle) * 19;
  const ly = p.y + Math.sin(p.aimAngle) * 19 + bob * 0.4;
  ctx.strokeStyle = '#7a4a21';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 2);
  ctx.lineTo(lx, ly);
  ctx.stroke();
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.shadowColor = PALETTE.lanternAmber;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(lx, ly, 5.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawEnemy(ctx, e, time) {
  if (e.spawnIn > 0) {
    // A swirl of dark at the ring: the creature is still arriving.
    const a = 1 - e.spawnIn / 0.7;
    ctx.globalAlpha = 0.25 + a * 0.5;
    ctx.strokeStyle = PALETTE.mothWing;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius + 8 * (1 - a), time * 5, time * 5 + Math.PI * 1.4);
    ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }
  ctx.save();
  if (e.flash > 0) ctx.filter = 'brightness(2.6)';
  const flap = Math.sin(time * 14 + e.t * 7) * 0.35;
  switch (e.kind) {
    case 'moth':
    case 'dart':
    case 'mite': {
      const wing = e.kind === 'moth' ? PALETTE.mothWing : e.kind === 'dart' ? PALETTE.dartWing : PALETTE.miteBody;
      ctx.fillStyle = wing;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(e.x + side * e.radius * 0.85, e.y - 2, e.radius * (0.72 + flap * 0.3), e.radius * 0.42, side * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = PALETTE.shadow;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * 0.62, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, e, 0.34, '#ffd23e');
      break;
    }
    case 'spitter': {
      ctx.fillStyle = '#17352f';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.spitterGlow;
      ctx.shadowColor = PALETTE.spitterGlow;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * (0.4 + 0.08 * Math.sin(time * 5 + e.t)), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
    case 'splitter': {
      ctx.fillStyle = '#3c2d63';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.miteBody;
      for (const [ox, oy] of [[-7, -3], [7, 4]]) {
        ctx.beginPath();
        ctx.arc(e.x + ox, e.y + oy, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      drawEyes(ctx, e, 0.3, '#ffd23e');
      break;
    }
    case 'brute':
    case 'king': {
      const isKing = e.kind === 'king';
      ctx.fillStyle = PALETTE.bruteHide;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#493a75';
      ctx.beginPath();
      ctx.arc(e.x, e.y + e.radius * 0.25, e.radius * 0.72, 0, Math.PI * 2);
      ctx.fill();
      // Horns.
      ctx.strokeStyle = '#d8cf9f';
      ctx.lineWidth = isKing ? 6 : 4;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(e.x + side * e.radius * 0.95, e.y - e.radius * 0.55, e.radius * 0.34, side > 0 ? Math.PI * 1.1 : Math.PI * 0.4, side > 0 ? Math.PI * 1.7 : Math.PI * 1.0, side < 0);
        ctx.stroke();
      }
      if (isKing) {
        // The Hollow Crown.
        ctx.fillStyle = PALETTE.bossCrown;
        const cy = e.y - e.radius - 6 + Math.sin(time * 2.4) * 2;
        ctx.beginPath();
        ctx.moveTo(e.x - 17, cy + 10);
        ctx.lineTo(e.x - 17, cy - 6);
        ctx.lineTo(e.x - 8, cy + 3);
        ctx.lineTo(e.x, cy - 10);
        ctx.lineTo(e.x + 8, cy + 3);
        ctx.lineTo(e.x + 17, cy - 6);
        ctx.lineTo(e.x + 17, cy + 10);
        ctx.closePath();
        ctx.fill();
        if (e.chargeState === 'warn') {
          ctx.strokeStyle = PALETTE.danger;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius + 10 + Math.sin(time * 22) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      drawEyes(ctx, e, 0.36, '#ff5470');
      break;
    }
  }
  ctx.restore();
  // A thin wound bar over the tougher creatures.
  if (e.maxHp >= 4 && e.hp < e.maxHp && e.kind !== 'king') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(e.x - e.radius, e.y - e.radius - 12, e.radius * 2, 5);
    ctx.fillStyle = '#ff8fa3';
    ctx.fillRect(e.x - e.radius, e.y - e.radius - 12, e.radius * 2 * (e.hp / e.maxHp), 5);
  }
}

function drawEyes(ctx, e, spread, color) {
  ctx.fillStyle = color;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(e.x + side * e.radius * spread, e.y - e.radius * 0.08, Math.max(2, e.radius * 0.13), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBolt(ctx, b) {
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.shadowColor = PALETTE.lanternAmber;
  ctx.shadowBlur = 9;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawOrb(ctx, o, time) {
  ctx.fillStyle = '#241b3d';
  ctx.strokeStyle = PALETTE.mothWing;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(o.x, o.y, 6.5 + Math.sin(time * 9 + o.x) * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawLighting(ctx, state) {
  const p = state.player;
  const glow = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 210);
  glow.addColorStop(0, 'rgba(255, 179, 71, 0.13)');
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const dark = ctx.createRadialGradient(ARENA.x, ARENA.y, ARENA.r * 0.55, ARENA.x, ARENA.y, ARENA.r * 1.75);
  dark.addColorStop(0, 'rgba(3, 5, 14, 0)');
  dark.addColorStop(1, 'rgba(3, 5, 14, 0.62)');
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawHud(ctx, state) {
  const p = state.player;
  // Hearts, top left.
  for (let i = 0; i < p.maxHearts; i++) {
    drawHeart(ctx, 36 + i * 30, 34, 10, i < p.hearts ? PALETTE.heart : 'rgba(255,107,129,0.22)');
  }
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(`Wave ${Math.max(1, state.wave)} of 10`, 24, 66);
  // Dash pip.
  ctx.fillStyle = p.dashTimer <= 0 ? PALETTE.spitterGlow : 'rgba(110,231,200,0.25)';
  ctx.fillText(p.dashTimer <= 0 ? 'Dash ready (Shift)' : 'Dash …', 24, 88);

  // Score, top right.
  ctx.textAlign = 'right';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillStyle = PALETTE.textCream;
  ctx.fillText(String(state.score), VIEW_W - 24, 40);
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.ember;
  ctx.fillText(`✦ ${state.embersCollected} embers`, VIEW_W - 24, 64);
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(`Best ${Math.max(state.best, state.score)}`, VIEW_W - 24, 86);

  ctx.textAlign = 'center';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(245,234,210,0.5)';
  ctx.fillText('Move WASD · Aim mouse · Hold click to fire · Shift dash · P pause · M mute', VIEW_W / 2, VIEW_H - 12);
}

function drawWaveBanner(ctx, state) {
  const t = 1 - Math.abs(state.announceTimer - 0.85) / 0.85;
  ctx.globalAlpha = Math.max(0, Math.min(1, t * 1.6));
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillStyle = PALETTE.textCream;
  const label = state.wave === 10 ? 'WAVE 10 — THE HOLLOW KING' : `WAVE ${state.wave}`;
  ctx.fillText(label, VIEW_W / 2, 150);
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(state.wave === 1 ? 'The dark comes for the grove. Keep the light alive.' : 'The dark presses closer…', VIEW_W / 2, 180);
  ctx.globalAlpha = 1;
}

function drawBossBar(ctx, state) {
  const boss = state.boss;
  const w = 460;
  const frac = Math.max(0, boss.hp / boss.maxHp);
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillStyle = PALETTE.bossCrown;
  ctx.fillText('THE HOLLOW KING', VIEW_W / 2, 30);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(VIEW_W / 2 - w / 2, 38, w, 12);
  ctx.fillStyle = '#8f2d4a';
  ctx.fillRect(VIEW_W / 2 - w / 2, 38, w * frac, 12);
  ctx.strokeStyle = PALETTE.bossCrown;
  ctx.lineWidth = 1;
  ctx.strokeRect(VIEW_W / 2 - w / 2, 38, w, 12);
}

function dimScreen(ctx, alpha = 0.62) {
  ctx.fillStyle = `rgba(5, 7, 18, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawTitle(ctx, state) {
  dimScreen(ctx, 0.45);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.lanternAmber;
  ctx.font = 'bold 84px Georgia, serif';
  ctx.shadowColor = PALETTE.lanternAmber;
  ctx.shadowBlur = 26;
  ctx.fillText('EMBERFALL', VIEW_W / 2, 218);
  ctx.shadowBlur = 0;
  ctx.font = 'italic 21px Georgia, serif';
  ctx.fillStyle = PALETTE.textCream;
  ctx.fillText('One lantern. Ten waves of dark. Keep the grove lit until dawn.', VIEW_W / 2, 258);
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText('WASD or arrows to move · mouse to aim · hold click to fire ember bolts', VIEW_W / 2, 428);
  ctx.fillText('Shift to dash through danger · gather embers · choose a boon after each wave', VIEW_W / 2, 454);
  ctx.fillText('Survive the Hollow King on wave 10 and the dawn is yours.', VIEW_W / 2, 480);
  ctx.font = 'bold 23px Georgia, serif';
  ctx.fillStyle = 0.5 + 0.5 * Math.sin(state.time * 3) > 0.4 ? PALETTE.ember : PALETTE.textCream;
  ctx.fillText('— Click or press Enter to light the lantern —', VIEW_W / 2, 548);
  if (state.best > 0) {
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(`Best score so far: ${state.best}`, VIEW_W / 2, 586);
  }
}

function drawDraftScreen(ctx, state, input) {
  dimScreen(ctx, 0.66);
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.fillStyle = PALETTE.textCream;
  ctx.fillText(`Wave ${state.wave} held. The grove offers a boon.`, VIEW_W / 2, 130);
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText('Choose one — click a card or press 1, 2 or 3. Your keeper keeps it for the whole run.', VIEW_W / 2, 162);
  state.draft.forEach((card, i) => {
    const r = DRAFT_CARDS[i];
    const hover = input && input.mouse.x >= r.x && input.mouse.x <= r.x + r.w && input.mouse.y >= r.y && input.mouse.y <= r.y + r.h;
    ctx.fillStyle = hover ? '#2a3352' : '#1d2440';
    ctx.strokeStyle = hover ? PALETTE.ember : PALETTE.ringStone;
    ctx.lineWidth = hover ? 3 : 2;
    roundRect(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.ember;
    ctx.font = '52px Georgia, serif';
    ctx.fillText(card.icon, r.x + r.w / 2, r.y + 92);
    ctx.fillStyle = PALETTE.textCream;
    ctx.font = 'bold 24px Georgia, serif';
    wrapText(ctx, card.name, r.x + r.w / 2, r.y + 150, r.w - 36, 28);
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '16px system-ui, sans-serif';
    wrapText(ctx, card.blurb, r.x + r.w / 2, r.y + 208, r.w - 44, 22);
    ctx.fillStyle = PALETTE.ringStone;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(`[ ${i + 1} ]`, r.x + r.w / 2, r.y + r.h - 24);
  });
}

function drawPause(ctx) {
  dimScreen(ctx, 0.55);
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillStyle = PALETTE.textCream;
  ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2 - 10);
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText('Press P to return to the grove', VIEW_W / 2, VIEW_H / 2 + 28);
}

function drawEndScreen(ctx, state, won) {
  dimScreen(ctx, 0.68);
  ctx.textAlign = 'center';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillStyle = won ? PALETTE.ember : PALETTE.danger;
  ctx.fillText(won ? 'DAWN BREAKS' : 'THE LIGHT GOES OUT', VIEW_W / 2, 190);
  ctx.font = 'italic 19px Georgia, serif';
  ctx.fillStyle = PALETTE.textCream;
  ctx.fillText(
    won ? 'The Hollow King is ash, the grove glows, and Wren walks home in the light.' : 'The lantern gutters and fails. The grove will wait for another keeper.',
    VIEW_W / 2, 228,
  );
  const rows = [
    ['Final score', state.score],
    ['Wave reached', `${state.wave} of 10`],
    ['Creatures banished', state.kills],
    ['Embers gathered', state.embersCollected],
    ['Time in the dark', `${Math.floor(state.runTime / 60)}:${String(Math.floor(state.runTime % 60)).padStart(2, '0')}`],
  ];
  ctx.font = '19px system-ui, sans-serif';
  rows.forEach(([label, value], i) => {
    const y = 292 + i * 34;
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(label, VIEW_W / 2 - 16, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.textCream;
    ctx.fillText(String(value), VIEW_W / 2 + 16, y);
  });
  ctx.textAlign = 'center';
  if (state.newBest) {
    ctx.font = 'bold 19px Georgia, serif';
    ctx.fillStyle = PALETTE.bossCrown;
    ctx.fillText('★ A new best score ★', VIEW_W / 2, 292 + rows.length * 34 + 6);
  }
  ctx.font = 'bold 21px Georgia, serif';
  ctx.fillStyle = PALETTE.textCream;
  ctx.fillText('Press R or click to play again', VIEW_W / 2, 292 + rows.length * 34 + 48);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      ctx.fillText(line, cx, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = trial;
    }
  }
  if (line) ctx.fillText(line, cx, yy);
}
