// All sound is synthesised with WebAudio: no audio files, nothing to load.
// Short shaped oscillator/noise blips for effects, and a slow generative
// music loop (soft pad chords with pentatonic plucks) under the game.
// Audio starts lazily on the first user gesture, as browsers require.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = 0;
    this.chordIndex = 0;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  // One enveloped tone. type/freq/dur/vol are plain numbers, slideTo bends.
  blip({ type = 'square', freq = 440, dur = 0.1, vol = 0.2, slideTo = null, delay = 0 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise({ dur = 0.15, vol = 0.2, delay = 0, low = 400, high = 2400 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(high, t0);
    filter.frequency.exponentialRampToValueAtTime(low, t0 + dur);
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
  }

  shoot() { this.blip({ type: 'square', freq: 720, slideTo: 240, dur: 0.07, vol: 0.08 }); }
  enemyHit() { this.noise({ dur: 0.05, vol: 0.10, high: 3000, low: 900 }); }
  enemyDie() { this.blip({ type: 'triangle', freq: 320, slideTo: 60, dur: 0.22, vol: 0.16 }); this.noise({ dur: 0.18, vol: 0.12 }); }
  playerHurt() { this.blip({ type: 'sawtooth', freq: 200, slideTo: 70, dur: 0.28, vol: 0.22 }); }
  dash() { this.noise({ dur: 0.14, vol: 0.10, high: 500, low: 2600 }); }
  pickup() { this.blip({ type: 'sine', freq: 880, slideTo: 1320, dur: 0.09, vol: 0.12 }); }
  heart() { this.blip({ type: 'sine', freq: 660, dur: 0.1, vol: 0.14 }); this.blip({ type: 'sine', freq: 990, dur: 0.14, vol: 0.14, delay: 0.08 }); }
  upgrade() { [523, 659, 784, 1047].forEach((f, i) => this.blip({ type: 'triangle', freq: f, dur: 0.16, vol: 0.14, delay: i * 0.07 })); }
  waveStart() { this.blip({ type: 'triangle', freq: 392, dur: 0.14, vol: 0.16 }); this.blip({ type: 'triangle', freq: 587, dur: 0.2, vol: 0.16, delay: 0.1 }); }
  bossRoar() { this.blip({ type: 'sawtooth', freq: 90, slideTo: 45, dur: 0.9, vol: 0.3 }); this.noise({ dur: 0.8, vol: 0.16, high: 300, low: 90 }); }
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.blip({ type: 'triangle', freq: f, dur: 0.3, vol: 0.15, delay: i * 0.11 })); }
  lose() { [392, 330, 262, 196].forEach((f, i) => this.blip({ type: 'triangle', freq: f, dur: 0.3, vol: 0.15, delay: i * 0.13 })); }

  // Generative music: a four-chord pad in A minor with sparse plucked notes
  // from the A minor pentatonic scale. Called every frame; self-schedules.
  updateMusic(dt, rng) {
    if (!this.ctx || this.muted) return;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    this.musicTimer = 2.4;
    const chords = [
      [110.0, 164.81, 261.63], // Am
      [87.31, 174.61, 220.0], // F
      [98.0, 196.0, 246.94], // G
      [82.41, 164.81, 207.65], // Em
    ];
    const chord = chords[this.chordIndex % chords.length];
    this.chordIndex++;
    for (const freq of chord) {
      this.blip({ type: 'sine', freq, dur: 2.6, vol: 0.045 });
    }
    const scale = [440, 523.25, 587.33, 659.25, 783.99, 880];
    const notes = rng.int(1, 3);
    for (let i = 0; i < notes; i++) {
      this.blip({ type: 'triangle', freq: rng.pick(scale), dur: 0.5, vol: 0.05, delay: rng.range(0.2, 2.0) });
    }
  }
}
