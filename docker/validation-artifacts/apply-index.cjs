const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
p.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS energy_hourly_cups_info_dt ON energy_hourly (cups_id, info_dt)').then(()=>console.log('History index ready')).finally(()=>p.$disconnect());
