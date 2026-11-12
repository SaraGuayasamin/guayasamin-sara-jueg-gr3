const WIDTH = 800;
const HEIGHT = 600;
const S = PulsoSim;
const LEVELS = PulsoLevels.map((raw) => S.prepare(raw));
const audio = new PulsoAudio();
const FONT = '"Segoe UI", "Trebuchet MS", Verdana, sans-serif';

const DEATH_LINES = [
  [10, '¡Calentando motores!'],
  [30, 'Ese pincho te tenía ganas'],
  [50, 'Vas agarrando el ritmo'],
  [75, '¡Ya pasaste la mitad!'],
  [90, 'Uy... ¡casi casi!'],
  [101, '¡NOOO! ¡Estabas ahí mismo!'],
];

// Guardado local: si el navegador lo bloquea, el juego sigue funcionando sin récords.
const save = {
  key: 'pulso-neon-v1',
  data: { best: {}, coins: {}, muted: false },
  load() {
    try { Object.assign(this.data, JSON.parse(localStorage.getItem(this.key)) || {}); } catch (e) { /* sin guardado */ }
  },
  write() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* sin guardado */ }
  },
};

const P = { H: 0xf472b6, h: 0xbe185d, S: 0xffd7b5, E: 0x1e1b4b, W: 0xffffff, R: 0xfb7185, D: 0x22d3ee, d: 0x0e7490, C: 0x7c3aed, B: 0xfacc15 };
const LUMI_HEAD = [
  '....HHHHHHH.....',
  '..HHHHHHHHHHH...',
  '.HHHHHHHHHHHHH..',
  '.HHHHSSSSSSSHH..',
  'hHHHSSSSSSSSSH..',
  'hHHHSSWESSWESH..',
  'hHHHSSWESSWES...',
  'hhHHSRSSSSSRS...',
  '.hh..SSSSSSS....',
];
const LUMI_FRAMES = {
  'lumi-run1': [...LUMI_HEAD,
    '.hhCDDDDDDD.....',
    '.hCCDDDDDDSS....',
    '..CCDDDDDD......',
    '..CDDDDDDDD.....',
    '...DdDDDdDD.....',
    '...BB....BB.....',
    '..BBB.....BBB...'],
  'lumi-run2': [...LUMI_HEAD,
    '.hhCDDDDDDD.....',
    '.hCCDDDDDDSS....',
    '..CCDDDDDD......',
    '..CDDDDDDDD.....',
    '...DdDDDdDD.....',
    '.....BBBB.......',
    '.....BB.BBB.....'],
  'lumi-jump': [...LUMI_HEAD,
    'hhCCDDDDDDDSS...',
    'hCCCDDDDDD......',
    '.CCDDDDDDDD.....',
    '...DDDDDDDDD....',
    '...BB.....BB....',
    '..BB.......BB...',
    '................'],
  'lumi-shoot': [...LUMI_HEAD,
    '.hhCDDDDDDSSSSW.',
    '.hCCDDDDDDSSSWWW',
    '..CCDDDDDD....W.',
    '..CDDDDDDDD.....',
    '...DdDDDdDD.....',
    '...BB....BB.....',
    '..BBB.....BBB...'],
};

function drawPixels(g, rows, ox, oy, scale) {
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (P[c] !== undefined) g.fillStyle(P[c], 1).fillRect(ox + x * scale, oy + y * scale, scale, scale);
    });
  });
}

