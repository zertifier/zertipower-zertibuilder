const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const get=async path=>{const r=await fetch('http://localhost:3000'+path);assert.equal(r.status,200);return r.json();};
 const endpoint=await get('/energy-prediction?community=7');
 const legacy=await get('/roof-simulation/community?community=7');
 const selections=await get('/roof-simulation/community-selections?community=7');
 assert.equal(endpoint.data.length,6);assert.equal(legacy.data.roofsSimulated,2);
 assert.deepEqual(legacy.data.forecast,endpoint.data);
 assert.deepEqual(selections.data.map(r=>r.energyAreaId),[3103,3104]);
 assert.ok(selections.data.every(r=>Number.isFinite(r.calculatorValues.yearlySavings)));
 fs.writeFileSync('/src/final-check.json',JSON.stringify({endpoint,legacy,selections},null,2));
 console.log('PASS: final endpoint, legacy endpoint uses only two selections, persisted calculator savings');
})().catch(e=>{console.error(e);process.exit(1)});
