// Standalone checks: pass the TypeScript service source as stdin.
const assert = require('node:assert/strict');
const ts = require('typescript');
const Module = require('module');
const moment = require('moment-timezone');
const axios = require('axios');
let source = '';
process.stdin.on('data', d => source += d);
process.stdin.on('end', async () => {
 try {
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true } });
  const m = new Module(process.cwd() + '/roof-test-runtime.js', module);
  m.filename = process.cwd() + '/roof-test-runtime.js';
  m.paths = Module._nodeModulePaths(process.cwd());
  m._compile(compiled.outputText, m.filename);
  const { validateRoof, integrateRoof } = m.exports;
  const input = { latitude: 42.18, longitude: 2.48, kwp: 5, tilt: 30, azimuth: -90 };
  assert.deepEqual(validateRoof(input), input);
  assert.throws(() => validateRoof({ ...input, tilt: 91 }));
  assert.throws(() => validateRoof({ ...input, kwp: 0 }));
  assert.throws(() => validateRoof({ ...input, azimuth: null }));
  for (const [day, count] of [['2026-09-16', 24], ['2026-03-29', 23], ['2026-10-25', 25]]) {
    const start = moment.tz(day, 'Europe/Madrid').unix();
    const times = Array.from({length: count}, (_, i) => start + (i + 1) * 3600);
    const result = integrateRoof(input, times, times.map(() => 500), day, day);
    assert.equal(result.daily[0].kwh, count * 2);
    assert.equal(integrateRoof(input, times, times.map(() => 0), day, day).daily[0].kwh, 0);
    assert.throws(() => integrateRoof(input, times, times.map((_, i) => i === 0 ? null : 500), day, day));
    assert.throws(() => integrateRoof(input, times.slice(1), times.slice(1).map(() => 500), day, day));
    assert.throws(() => integrateRoof(input, [...times, times[0]], [...times.map(() => 500), 500], day, day));
  }
  console.log('PASS: validation, physical energy units, zero irradiance, null/missing/duplicate intervals, 23/24/25-hour days');
  if (process.env.CHECK_OPEN_METEO === 'true') {
    const original = axios.get;
    axios.get = async (url, config) => { const response = await original(url, config); console.log('Open-Meteo HTTP', response.status); return response; };
    const result = await new m.exports.RoofSimulationService().simulate(input);
    assert.equal(result.daily.length, 6);
    assert.ok(result.daily.every(d => d.kwh >= 0));
    console.log(JSON.stringify({ liveDays: result.daily, model: result.model }));
  }
 } catch (e) { console.error('CHECK FAILED:', e.message); process.exitCode = 1; }
});


