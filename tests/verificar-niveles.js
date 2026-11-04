// Comprueba con un bot que cada nivel se puede completar.
// El bot solo decide 12 veces por segundo y prueba varios desfases: si gana así,
// el nivel no exige precisión imposible. Uso: node tests/verificar-niveles.js
const path = require('path');
const fs = require('fs');
const S = require('../sim.js');
const LEVELS = require('../levels.js');

const STEPS_PER_DECISION = 10;

function solve(level, opts) {
  const seen = new Set();
  let maxX = 0;
  let nodes = 0;
  const inputs = [];

  function dfs(state, depth, hold) {
    const s = S.clone(state);
    for (let i = 0; i < STEPS_PER_DECISION; i++) {
      S.step(s, level, hold);
      if (s.x > maxX) maxX = s.x;
      if (s.dead) return false;
      if (s.won) return !opts.allCoins || s.coins === (1 << level.coins.length) - 1;
    }
    const key = [depth, Math.round(s.y / 2), Math.round(s.vy / 25), s.g, s.mode, s.onGround, hold, s.coins, s.used.length].join();
    if (seen.has(key)) return false;
    seen.add(key);
    if (++nodes > opts.maxNodes) throw new Error('límite de búsqueda');
    for (const next of hold ? [true, false] : [false, true]) {
      inputs[depth + 1] = next;
      if (dfs(s, depth + 1, next)) return true;
    }
    return false;
  }

  // El desfase retrasa la primera decisión para mover toda la rejilla de pulsaciones.
  const start = S.createState();
  for (let i = 0; i < opts.offset; i++) S.step(start, level, false);
  inputs[0] = false;
  const ok = dfs(start, 0, false);
  return { ok, maxX, nodes, inputs: ok ? inputs.slice() : null };
}

let failed = false;
const replays = {};
LEVELS.forEach((raw, idx) => {
  const level = S.prepare(raw);
  const secs = (level.endX / S.BASE_SPEED).toFixed(0);
  console.log(`\n${raw.name}: ${raw.length} casillas, ~${secs}s, ${raw.ents.length} objetos, ${level.coins.length} estrellas`);
  for (const offset of [0, 3, 6, 9]) {
    const r = solve(level, { offset, allCoins: false, maxNodes: 3e6 });
    console.log(`  desfase ${offset}: ${r.ok ? 'GANA' : `FALLA en casilla ${(r.maxX / S.TILE).toFixed(1)} (${Math.round((r.maxX / level.endX) * 100)}%)`} [${r.nodes} nodos]`);
    if (!r.ok) failed = true;
    if (r.ok && offset === 0) replays[idx] = r.inputs;
  }
  const c = solve(level, { offset: 0, allCoins: true, maxNodes: 3e6 });
  console.log(`  con todas las estrellas: ${c.ok ? 'GANA' : `FALLA, llega a casilla ${(c.maxX / S.TILE).toFixed(1)}`}`);
  if (!c.ok) failed = true;
});

if (process.argv[2]) fs.writeFileSync(path.resolve(process.argv[2]), JSON.stringify({ stepsPerDecision: STEPS_PER_DECISION, replays }));
console.log(failed ? '\nHay niveles con problemas.' : '\nTodos los niveles se pueden completar.');
process.exit(failed ? 1 : 0);
