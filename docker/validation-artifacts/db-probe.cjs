const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{
console.log('processes',await p.$queryRawUnsafe('SHOW PROCESSLIST'));
console.log('indexes',await p.$queryRawUnsafe('SHOW INDEX FROM energy_hourly'));
console.log('cups',await p.cups.findMany({where:{communityId:7,active:true},select:{id:true,type:true}}));
console.log('roofs',await p.energyArea.findMany({where:{id:{in:[3103,3104]}},select:{id:true,cadastralReference:true,m2:true,locationId:true}}));
})().finally(()=>p.$disconnect());
