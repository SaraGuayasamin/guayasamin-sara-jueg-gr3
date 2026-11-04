// Los niveles se describen en casillas (40 px). 4 casillas = 1 pulso de la música.
// El modo espejo reutiliza los mismos patrones para caminar por el techo.
const PulsoLevels = (() => {
  class Builder {
    constructor() {
      this.c = 0; this.m = false;
      this.ents = []; this.gaps = []; this.ceilGaps = [];
      this.sections = []; this.texts = [];
    }
    row(y) { return this.m ? 9 - y : y; }
    adv(n) { this.c += n; return this; }
    spike(dx, y = 0) { this.ents.push({ t: 'spike', x: this.c + dx, y: this.row(y), dir: this.m ? -1 : 1 }); return this; }
    spikes(dx, n, y = 0) { for (let i = 0; i < n; i++) this.spike(dx + i, y); return this; }
    block(dx, y, w, h = 1) { this.ents.push({ t: 'block', x: this.c + dx, y: this.m ? 9 - (y + h - 1) : y, w, h }); return this; }
    pad(dx, y = 0) { this.ents.push({ t: 'pad', x: this.c + dx, y: this.row(y), dir: this.m ? -1 : 1 }); return this; }
    orb(dx, y) { this.ents.push({ t: 'orb', x: this.c + dx, y: this.row(y) }); return this; }
    gorb(dx, y) { this.ents.push({ t: 'gorb', x: this.c + dx, y: this.row(y) }); return this; }
    coin(dx, y) { this.ents.push({ t: 'coin', x: this.c + dx, y: this.row(y) }); return this; }
    portal(dx, kind) { this.ents.push({ t: 'portal', x: this.c + dx, kind }); return this; }
    gap(dx, w) { (this.m ? this.ceilGaps : this.gaps).push({ x: this.c + dx, w }); return this; }
    text(dx, y, str) { this.texts.push({ x: this.c + dx, y, str }); return this; }
    section(color, accent) { this.sections.push({ x: this.c, color, accent }); return this; }
    mirror(v) { this.m = v; return this; }

    // Patrones reutilizables
    one() { return this.spike(0).adv(8); }
    two() { return this.spikes(0, 2).adv(8); }
    three() { return this.spikes(0, 3).adv(10); }
    hop() { return this.block(0, 0, 2).adv(8); }
    pit(w = 3) { return this.gap(0, w).adv(w + 6); }
    stairs(n) {
      for (let i = 0; i < n; i++) this.block(i * 4, 0, 4, i + 1);
      return this.adv(n * 4 + 8);
    }
    bridge() {
      // Plataformas elevadas sobre una alfombra de pinchos
      this.block(0, 0, 3).spikes(3, 3).block(6, 1, 3, 2).spikes(9, 3).block(12, 0, 3);
      return this.adv(22);
    }
    wall() { return this.pad(0).block(6, 0, 2, 4).adv(16); }
    orbRun(n = 2) {
      // Pinchos largos que solo se cruzan tocando esferas en el aire
      const last = 5 + 5 * (n - 1);
      this.spikes(2, last + 3);
      for (let i = 0; i < n; i++) this.orb(5 + i * 5, 2);
      return this.adv(last + 13);
    }
    finish() { this.length = this.c + 16; return this; }
    tunnel(gapRow, gapH = 4) {
      // Columna de nave: suelo y techo dejan un hueco de gapH filas
      if (gapRow > 0) this.block(0, 0, 2, gapRow);
      const top = gapRow + gapH;
      if (top < 10) this.block(0, top, 2, 10 - top);
      return this.adv(10);
    }
    done(meta) {
      return { ...meta, length: this.length, ents: this.ents, gaps: this.gaps, ceilGaps: this.ceilGaps, sections: this.sections, texts: this.texts };
    }
  }

  const primerPulso = () => {
    const b = new Builder();
    b.section(0x141045, 0x22d3ee).text(5, 5, 'ESPACIO, ↑ o clic para saltar').adv(16);
    b.one().one().two().one().two().adv(4);
    b.text(0, 5, 'Mantén pulsado para saltar en cadena').adv(4);
    b.two().two().three();
    b.section(0x0f2a4a, 0x34d399).adv(8);
    b.text(0, 6, 'Puedes pisar los bloques').hop().hop();
    b.spike(0).block(4, 0, 4).coin(5, 3).spikes(8, 2).adv(16);
    b.stairs(3);
    b.bridge();
    b.section(0x3b0f4a, 0xfacc15).adv(8);
    b.text(0, 6, 'Trampolín: te lanza solo').wall();
    b.pit(3).pit(3).one();
    b.pad(0).coin(4, 5).adv(16);
    b.pit(4).two();
    b.section(0x4a0f2a, 0xf472b6).adv(8);
    b.text(2, 6, 'Toca la esfera en el aire').orbRun(1);
    b.three().orbRun(2);
    b.stairs(3);
    b.two().pit(3).three();
    b.coin(4, 3).spikes(4, 3).adv(14).orbRun(2);
    b.adv(4).finish();
    return b.done({
      name: 'Primer Pulso', difficulty: 'Fácil', stars: 1,
      music: { root: 45, prog: [0, -4, 3, -2], minor: true },
    });
  };

  const gravedadCero = () => {
    const b = new Builder();
    b.section(0x0b2545, 0x60a5fa).adv(14);
    b.two().three().hop().stairs(2);
    b.text(0, 6, 'Portal azul: el suelo es el techo').adv(4);
    b.portal(0, 'up').adv(10).mirror(true);
    b.one().two().three();
    b.coin(3, 2).two();
    b.mirror(false).portal(0, 'down').adv(10);
    b.section(0x2a0b45, 0xc084fc).adv(4);
    b.two().bridge().three();
    b.portal(0, 'up').adv(10).mirror(true);
    b.hop().two().pit(3).three().stairs(2);
    b.mirror(false).portal(0, 'down').adv(10);
    b.section(0x45210b, 0xfb923c).adv(4);
    b.text(0, 6, 'Esfera verde: invierte la gravedad').adv(2);
    b.spikes(2, 8);
    b.gorb(5, 2).adv(20).mirror(true);
    b.two().three().coin(4, 2).two();
    b.spikes(2, 8);
    b.gorb(5, 2).adv(20).mirror(false);
    b.one().two();
    b.section(0x0b4538, 0x2dd4bf).orbRun(2);
    b.wall().three();
    b.portal(0, 'up').adv(10).mirror(true);
    b.orbRun(2).coin(4, 3).spikes(4, 3).adv(12).two();
    b.mirror(false).portal(0, 'down').adv(10);
    b.pit(4).three().two();
    b.adv(4).finish();
    return b.done({
      name: 'Gravedad Cero', difficulty: 'Media', stars: 2,
      music: { root: 38, prog: [0, -4, 3, -2], minor: true },
    });
  };

  const tormenta = () => {
    const b = new Builder();
    b.section(0x2a0a0a, 0xf87171).adv(14);
    b.two().three().stairs(2).bridge();
    b.text(0, 6, 'Nave: mantén pulsado para subir').adv(4);
    b.portal(0, 'ship').adv(10);
    b.section(0x0a1a3a, 0x38bdf8);
    for (const r of [3, 3, 4, 3, 2, 3, 4, 3]) b.tunnel(r);
    b.coin(4, 8).adv(8);
    b.portal(0, 'cube').adv(10);
    b.section(0x2a0a3a, 0xe879f9);
    b.two().three().orbRun(2).wall();
    b.text(0, 6, '¡Más rápido!').portal(0, 'fast').adv(14);
    b.two().two().three();
    b.pit(3).three().hop();
    b.portal(0, 'normal').adv(10);
    b.portal(0, 'up').adv(10).mirror(true);
    b.two().three().coin(3, 2).two();
    b.mirror(false).portal(0, 'down').adv(10);
    b.section(0x0a3a2a, 0x4ade80);
    b.portal(0, 'ship').adv(10);
    for (const r of [3, 4, 5, 4, 3, 2, 3, 4, 3]) b.tunnel(r, 4);
    b.coin(4, 2).adv(8);
    b.portal(0, 'cube').adv(10);
    b.section(0x3a2a0a, 0xfde047);
    b.portal(0, 'fast').adv(14);
    b.three().two().bridge().orbRun(2);
    b.portal(0, 'normal').adv(10);
    b.adv(4).finish();
    return b.done({
      name: 'Tormenta', difficulty: 'Difícil', stars: 3,
      music: { root: 40, prog: [0, 3, -2, -4], minor: true },
    });
  };

  return [primerPulso(), gravedadCero(), tormenta()];
})();

if (typeof module !== 'undefined') module.exports = PulsoLevels;
