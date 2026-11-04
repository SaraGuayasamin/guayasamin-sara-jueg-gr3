// Música y efectos generados con Web Audio: el juego no descarga ningún archivo de sonido.
class PulsoAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.timer = null;
    this.song = null;
  }

  // Los navegadores solo permiten crear el audio tras un gesto del usuario.
  unlock() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!this.ctx) {
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.3;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  pause() { if (this.ctx) this.ctx.suspend(); }
  resume() { if (this.ctx) this.ctx.resume(); }

  tone(type, freq, time, dur, vol, slideTo) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, time);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, time + dur);
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    o.connect(g).connect(this.songBus || this.master);
    o.start(time);
    o.stop(time + dur + 0.02);
  }

  hit(time, dur, vol, cutoff) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = cutoff;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    s.connect(f).connect(g).connect(this.songBus || this.master);
    s.start(time);
    s.stop(time + dur + 0.02);
  }

  play(music, offset = 0) {
    if (!this.ctx) return;
    this.stop();
    this.songBus = this.ctx.createGain();
    this.songBus.connect(this.master);
    const sixteenth = PulsoSim.BEAT / 4;
    this.song = {
      music,
      sixteenth,
      start: this.ctx.currentTime + 0.03 - offset,
      next: Math.ceil(offset / sixteenth),
    };
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.song = null;
    if (this.songBus) {
      const bus = this.songBus;
      bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
      setTimeout(() => bus.disconnect(), 300);
      this.songBus = null;
    }
  }

  schedule() {
    const s = this.song;
    if (!s || this.ctx.state !== 'running') return;
    while (s.start + s.next * s.sixteenth < this.ctx.currentTime + 0.12) {
      this.playStep(s.next, s.start + s.next * s.sixteenth, s);
      s.next++;
    }
  }

  playStep(i, t, s) {
    const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
    const bar = Math.floor(i / 16);
    const pos = i % 16;
    const root = s.music.root + s.music.prog[bar % s.music.prog.length];
    const third = s.music.prog[bar % s.music.prog.length] === 0 || s.music.prog[bar % s.music.prog.length] === 3 ? 3 : 4;

    if (pos % 4 === 0) this.tone('sine', 140, t, 0.16, 0.9, 42);
    if (pos % 4 === 2) this.hit(t, 0.05, 0.22, 7000);
    if (bar >= 4 && pos % 8 === 4) this.hit(t, 0.14, 0.32, 1800);
    if (bar >= 8 && pos % 2 === 1) this.hit(t, 0.025, 0.09, 9000);

    if ([0, 3, 6, 8, 11, 14].includes(pos)) this.tone('sawtooth', midi(root), t, 0.16, 0.2);

    if (bar >= 2) {
      const arp = [0, third, 7, 12, 7, third, 12, 7];
      const note = root + 24 + arp[(pos + (bar >= 12 ? bar : 0)) % arp.length];
      if (pos % 2 === 0 || bar >= 8) this.tone('square', midi(note), t, 0.09, 0.055);
    }
    if (bar >= 16 && pos % 16 === 0) this.tone('triangle', midi(root + 36 + third), t, 0.8, 0.09);
  }

  sfx(name) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const bus = this.songBus;
    this.songBus = null;
    if (name === 'die') {
      this.hit(t, 0.28, 0.7, 300);
      this.tone('sawtooth', 300, t, 0.3, 0.3, 40);
    } else if (name === 'jump') {
      this.tone('square', 330, t, 0.07, 0.035, 620);
    } else if (name === 'orb') {
      this.tone('sine', 660, t, 0.14, 0.22, 1320);
    } else if (name === 'pad') {
      this.tone('triangle', 220, t, 0.2, 0.3, 880);
    } else if (name === 'portal') {
      this.tone('sine', 440, t, 0.3, 0.18, 110);
    } else if (name === 'coin') {
      this.tone('square', 988, t, 0.08, 0.1);
      this.tone('square', 1319, t + 0.08, 0.22, 0.1);
    } else if (name === 'win') {
      [0, 4, 7, 12, 16].forEach((n, i) => this.tone('square', 523.25 * Math.pow(2, n / 12), t + i * 0.1, 0.3, 0.12));
    } else if (name === 'ui') {
      this.tone('sine', 880, t, 0.06, 0.12);
    }
    this.songBus = bus;
  }
}
