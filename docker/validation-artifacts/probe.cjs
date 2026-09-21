const fs=require('fs');
(async()=>{for(const p of ['/roof-simulation/community-selections?community=7','/energy-prediction?community=7','/roof-simulation/calculator-consumption?community=7','/energy-prediction/community/7/consumption?start_date=2026-09-18&end_date=2026-09-23']) {
 const r=await fetch('http://localhost:3000'+p); console.log(p,r.status,await r.text());
}})().catch(e=>{console.error(e);process.exit(1)});