const countBits = (n) => { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; };

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    save.load();
    audio.setMuted(save.data.muted);
    this.makeTextures();
    this.scene.start('Menu');
  }

  makeTextures() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const bake = (key, w, h, draw) => { g.clear(); draw(); g.generateTexture(key, w, h); };

    // Lumi, la protagonista: arte de píxeles de 16x16 con cuatro poses
    for (const [key, rows] of Object.entries(LUMI_FRAMES)) {
      bake(key, 48, 48, () => drawPixels(g, rows, 0, 0, 3));
    }
    bake('ship', 60, 44, () => {
      drawPixels(g, LUMI_FRAMES['lumi-jump'].slice(0, 10), 16, 0, 2);
      g.fillStyle(0x22d3ee, 1).fillTriangle(0, 18, 60, 30, 0, 42);
      g.fillStyle(0x10102a, 1).fillTriangle(6, 24, 44, 30, 6, 37);
      g.fillStyle(0xfacc15, 1).fillRect(0, 26, 8, 8);
    });
    bake('enemy', 56, 36, () => {
      g.fillStyle(0xff2d55, 0.2).fillEllipse(28, 18, 56, 34);
      g.fillStyle(0xff2d55, 1).fillTriangle(2, 18, 46, 4, 46, 32);
      g.fillStyle(0x2a0a14, 1).fillTriangle(14, 18, 42, 10, 42, 26);
      g.fillStyle(0xfde047, 1).fillCircle(26, 18, 4);
      g.fillStyle(0xfb923c, 1).fillTriangle(46, 10, 56, 18, 46, 26);
    });
    bake('wall', 40, 40, () => {
      g.fillStyle(0x3a2412, 1).fillRect(0, 0, 40, 40);
      g.lineStyle(2, 0xfb923c, 1).strokeRect(1, 1, 38, 38);
      g.lineStyle(2, 0xfde047, 0.9).lineBetween(6, 4, 18, 18).lineBetween(18, 18, 12, 36).lineBetween(18, 18, 34, 24);
    });
    bake('wave', 44, 76, () => {
      g.fillStyle(0xa5f3fc, 0.25).fillEllipse(16, 38, 32, 76);
      g.fillStyle(0xffffff, 1).fillEllipse(24, 38, 20, 70);
      g.fillStyle(0x22d3ee, 1).fillEllipse(16, 38, 16, 62);
    });
    bake('soul', 22, 22, () => {
      g.fillStyle(0xffffff, 1).fillCircle(11, 11, 10);
      g.fillStyle(0x22d3ee, 1).fillCircle(11, 11, 7);
    });
    bake('spike', 40, 40, () => {
      g.fillStyle(0xffffff, 0.16).fillTriangle(0, 40, 20, 0, 40, 40);
      g.fillStyle(0x1a1a35, 1).fillTriangle(4, 40, 20, 6, 36, 40);
      g.lineStyle(3, 0xffffff, 1).strokeTriangle(4, 39, 20, 6, 36, 39);
    });
    bake('block', 40, 40, () => {
      g.fillStyle(0x1a1a35, 1).fillRect(0, 0, 40, 40);
      g.lineStyle(2, 0xffffff, 0.85).strokeRect(1, 1, 38, 38);
      g.lineStyle(1, 0xffffff, 0.25).strokeRect(8, 8, 24, 24);
    });
    bake('floor', 80, 120, () => {
      g.fillStyle(0x0a0a1e, 1).fillRect(0, 0, 80, 120);
      g.lineStyle(1, 0xffffff, 0.12).lineBetween(0, 40, 80, 40).lineBetween(0, 80, 80, 80).lineBetween(0, 0, 0, 120).lineBetween(40, 0, 40, 120);
      g.fillStyle(0xffffff, 1).fillRect(0, 0, 80, 3);
    });
    bake('ceil', 80, 80, () => {
      g.fillStyle(0x0a0a1e, 1).fillRect(0, 0, 80, 80);
      g.lineStyle(1, 0xffffff, 0.12).lineBetween(0, 40, 80, 40).lineBetween(0, 0, 0, 80).lineBetween(40, 0, 40, 80);
      g.fillStyle(0xffffff, 1).fillRect(0, 77, 80, 3);
    });
    bake('pad', 40, 12, () => {
      g.fillStyle(0xffffff, 1).fillRoundedRect(2, 2, 36, 10, 4);
    });
    bake('orb', 56, 56, () => {
      g.fillStyle(0xffffff, 0.14).fillCircle(28, 28, 28);
      g.lineStyle(3, 0xffffff, 1).strokeCircle(28, 28, 21);
      g.fillStyle(0xffffff, 1).fillCircle(28, 28, 13);
    });
    bake('portal', 44, 140, () => {
      g.fillStyle(0xffffff, 0.14).fillEllipse(22, 70, 44, 140);
      g.lineStyle(5, 0xffffff, 1).strokeEllipse(22, 70, 32, 128);
    });
    bake('star', 40, 40, () => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 8 : 19;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(new Phaser.Geom.Point(20 + Math.cos(a) * r, 20 + Math.sin(a) * r));
      }
      g.fillStyle(0xffffff, 1).fillPoints(pts, true);
    });
    bake('spark', 10, 10, () => { g.fillStyle(0xffffff, 1).fillCircle(5, 5, 5); });
    bake('shard', 12, 12, () => { g.fillStyle(0xffffff, 1).fillRect(0, 0, 12, 12); });
    bake('stars', 512, 512, () => {
      for (let i = 0; i < 120; i++) {
        g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.15, 0.8));
        g.fillCircle(Phaser.Math.Between(0, 511), Phaser.Math.Between(0, 511), Phaser.Math.FloatBetween(0.6, 1.8));
      }
    });
    bake('peaks', 1024, 260, () => {
      // Cordillera sin cortes: el último pico coincide con el primero
      const pts = [new Phaser.Geom.Point(0, 260)];
      const n = 16;
      const hs = [];
      for (let i = 0; i < n; i++) hs.push(i % 2 ? Phaser.Math.Between(120, 190) : Phaser.Math.Between(20, 100));
      for (let i = 0; i <= n; i++) pts.push(new Phaser.Geom.Point((i * 1024) / n, hs[i % n]));
      pts.push(new Phaser.Geom.Point(1024, 260));
      g.fillStyle(0xffffff, 1).fillPoints(pts, true);
    });
    g.destroy();
  }
}

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  init(data) {
    this.selected = data.level || 0;
    this.practice = false;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0b2b);
    this.stars = this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'stars').setOrigin(0).setAlpha(0.8);
    this.peaks = this.add.tileSprite(0, 330, WIDTH, 260, 'peaks').setOrigin(0).setTint(0x2a1f6b);

    const title = this.add.text(WIDTH / 2, 86, 'PULSO NEÓN', {
      fontFamily: FONT, fontSize: '68px', fontStyle: '900', color: '#ffffff', stroke: '#22d3ee', strokeThickness: 5,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scale: 1.04, duration: S.BEAT * 500, yoyo: true, repeat: -1, ease: 'Sine.easeOut' });

    this.add.text(WIDTH / 2, 148, 'Salta al ritmo. Muere. Repite. Presume.', {
      fontFamily: FONT, fontSize: '20px', color: '#c7d2fe',
    }).setOrigin(0.5);

    this.cards = LEVELS.map((level, i) => this.makeCard(level, i));

    this.practiceLabel = this.add.text(WIDTH / 2, 462, '', {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#1e1b4b', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.practiceLabel.on('pointerdown', () => this.togglePractice());

    this.muteLabel = this.add.text(WIDTH - 16, 16, '', { fontFamily: FONT, fontSize: '16px', color: '#c7d2fe' })
      .setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.muteLabel.on('pointerdown', () => this.toggleMute());

    this.add.text(WIDTH / 2, 530, '←  →  nivel     ESPACIO  saltar     X  poder     P  práctica     M  sonido', {
      fontFamily: FONT, fontSize: '16px', color: '#a5b4fc',
    }).setOrigin(0.5);
    this.add.text(WIDTH / 2, 566, 'Sara Guayasamin · ISWD823 · Hecho con Phaser 3', {
      fontFamily: FONT, fontSize: '13px', color: '#818cf8',
    }).setOrigin(0.5);

    const cursors = this.input.keyboard.createCursorKeys();
    cursors.left.on('down', () => this.select(this.selected - 1));
    cursors.right.on('down', () => this.select(this.selected + 1));
    cursors.up.on('down', () => this.startLevel());
    cursors.space.on('down', () => this.startLevel());
    this.input.keyboard.on('keydown-ENTER', () => this.startLevel());
    this.input.keyboard.on('keydown-P', () => this.togglePractice());
    this.input.keyboard.on('keydown-M', () => this.toggleMute());

    this.select(this.selected, true);
    this.togglePractice(false);
    this.refreshMute();
  }

  makeCard(level, i) {
    const x = 150 + i * 250;
    const y = 300;
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 220, 200, 0x1e1b4b, 0.92).setStrokeStyle(3, 0x4338ca);
    const icon = this.add.image(0, -66, 'lumi-run1');
    const name = this.add.text(0, -18, level.name, { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    const diff = this.add.text(0, 10, level.difficulty, { fontFamily: FONT, fontSize: '16px', color: '#c7d2fe' }).setOrigin(0.5);
    const best = save.data.best[i] || 0;
    const record = this.add.text(0, 38, best >= 100 ? '¡COMPLETADO!' : `Récord: ${best}%`, {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: best >= 100 ? '#4ade80' : '#a5b4fc',
    }).setOrigin(0.5);
    const mask = save.data.coins[i] || 0;
    const stars = [0, 1, 2].map((n) => this.add.image(-30 + n * 30, 70, 'star').setScale(0.65).setTint((mask >> n) & 1 ? 0xfacc15 : 0x3f3f6b));
    card.add([bg, icon, name, diff, record, ...stars]);
    bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      if (this.selected === i) this.startLevel();
      else this.select(i);
    });
    return { card, bg };
  }

  select(i, quiet) {
    this.selected = Phaser.Math.Wrap(i, 0, LEVELS.length);
    this.cards.forEach(({ card, bg }, n) => {
      const on = n === this.selected;
      bg.setStrokeStyle(on ? 4 : 2, on ? 0x22d3ee : 0x4338ca);
      this.tweens.add({ targets: card, scale: on ? 1.06 : 0.94, duration: 120 });
    });
    if (!quiet) { audio.unlock(); audio.sfx('ui'); }
  }

  togglePractice(flip = true) {
    if (flip) { this.practice = !this.practice; audio.unlock(); audio.sfx('ui'); }
    this.practiceLabel.setText(`Modo práctica: ${this.practice ? 'SÍ (con puntos de control)' : 'NO'}`);
    this.practiceLabel.setColor(this.practice ? '#4ade80' : '#ffffff');
  }

  toggleMute() {
    save.data.muted = !save.data.muted;
    save.write();
    audio.setMuted(save.data.muted);
    this.refreshMute();
  }

  refreshMute() { this.muteLabel.setText(save.data.muted ? 'Sonido: NO' : 'Sonido: SÍ'); }

  startLevel() {
    audio.unlock();
    this.scene.start('Play', { level: this.selected, practice: this.practice });
  }

  update(time, delta) {
    this.stars.tilePositionX += delta * 0.01;
    this.peaks.tilePositionX += delta * 0.03;
  }
}

