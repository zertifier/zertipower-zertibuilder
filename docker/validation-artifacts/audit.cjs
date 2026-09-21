const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();const fs=require('fs');
(async()=>{
const cups=await p.cups.findMany({where:{communityId:7},select:{id:true,active:true,type:true}});
const shares=await p.shares.findMany({where:{communityId:7,status:'ACTIVE'},select:{customerId:true}});
const audit={cups,activeShareCustomers:new Set(shares.map(s=>s.customerId)).size,activeShares:shares.length};
for(const [name,path] of Object.entries({consumption:'/energy-prediction/community/7/consumption?start_date=2026-09-18&end_date=2026-09-23',calculator:'/roof-simulation/calculator-consumption?community=7',member:'/roof-simulation/calculator-consumption?community=7&cups=16'})){
 const start=Date.now();const r=await fetch('http://localhost:3000'+path);audit[name]={elapsedMs:Date.now()-start,response:await r.json()};
}
fs.writeFileSync('/src/consumption-audit.json',JSON.stringify(audit,null,2));console.log(JSON.stringify(audit));
})().finally(()=>p.$disconnect());
