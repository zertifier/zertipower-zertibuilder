const assert = require('node:assert/strict');
const ts = require('typescript'); const Module = require('module');
let text = '';process.stdin.on('data', d => text += d);
process.stdin.on('end', async () => {
 const {PrismaClient} = require('@prisma/client'); const prisma = new PrismaClient();
 try {
  const m = new Module(process.cwd() + '/local-consumption-check.js', module);
  m.filename = process.cwd() + '/local-consumption-check.js'; m.paths = Module._nodeModulePaths(process.cwd());
  const original = m.require.bind(m);
  m.require = name => name.includes('prisma-service') ? { PrismaService: class {} } : original(name);
  m._compile(ts.transpileModule(text, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText,m.filename);
  const {dailyConsumptionSamples,estimateConsumption,LocalConsumptionService}=m.exports;
  const rows=Array.from({length:24},(_,h)=>({infoDt:new Date(Date.UTC(2025,7,18,h)),kwhIn:1}));
  assert.equal(dailyConsumptionSamples(rows)[0].consumption,24);
  assert.equal(dailyConsumptionSamples(rows.slice(1)).length,0);
  assert.equal(dailyConsumptionSamples([...rows,rows[0]]).length,0);
  assert.equal(dailyConsumptionSamples(rows.map((r,i)=>({...r,kwhIn:i===0?null:1}))).length,0);
  assert.equal(dailyConsumptionSamples(rows.map(r=>({...r,kwhIn:0})))[0].consumption,0);
  assert.equal(estimateConsumption([{date:'2025-08-18',consumption:600},{date:'2025-08-11',consumption:800}], '2026-09-21'),700);
  assert.throws(()=>estimateConsumption([], '2026-09-21'));
  console.log('PASS: complete days, duplicates, missing values, valid zero, same-weekday averages, no /1000 heuristic');
  const result=await new LocalConsumptionService(prisma).community(7,'2026-09-16','2026-09-21');
  assert.equal(result.length,6);console.log(JSON.stringify(result));
 }catch(e){console.error('CHECK FAILED:',e.message);process.exitCode=1}finally{await prisma.$disconnect()}
});