// Los pies de Lumi coinciden con la base de su caja de colisión.
const LUMI_ORIGIN_Y = 1 - S.SIZE / 2 / 43.2;

class PlayScene extends Phaser.Scene {
  constructor() { super('Play'); }

  init(data) {
    this.levelIndex = data.level;
    this.level = LEVELS[data.level];
    this.practice = data.practice;
    this.attempts = 0;
    this.deaths = 0;
    this.checkpoint = null;
    this.nextSection = 1;
    this.phase = 'play';
    this.acc = 0;
    this.autoplay = null;
  }

  create() {
    this.buildBackground();
    this.buildLevel();
    this.buildPlayer();
    this.buildHud();
    this.bindInput();

    this.events.once('shutdown', () => audio.stop());
    this.game.events.on('hidden', this.onHidden, this);
    this.events.once('shutdown', () => this.game.events.off('hidden', this.onHidden, this));

    this.restartAttempt();
  }

  buildBackground() {
    const first = this.level.sections[0];
    this.bgColor = first.color;
    this.bg = this.add.rectangle(0, 0, WIDTH, HEIGHT, first.color).setOrigin(0).setScrollFactor(0).setDepth(-20);
    this.starsBg = this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'stars').setOrigin(0).setScrollFactor(0).setDepth(-19).setAlpha(0.7);
    this.peaks = this.add.tileSprite(0, 230, WIDTH, 260, 'peaks').setOrigin(0).setScrollFactor(0).setDepth(-18).setTint(0xffffff).setAlpha(0.12);
    this.flash = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0xffffff, 0).setOrigin(0).setScrollFactor(0).setDepth(-17);
  }

  buildLevel() {
    const L = this.level;
    const T = S.TILE;
    this.accentItems = [];
    this.pulseItems = [];
    this.coinSprites = [];
    this.wallSprites = L.walls.map((w) => this.add.tileSprite(w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0, 'wall').setOrigin(0).setDepth(3));
    this.foeSprites = L.enemies.map(() => this.add.image(0, 0, 'enemy').setDepth(6).setVisible(false));
    this.foeWarnings = L.enemies.map(() => this.add.text(WIDTH - 30, 0, '!', {
      fontFamily: FONT, fontSize: '38px', fontStyle: '900', color: '#ff2d55', stroke: '#ffffff', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(19).setVisible(false));
    this.shotSprites = [];

    // Suelo y techo: tramos continuos, cortados donde hay huecos
    const addStrips = (gaps, y, h, key, origin) => {
      const sorted = gaps.slice().sort((a, b) => a.x - b.x);
      let from = -40;
      const last = L.length + 60;
      for (const gap of [...sorted, { x: last, w: 0 }]) {
        if (gap.x > from) {
          this.accentItems.push(this.add.tileSprite(from * T, y, (gap.x - from) * T, h, key).setOrigin(0, origin).setDepth(2));
        }
        from = gap.x + gap.w;
      }
    };
    addStrips(L.gaps, S.FLOOR_Y, 120, 'floor', 0);
    addStrips(L.ceilGaps, S.CEIL_Y, 80, 'ceil', 1);

    for (const e of L.ents) {
      const x = e.x * T;
      if (e.t === 'block') {
        const top = S.rowTop(e.y + e.h - 1);
        this.accentItems.push(this.add.tileSprite(x, top, e.w * T, e.h * T, 'block').setOrigin(0).setDepth(3));
      } else if (e.t === 'spike') {
        const img = this.add.image(x + T / 2, S.rowTop(e.y) + T / 2, 'spike').setDepth(3).setFlipY(e.dir < 0).setTint(0xff4d6d);
        this.pulseItems.push(img);
      } else if (e.t === 'pad') {
        const y = e.dir > 0 ? S.rowBottom(e.y) - 6 : S.rowTop(e.y) + 6;
        this.add.image(x + T / 2, y, 'pad').setDepth(3).setTint(0xfde047).setFlipY(e.dir < 0);
      } else if (e.t === 'orb' || e.t === 'gorb') {
        const img = this.add.image(x + T / 2, S.rowTop(e.y) + T / 2, 'orb').setDepth(3).setTint(e.t === 'orb' ? 0xfde047 : 0x4ade80);
        this.pulseItems.push(img);
      } else if (e.t === 'portal') {
        const colors = { up: 0x60a5fa, down: 0xfbbf24, ship: 0xf472b6, cube: 0x4ade80, fast: 0xef4444, normal: 0xa3e635 };
        const portal = this.add.image(x + T / 2, 280, 'portal').setDepth(3).setTint(colors[e.kind]).setScale(1, 2.6).setAlpha(0.9);
        this.tweens.add({ targets: portal, alpha: 0.5, duration: 300, yoyo: true, repeat: -1 });
      }
    }

    for (const c of L.coins) {
      const star = this.add.image(c.cx, c.cy, 'star').setDepth(4).setTint(0xfacc15);
      this.tweens.add({ targets: star, angle: 360, duration: 3000, repeat: -1 });
      this.coinSprites.push(star);
    }

    for (const t of L.texts) {
      this.add.text(t.x * T, S.rowTop(t.y), t.str, {
        fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4,
      }).setDepth(5).setAlpha(0.95);
    }

    for (let i = 0; i < 9; i++) {
      this.add.rectangle(L.endX + 8, 100 + i * 40, 16, 36, 0xffffff, i % 2 ? 1 : 0.35).setDepth(3);
    }
  }

  buildPlayer() {
    this.player = this.physics.add.image(0, 0, 'lumi-run1').setDepth(6).setScale(0.9).setOrigin(0.5, LUMI_ORIGIN_Y);
    this.player.body.setAllowGravity(false);
    this.player.body.moves = false;

    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 1, 0);
    cam.setFollowOffset(-220, 0);
    cam.scrollY = 0;

    this.trail = this.add.particles(0, 0, 'spark', {
      speedX: { min: -50, max: -10 }, speedY: { min: -14, max: 14 },
      scale: { start: 0.9, end: 0 }, alpha: { start: 0.7, end: 0 }, lifespan: 340, frequency: 22, tint: 0xf9a8d4,
    }).setDepth(5);
    this.trail.startFollow(this.player, -14, 0);

    this.dust = this.add.particles(0, 0, 'spark', {
      speed: { min: 30, max: 130 }, scale: { start: 0.6, end: 0 }, lifespan: 300, emitting: false,
    }).setDepth(5);
    this.burst = this.add.particles(0, 0, 'spark', {
      speed: { min: 80, max: 520 }, scale: { start: 1.3, end: 0 }, lifespan: 650, emitting: false,
    }).setDepth(7);

    // Arcade Physics mueve los pedazos que saltan en cada explosión
    this.debris = this.physics.add.group();
    this.debrisFloor = this.add.zone(0, S.FLOOR_Y + 30, WIDTH * 3, 60);
    this.physics.add.existing(this.debrisFloor, true);
    this.physics.add.collider(this.debris, this.debrisFloor);
  }

  buildHud() {
    const depth = 20;
    this.add.rectangle(WIDTH / 2, 20, 500, 12, 0x000000, 0.5).setScrollFactor(0).setDepth(depth).setStrokeStyle(2, 0xffffff, 0.8);
    this.bar = this.add.rectangle(WIDTH / 2 - 248, 20, 0, 8, 0xffffff).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth);
    this.pctText = this.add.text(WIDTH / 2 + 262, 20, '0%', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth);
    this.attemptText = this.add.text(14, 34, '', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffffff' })
      .setScrollFactor(0).setDepth(depth);
    if (this.practice) {
      this.add.text(120, 36, 'PRÁCTICA', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#4ade80' })
        .setScrollFactor(0).setDepth(depth);
    }
    this.coinHud = [0, 1, 2].map((n) => this.add.image(WIDTH - 90 + n * 30, 50, 'star').setScale(0.55).setScrollFactor(0).setDepth(depth));
    this.soulHud = [0, 1, 2].map((n) => this.add.image(26 + n * 26, 72, 'soul').setScrollFactor(0).setDepth(depth));
    if (this.sys.game.device.input.touch) {
      // Pantallas táctiles: botón propio para el poder
      this.fireButton = this.add.circle(WIDTH - 66, HEIGHT - 58, 44, 0x22d3ee, 0.45).setStrokeStyle(3, 0xffffff)
        .setScrollFactor(0).setDepth(depth).setInteractive();
      this.add.text(WIDTH - 66, HEIGHT - 58, 'PODER', { fontFamily: FONT, fontSize: '16px', fontStyle: '900', color: '#ffffff' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(depth);
      this.fireButton.on('pointerdown', () => { this.fireQueued = true; });
    }
    this.pauseButton = this.add.text(WIDTH - 12, 8, 'II', { fontFamily: FONT, fontSize: '22px', fontStyle: '900', color: '#ffffff' })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(depth).setInteractive({ useHandCursor: true });
    this.pauseButton.on('pointerdown', () => this.togglePause());
    this.toast = this.add.text(WIDTH / 2, 190, '', {
      fontFamily: FONT, fontSize: '30px', fontStyle: '900', color: '#ffffff', stroke: '#000000', strokeThickness: 6, align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth).setAlpha(0);

    this.overlay = this.add.container(0, 0).setScrollFactor(0).setDepth(30).setVisible(false);
  }

  bindInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey('W');
    this.input.addPointer(1);
    this.input.mouse.disableContextMenu();
    for (const key of ['X', 'Z', 'F']) this.input.keyboard.on(`keydown-${key}`, () => { this.fireQueued = true; });
    this.input.on('pointerdown', (p) => { if (p.rightButtonDown()) this.fireQueued = true; });
    const kb = this.input.keyboard;
    kb.on('keydown-ESC', () => this.togglePause());
    kb.on('keydown-P', () => this.togglePause());
    kb.on('keydown-Q', () => { if (this.phase !== 'play' && this.phase !== 'dying') this.toMenu(); });
    kb.on('keydown-M', () => {
      save.data.muted = !save.data.muted;
      save.write();
      audio.setMuted(save.data.muted);
    });
    kb.on('keydown-SPACE', () => this.confirm());
    kb.on('keydown-ENTER', () => this.confirm());
  }

  confirm() {
    if (this.phase === 'paused') this.togglePause();
    else if (this.phase === 'won') this.toNext();
  }

  onHidden() {
    if (this.phase === 'play') this.togglePause();
  }

  readFire() {
    if (this.autoplay) return (this.autoplay(this.sim.n) & 2) === 2;
    const fire = this.fireQueued;
    this.fireQueued = false;
    return fire;
  }

  readHold() {
    if (this.autoplay) return (this.autoplay(this.sim.n) & 1) === 1;
    const pointerJump = this.input.manager.pointers.some((p) => {
      const onPause = p.x > WIDTH - 50 && p.y < 45;
      const onFire = this.fireButton && p.x > WIDTH - 120 && p.y > HEIGHT - 112;
      return p.isDown && !onPause && !onFire && !p.rightButtonDown();
    });
    return this.cursors.space.isDown || this.cursors.up.isDown || this.keyW.isDown || pointerJump;
  }

  restartAttempt() {
    this.attempts++;
    this.sim = this.checkpoint ? S.clone(this.checkpoint) : S.createState();
    if (this.checkpoint) this.sim.hold = false;
    this.nextSection = this.level.sections.filter((s) => s.x * S.TILE <= this.sim.x).length;
    this.applySection(Math.max(0, this.nextSection - 1), true);
    this.acc = 0;
    this.phase = 'play';
    this.rot = 0;
    this.player.setVisible(true).setTexture('lumi-run1').setOrigin(0.5, LUMI_ORIGIN_Y).setPosition(this.sim.x, this.sim.y).setRotation(0);
    this.fireQueued = false;
    this.syncWalls();
    this.trail.start();
    this.debris.clear(true, true);
    this.syncCoins();
    this.attemptText.setText(`Intento ${this.attempts}`);
    audio.unlock();
    audio.play(this.level.music, this.sim.t);
  }

  syncWalls() {
    this.level.walls.forEach((w) => this.wallSprites[w.id].setVisible(!this.sim.broken.includes(w.id)));
  }

  spawnShards(x, y, tint, count) {
    for (let i = 0; i < count; i++) {
      const shard = this.debris.create(x, y, 'shard').setTint(tint).setDepth(7);
      shard.setVelocity(Phaser.Math.Between(-320, 320), Phaser.Math.Between(-560, -120));
      shard.setAngularVelocity(Phaser.Math.Between(-500, 500));
      shard.setBounce(0.5);
      shard.body.setGravityY(1500);
    }
  }

  syncCoins() {
    this.level.coins.forEach((c, i) => {
      const got = (this.sim.coins >> i) & 1;
      this.coinSprites[i].setVisible(!got);
      this.coinHud[i].setTint(got ? 0xfacc15 : 0x3f3f6b);
    });
  }

  applySection(i, instant) {
    const sec = this.level.sections[i];
    this.bar.setFillStyle(sec.accent);
    this.accent = sec.accent;
    for (const item of this.accentItems) item.setTint(sec.accent);
    if (instant) {
      this.bg.setFillStyle(sec.color);
      this.bgColor = sec.color;
      return;
    }
    const from = Phaser.Display.Color.ValueToColor(this.bgColor);
    const to = Phaser.Display.Color.ValueToColor(sec.color);
    this.tweens.addCounter({
      from: 0, to: 100, duration: 500,
      onUpdate: (tw) => {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, tw.getValue());
        this.bg.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
      },
    });
    this.bgColor = sec.color;
    this.flash.setFillStyle(sec.accent, 0.35);
    this.tweens.add({ targets: this.flash, fillAlpha: 0, duration: 450 });
  }

  update(time, delta) {
    this.debrisFloor.body.position.x = this.cameras.main.scrollX - WIDTH;
    this.debrisFloor.body.updateCenter();
    if (this.phase !== 'play') return;

    this.acc += Math.min(delta, 100) / 1000;
    while (this.acc >= S.DT && this.phase === 'play') {
      this.acc -= S.DT;
      S.step(this.sim, this.level, this.readHold(), this.readFire());
      this.handleEvents();
      if (this.sim.dead) { this.die(); break; }
      if (this.sim.won) { this.win(); break; }
      this.advanceSections();
    }
    this.renderPlayer(delta);
    this.renderWorld();
  }

  handleEvents() {
    for (const ev of this.sim.ev) {
      if (ev === 'land') {
        this.dust.explode(5, this.sim.x, this.sim.y + (S.SIZE / 2) * this.sim.g);
      } else if (ev === 'coin') {
        audio.sfx('coin');
        this.syncCoins();
      } else if (ev === 'boom') {
        audio.sfx('boom');
        this.syncWalls();
        this.burst.explode(22, this.sim.boomX, this.sim.boomY);
        this.spawnShards(this.sim.boomX, this.sim.boomY, 0xfb923c, 8);
        this.cameras.main.shake(110, 0.008);
      } else if (ev === 'portal') {
        audio.sfx('portal');
        this.cameras.main.flash(120, 255, 255, 255, false);
      } else {
        audio.sfx(ev);
      }
    }
  }

  advanceSections() {
    const secs = this.level.sections;
    if (this.nextSection >= secs.length || this.sim.x < secs[this.nextSection].x * S.TILE) return;
    // En práctica el punto de control espera a que el jugador esté en una posición segura.
    const stable = this.sim.mode === 'ship' || this.sim.onGround;
    if (this.practice && !stable) return;
    this.applySection(this.nextSection);
    this.nextSection++;
    if (this.practice) {
      this.checkpoint = S.clone(this.sim);
      this.showToast('Punto de control', 900);
    }
  }

  renderPlayer(delta) {
    const s = this.sim;
    const isShip = s.mode === 'ship';
    let frame = 'ship';
    if (!isShip) {
      if (s.cd > 0.08) frame = 'lumi-shoot';
      else if (!s.onGround) frame = 'lumi-jump';
      else frame = Math.floor(s.t * 10) % 2 ? 'lumi-run2' : 'lumi-run1';
    }
    if (this.player.texture.key !== frame) {
      this.player.setTexture(frame).setOrigin(0.5, isShip ? 0.6 : LUMI_ORIGIN_Y);
    }
    this.player.setPosition(s.x, s.y);
    this.player.setFlipY(s.g < 0);
    if (isShip) {
      this.player.setRotation(Phaser.Math.Clamp(s.vy / 900, -0.6, 0.6));
    } else {
      this.player.setRotation(s.onGround ? 0 : Phaser.Math.Clamp((s.vy * s.g) / 3000, -0.25, 0.25));
    }
  }

  renderWorld() {
    const s = this.sim;
    const cam = this.cameras.main;
    this.renderCombat(cam);
    this.starsBg.tilePositionX = cam.scrollX * 0.08;
    this.peaks.tilePositionX = cam.scrollX * 0.25;

    const pct = Math.min(100, Math.floor((s.x / this.level.endX) * 100));
    this.bar.width = (496 * pct) / 100;
    this.pctText.setText(`${pct}%`);

    // Todo lo peligroso late al compás de la música
    const beat = (s.t / S.BEAT) % 1;
    const pulse = 1 + 0.12 * (1 - beat) * (1 - beat);
    const min = cam.scrollX - 60;
    const max = cam.scrollX + WIDTH + 60;
    for (const item of this.pulseItems) {
      if (item.x > min && item.x < max) item.setScale(pulse);
    }
    this.peaks.setAlpha(0.1 + 0.08 * (1 - beat));
  }

  renderCombat(cam) {
    const s = this.sim;
    this.foeSprites.forEach((sprite) => sprite.setVisible(false));
    this.foeWarnings.forEach((warn) => warn.setVisible(false));
    for (const f of s.foes) {
      this.foeSprites[f.id].setVisible(true).setPosition(f.x, f.y);
      if (f.x > cam.scrollX + WIDTH + 10) {
        this.foeWarnings[f.id].setVisible(Math.floor(s.t * 12) % 2 === 0).setY(f.y);
      }
    }
    while (this.shotSprites.length < s.shots.length) {
      this.shotSprites.push(this.add.image(0, 0, 'wave').setDepth(6));
    }
    this.shotSprites.forEach((sprite, i) => {
      const shot = s.shots[i];
      sprite.setVisible(!!shot);
      if (shot) sprite.setPosition(shot.x, shot.y);
    });
    this.soulHud.forEach((orb, i) => orb.setAlpha(s.soul >= i + 1 ? 1 : 0.2));
  }

  percent() {
    return Math.min(100, Math.floor((this.sim.x / this.level.endX) * 100));
  }

  die() {
    this.phase = 'dying';
    this.deaths++;
    const { x, y } = this.sim;
    const pct = this.percent();
    audio.stop();
    audio.sfx('die');
    this.player.setVisible(false);
    this.trail.stop();
    this.cameras.main.shake(220, 0.012);
    this.burst.explode(36, x, y);

    this.spawnShards(x, y, 0xf472b6, 10);
    this.foeSprites.forEach((sprite) => sprite.setVisible(false));
    this.foeWarnings.forEach((warn) => warn.setVisible(false));
    this.shotSprites.forEach((sprite) => sprite.setVisible(false));

    let record = false;
    if (!this.practice && pct > (save.data.best[this.levelIndex] || 0)) {
      save.data.best[this.levelIndex] = pct;
      save.write();
      record = pct >= 5;
    }
    const line = DEATH_LINES.find(([limit]) => pct < limit)[1];
    this.showToast(record ? `¡NUEVO RÉCORD: ${pct}%!\n${line}` : `${pct}%  ${line}`, 760);
    this.time.delayedCall(760, () => { if (this.phase === 'dying') this.restartAttempt(); });
  }

  win() {
    this.phase = 'won';
    audio.stop();
    audio.sfx('win');
    this.trail.stop();
    this.bar.width = 496;
    this.pctText.setText('100%');
    this.tweens.add({ targets: this.player, x: this.player.x + 300, y: 280, angle: 720, scale: 0, duration: 600, ease: 'Cubic.easeIn' });

    const got = this.sim.coins;
    if (!this.practice) {
      save.data.best[this.levelIndex] = 100;
      save.data.coins[this.levelIndex] = (save.data.coins[this.levelIndex] || 0) | got;
      save.write();
    }
    this.time.delayedCall(500, () => this.showResult(got));
  }

  showResult(got) {
    const items = [
      this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.72).setOrigin(0),
      this.add.text(WIDTH / 2, 150, '¡NIVEL SUPERADO!', {
        fontFamily: FONT, fontSize: '50px', fontStyle: '900', color: '#ffffff', stroke: '#22d3ee', strokeThickness: 5,
      }).setOrigin(0.5),
    ];
    [0, 1, 2].forEach((n) => {
      const on = (got >> n) & 1;
      const star = this.add.image(WIDTH / 2 - 80 + n * 80, 245, 'star').setScale(on ? 1.6 : 1.2).setTint(on ? 0xfacc15 : 0x3f3f6b);
      items.push(star);
    });
    const summary = this.practice
      ? 'En práctica no se guardan récords. ¿Te atreves sin puntos de control?'
      : `Intentos: ${this.attempts}   ·   Estrellas: ${countBits(got)}/3`;
    items.push(this.add.text(WIDTH / 2, 320, summary, { fontFamily: FONT, fontSize: '22px', color: '#e0e7ff' }).setOrigin(0.5));
    const hasNext = this.levelIndex < LEVELS.length - 1;
    const next = this.add.text(WIDTH / 2, 390, hasNext ? 'ESPACIO: siguiente nivel' : 'ESPACIO: volver al menú', {
      fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#4338ca', padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    next.on('pointerdown', () => this.toNext());
    items.push(next);
    const menu = this.add.text(WIDTH / 2, 450, 'Q: menú', { fontFamily: FONT, fontSize: '18px', color: '#c7d2fe' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => this.toMenu());
    items.push(menu);
    this.overlay.add(items);
    items.forEach((it) => it.setScrollFactor(0));
    this.overlay.setVisible(true);
    this.pauseButton.setVisible(false);
  }

  togglePause() {
    if (this.phase === 'play') {
      this.phase = 'paused';
      audio.pause();
      this.tweens.pauseAll();
      const items = [
        this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.65).setOrigin(0),
        this.add.text(WIDTH / 2, 220, 'PAUSA', { fontFamily: FONT, fontSize: '56px', fontStyle: '900', color: '#ffffff' }).setOrigin(0.5),
      ];
      const go = this.add.text(WIDTH / 2, 310, 'ESPACIO: continuar', {
        fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#4338ca', padding: { x: 18, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      go.on('pointerdown', () => this.togglePause());
      const menu = this.add.text(WIDTH / 2, 372, 'Q: menú', { fontFamily: FONT, fontSize: '18px', color: '#c7d2fe' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      menu.on('pointerdown', () => this.toMenu());
      items.push(go, menu);
      this.overlay.add(items);
      items.forEach((it) => it.setScrollFactor(0));
      this.overlay.setVisible(true);
    } else if (this.phase === 'paused') {
      this.overlay.removeAll(true);
      this.overlay.setVisible(false);
      this.tweens.resumeAll();
      audio.resume();
      this.phase = 'play';
    }
  }

  toNext() {
    audio.sfx('ui');
    if (this.levelIndex < LEVELS.length - 1) {
      this.scene.start('Play', { level: this.levelIndex + 1, practice: this.practice });
    } else {
      this.toMenu();
    }
  }

  toMenu() {
    audio.resume();
    this.scene.start('Menu', { level: this.levelIndex });
  }

  showToast(text, duration) {
    this.tweens.killTweensOf(this.toast);
    this.toast.setText(text).setAlpha(1);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: duration * 0.6, duration: duration * 0.4 });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'juego',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#0d0b2b',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
  scene: [BootScene, MenuScene, PlayScene],
};

const game = new Phaser.Game(config);
