// Particles and floating texts: the juice layer.
// Sparks, embers drifting up from the grove floor, hit bursts, shockwave
// rings and little rising score labels all live here so entities.js and
// world.js can ask for an effect without knowing how it is drawn.

export class Effects {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.shake = 0;
  }

  burst(x, y, color, count, speed = 160, life = 0.5, size = 3) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        kind: 'spark',
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: life * (0.6 + Math.random() * 0.7),
        maxLife: life,
        color,
        size: size * (0.6 + Math.random() * 0.8),
      });
    }
  }

  ring(x, y, color, maxRadius = 90) {
    this.particles.push({ kind: 'ring', x, y, r: 6, maxRadius, life: 0.35, maxLife: 0.35, color, size: 2 });
  }

  trail(x, y, color) {
    this.particles.push({
      kind: 'spark', x, y,
      vx: (Math.random() - 0.5) * 24, vy: -30 - Math.random() * 30,
      life: 0.4, maxLife: 0.4, color, size: 2.2,
    });
  }

  // Ambient embers that drift upward inside the grove, for atmosphere.
  ambient(rng, arena) {
    if (this.particles.length > 260) return;
    const a = rng.angle();
    const r = Math.sqrt(rng.next()) * arena.r;
    this.particles.push({
      kind: 'ember',
      x: arena.x + Math.cos(a) * r,
      y: arena.y + Math.sin(a) * r,
      vx: rng.range(-8, 8),
      vy: rng.range(-26, -12),
      life: rng.range(1.6, 3.2),
      maxLife: 3.2,
      color: '#ffcf6e',
      size: rng.range(1.2, 2.6),
    });
  }

  floatText(x, y, text, color = '#f5ead2', size = 15) {
    this.texts.push({ x, y, text, color, size, life: 0.9, maxLife: 0.9 });
  }

  addShake(amount) {
    this.shake = Math.min(14, this.shake + amount);
  }

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 34);
    for (const p of this.particles) {
      p.life -= dt;
      if (p.kind === 'ring') {
        p.r += (p.maxRadius - p.r) * Math.min(1, dt * 9);
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - dt * 2.2;
        p.vy *= 1 - dt * 2.2;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const t of this.texts) {
      t.life -= dt;
      t.y -= 34 * dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      const fade = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = p.kind === 'ember' ? fade * 0.7 : fade;
      if (p.kind === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5 * fade + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.kind === 'spark' ? fade : 1), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.font = `bold ${t.size}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  // Current screen-shake offset, decaying; render.js applies it.
  shakeOffset(rng) {
    if (this.shake <= 0.1) return { x: 0, y: 0 };
    return { x: rng.range(-this.shake, this.shake), y: rng.range(-this.shake, this.shake) };
  }
}
