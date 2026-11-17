// A small seeded random generator (mulberry32) plus helpers.
// The game never calls Math.random for gameplay: a run is reproducible from
// its seed, which is what makes the screenshot scenes deterministic.

export class Random {
  constructor(seed = 1) {
    this.state = seed >>> 0 || 1;
  }

  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  pick(list) {
    return list[Math.floor(this.next() * list.length) % list.length];
  }

  chance(p) {
    return this.next() < p;
  }

  angle() {
    return this.next() * Math.PI * 2;
  }
}
