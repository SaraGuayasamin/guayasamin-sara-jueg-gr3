// Motor del juego: física determinista a paso fijo, sin dependencias de Phaser.
// Al ser independiente, el mismo código corre en el navegador y en tests/verificar-niveles.js.
const PulsoSim = (() => {
  const TILE = 40;
  const FLOOR_Y = 480;
  const CEIL_Y = 80;
  const BPM = 128;
  const BEAT = 60 / BPM;
  const BASE_SPEED = (TILE * 4) / BEAT; // un pulso de la música equivale a 4 casillas
  const DT = 1 / 120;

  const G = 2600;
  const JUMP = 760;
  const PAD = 1040;
  const ORB = 760;
  const MAX_V = 1000;
  const SHIP_UP = 1700;
  const SHIP_DOWN = 1500;
  const SHIP_MAX = 430;
  const SIZE = 36;
  const SNAP = 10;
  const ORB_RADIUS = 44;
  const COIN_RADIUS = 36;
  const PRESS_BUFFER = 0.1;
  const COYOTE = 0.06;

  const SHOT_SPEED = 1150;
  const SHOT_LIFE = 0.55;
  const SHOT_HALF_H = 35;
  const SOUL_MAX = 3;
  const SOUL_RATE = 0.5;
  const SOUL_ON_HIT = 0.5;
  const SHOT_COOLDOWN = 0.22;
  const ENEMY_SPEED = 240;
  const ENEMY_LEAD = 900; // nacen fuera de pantalla: la alerta "!" avisa antes de que entren
  const ENEMY_HALF_W = 22;
  const ENEMY_HALF_H = 14;

  const rowTop = (r) => FLOOR_Y - (r + 1) * TILE;
  const rowBottom = (r) => FLOOR_Y - r * TILE;

  // Convierte la descripción en casillas de un nivel en cajas de colisión por columna.
  function prepare(raw) {
    const endX = raw.length * TILE;
    const cols = [];
    const put = (x0, x1, item) => {
      const a = Math.max(0, Math.floor(x0 / TILE));
      const b = Math.floor((x1 - 0.001) / TILE);
      for (let c = a; c <= b; c++) (cols[c] = cols[c] || []).push(item);
    };
    const inGap = (gaps, col) => gaps.some((g) => col >= g.x && col < g.x + g.w);

    for (let c = -4; c < raw.length + 40; c++) {
      if (c < 0) continue;
      const x0 = c * TILE;
      if (!inGap(raw.gaps, c)) put(x0, x0 + TILE, { k: 'solid', edge: true, x0, x1: x0 + TILE, y0: FLOOR_Y, y1: FLOOR_Y + 200 });
      if (!inGap(raw.ceilGaps, c)) put(x0, x0 + TILE, { k: 'solid', edge: true, x0, x1: x0 + TILE, y0: CEIL_Y - 200, y1: CEIL_Y });
    }

    let id = 0;
    const portals = [];
    const coins = [];
    const walls = [];
    const enemies = [];
    for (const e of raw.ents) {
      const x0 = e.x * TILE;
      if (e.t === 'block') {
        const b = { k: 'solid', x0, x1: x0 + e.w * TILE, y0: rowTop(e.y + e.h - 1), y1: rowBottom(e.y) };
        put(b.x0, b.x1, b);
      } else if (e.t === 'wall') {
        const w = { k: 'solid', breakable: true, id: walls.length, x0, x1: x0 + e.w * TILE, y0: rowTop(e.y + e.h - 1), y1: rowBottom(e.y) };
        walls.push(w);
        put(w.x0, w.x1, w);
      } else if (e.t === 'enemy') {
        enemies.push({ x: x0, cy: rowTop(e.y) + TILE / 2, kind: e.kind });
      } else if (e.t === 'spike') {
        const cx = x0 + TILE / 2;
        const y0 = e.dir > 0 ? rowBottom(e.y) - 26 : rowTop(e.y);
        put(x0, x0 + TILE, { k: 'hazard', x0: cx - 8, x1: cx + 8, y0, y1: y0 + 26 });
      } else if (e.t === 'pad') {
        const y0 = e.dir > 0 ? rowBottom(e.y) - 12 : rowTop(e.y);
        put(x0, x0 + TILE, { k: 'pad', id: id++, x0, x1: x0 + TILE, y0, y1: y0 + 12 });
      } else if (e.t === 'orb' || e.t === 'gorb') {
        const item = { k: e.t, id: id++, cx: x0 + TILE / 2, cy: rowTop(e.y) + TILE / 2 };
        put(item.cx - ORB_RADIUS - SIZE, item.cx + ORB_RADIUS + SIZE, item);
      } else if (e.t === 'portal') {
        portals.push({ x: x0 + TILE / 2, kind: e.kind });
      } else if (e.t === 'coin') {
        const item = { k: 'coin', i: coins.length, cx: x0 + TILE / 2, cy: rowTop(e.y) + TILE / 2 };
        coins.push(item);
        put(item.cx - COIN_RADIUS - SIZE, item.cx + COIN_RADIUS + SIZE, item);
      }
    }
    portals.sort((a, b) => a.x - b.x);
    enemies.sort((a, b) => a.x - b.x);
    enemies.forEach((e, i) => { e.id = i; });
    return { ...raw, cols, portals, coins, walls, enemies, endX };
  }

  function createState() {
    return {
      n: 0, t: 0, x: 0, y: FLOOR_Y - SIZE / 2, vy: 0, g: 1,
      mode: 'cube', speed: BASE_SPEED, onGround: true, hold: false,
      buf: 0, coy: 0, jumped: false, used: [], coins: 0, nextPortal: 0,
      soul: SOUL_MAX, cd: 0, shots: [], foes: [], broken: [], nextEnemy: 0, boomX: 0, boomY: 0,
      dead: false, won: false, ev: [],
    };
  }

  const clone = (s) => ({
    ...s,
    used: s.used.slice(),
    broken: s.broken.slice(),
    shots: s.shots.map((o) => ({ ...o })),
    foes: s.foes.map((o) => ({ ...o })),
    ev: [],
  });

  function boom(s, x, y) {
    s.soul = Math.min(SOUL_MAX, s.soul + SOUL_ON_HIT);
    s.boomX = x;
    s.boomY = y;
    s.ev.push('boom');
  }

  // El poder: una onda que avanza y destruye la primera nave o muro agrietado que toca.
  function updatePower(s, level, fire) {
    s.soul = Math.min(SOUL_MAX, s.soul + SOUL_RATE * DT);
    s.cd = Math.max(0, s.cd - DT);
    if (fire && s.cd === 0 && s.soul >= 1) {
      s.soul -= 1;
      s.cd = SHOT_COOLDOWN;
      s.shots.push({ x: s.x + 20, y: s.y, life: SHOT_LIFE });
      s.ev.push('shoot');
    }

    while (s.nextEnemy < level.enemies.length && level.enemies[s.nextEnemy].x <= s.x) {
      const e = level.enemies[s.nextEnemy++];
      s.foes.push({ id: e.id, kind: e.kind, x: s.x + ENEMY_LEAD, y: e.cy, cy: e.cy, t: 0 });
    }
    for (const f of s.foes) {
      f.x -= ENEMY_SPEED * DT;
      f.t += DT;
      if (f.kind === 'sine') f.y = f.cy + 60 * Math.sin((2 * Math.PI * f.t) / (BEAT * 2));
    }
    s.foes = s.foes.filter((f) => f.x > s.x - 400);

    s.shots = s.shots.filter((shot) => {
      shot.x += SHOT_SPEED * DT;
      shot.life -= DT;
      if (shot.life <= 0) return false;
      for (let i = 0; i < s.foes.length; i++) {
        const f = s.foes[i];
        if (Math.abs(f.x - shot.x) <= ENEMY_HALF_W + 14 && Math.abs(f.y - shot.y) <= ENEMY_HALF_H + SHOT_HALF_H) {
          s.foes.splice(i, 1);
          boom(s, f.x, f.y);
          return false;
        }
      }
      for (const o of level.cols[Math.floor(shot.x / TILE)] || []) {
        if (o.k !== 'solid' || o.edge || shot.y + SHOT_HALF_H <= o.y0 || shot.y - SHOT_HALF_H >= o.y1) continue;
        if (!o.breakable) return false;
        if (!s.broken.includes(o.id)) {
          s.broken.push(o.id);
          boom(s, shot.x, shot.y);
          return false;
        }
      }
      return true;
    });
  }

  function applyPortal(s, kind) {
    if (kind === 'up' || kind === 'down') {
      const g = kind === 'up' ? -1 : 1;
      if (g !== s.g) { s.g = g; s.vy *= 0.5; s.onGround = false; }
    } else if (kind === 'ship') {
      s.mode = 'ship'; s.vy *= 0.5; s.onGround = false;
    } else if (kind === 'cube') {
      s.mode = 'cube';
    } else if (kind === 'fast') {
      s.speed = BASE_SPEED * 1.25;
    } else if (kind === 'normal') {
      s.speed = BASE_SPEED;
    }
    s.ev.push('portal');
  }

  function step(s, level, hold, fire = false) {
    s.ev.length = 0;
    const edge = hold && !s.hold;
    s.hold = hold;
    s.buf = edge ? PRESS_BUFFER : Math.max(0, s.buf - DT);
    s.n++;
    s.t += DT;

    const prevX = s.x;
    s.x += s.speed * DT;
    while (s.nextPortal < level.portals.length && level.portals[s.nextPortal].x <= s.x) {
      if (level.portals[s.nextPortal].x > prevX) applyPortal(s, level.portals[s.nextPortal].kind);
      s.nextPortal++;
    }

    updatePower(s, level, fire);

    const half = SIZE / 2;
    const near = [];
    const colA = Math.floor((s.x - half) / TILE);
    const colB = Math.floor((s.x + half) / TILE);
    for (let c = colA; c <= colB; c++) if (level.cols[c]) near.push(...level.cols[c]);

    // Disparadores: esferas, trampolines y estrellas.
    for (const o of near) {
      if (o.k === 'orb' || o.k === 'gorb') {
        if (s.buf > 0 && s.mode === 'cube' && !s.used.includes(o.id) && Math.hypot(s.x - o.cx, s.y - o.cy) <= ORB_RADIUS) {
          s.used.push(o.id);
          s.buf = 0;
          s.onGround = false;
          s.jumped = true;
          if (o.k === 'gorb') { s.g = -s.g; s.vy = -ORB * 0.45 * s.g; } else s.vy = -ORB * s.g;
          s.ev.push('orb');
        }
      } else if (o.k === 'pad') {
        if (!s.used.includes(o.id) && s.mode === 'cube' && s.x + half > o.x0 && s.x - half < o.x1 && s.y + half > o.y0 && s.y - half < o.y1) {
          s.used.push(o.id);
          s.onGround = false;
          s.jumped = true;
          s.vy = -PAD * s.g;
          s.ev.push('pad');
        }
      } else if (o.k === 'coin') {
        if (!(s.coins & (1 << o.i)) && Math.hypot(s.x - o.cx, s.y - o.cy) <= COIN_RADIUS) {
          s.coins |= 1 << o.i;
          s.ev.push('coin');
        }
      }
    }

    // Movimiento vertical según el modo.
    if (s.mode === 'cube') {
      if (hold && (s.onGround || (s.coy > 0 && !s.jumped))) {
        s.vy = -JUMP * s.g;
        s.onGround = false;
        s.jumped = true;
        s.coy = 0;
        s.ev.push('jump');
      }
      s.vy = Math.max(-MAX_V, Math.min(MAX_V, s.vy + G * s.g * DT));
    } else {
      s.vy += (hold ? -SHIP_UP : SHIP_DOWN) * s.g * DT;
      s.vy = Math.max(-SHIP_MAX, Math.min(SHIP_MAX, s.vy));
    }
    s.y += s.vy * DT;

    const wasGround = s.onGround;
    s.onGround = false;
    const top = () => s.y - half;
    const bottom = () => s.y + half;

    for (const o of near) {
      if (o.k !== 'solid' || (o.breakable && s.broken.includes(o.id))) continue;
      if (s.x + half <= o.x0 || s.x - half >= o.x1 || bottom() <= o.y0 || top() >= o.y1) continue;
      const penTop = bottom() - o.y0;
      const penBottom = o.y1 - top();
      const feet = s.g > 0 ? penTop : penBottom;
      const head = s.g > 0 ? penBottom : penTop;
      const falling = s.vy * s.g >= 0;
      const snapFeet = () => { s.y = s.g > 0 ? o.y0 - half : o.y1 + half; s.vy = 0; s.onGround = true; };
      const snapHead = () => { s.y = s.g > 0 ? o.y1 + half : o.y0 - half; s.vy = 0; };

      if (feet <= SNAP) {
        if (falling) snapFeet();
      } else if (head <= SNAP) {
        if (!falling) {
          if (s.mode === 'ship' || o.edge) snapHead();
          else s.dead = true;
        }
      } else {
        s.dead = true;
      }
    }

    if (s.onGround) {
      if (!wasGround) s.ev.push('land');
      s.jumped = false;
      s.coy = COYOTE;
    } else {
      s.coy = Math.max(0, s.coy - DT);
    }

    const hz = half - 4;
    for (const o of near) {
      if (o.k === 'hazard' && s.x + hz > o.x0 && s.x - hz < o.x1 && s.y + hz > o.y0 && s.y - hz < o.y1) s.dead = true;
    }

    for (const f of s.foes) {
      if (Math.abs(f.x - s.x) < hz + ENEMY_HALF_W && Math.abs(f.y - s.y) < hz + ENEMY_HALF_H) s.dead = true;
    }

    if (s.y > FLOOR_Y + 120 || s.y < CEIL_Y - 120) s.dead = true;
    if (!s.dead && s.x >= level.endX) s.won = true;
    return s;
  }

  return { TILE, FLOOR_Y, CEIL_Y, BEAT, BPM, BASE_SPEED, DT, SIZE, SOUL_MAX, rowTop, rowBottom, prepare, createState, clone, step };
})();

if (typeof module !== 'undefined') module.exports = PulsoSim;
