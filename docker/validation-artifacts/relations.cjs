const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
 const queries={
  community:`SELECT id,name,location_id,cups_number FROM communities WHERE id=7`,
  cups:`SELECT id,customer_id,community_id,active,type,reference,lat,lng FROM cups WHERE community_id=7 ORDER BY id`,
  shares:`SELECT id,customer_id,status,shares FROM shares WHERE community_id=7 ORDER BY customer_id`,
  configs:`SELECT * FROM member_solar_configurations WHERE community_id=7 ORDER BY id`,
  selections:`SELECT * FROM calculator_community_selections WHERE community_id=7 ORDER BY energy_area_id`,
  refs:`SELECT c.id cups_id,c.customer_id,c.reference,c.lat cups_lat,c.lng cups_lng,e.id energy_area_id,e.cadastral_reference,e.reference energy_reference,e.m2,e.inclination,e.kWh_p,e.n_plaques,e.kWh_inversor FROM cups c LEFT JOIN energy_areas e ON e.cadastral_reference=c.reference OR e.reference=c.reference WHERE c.community_id=7 AND c.active=1 AND c.type IN ('consumer','prosumer')`,
  columns:`SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND (COLUMN_NAME LIKE '%roof%' OR COLUMN_NAME LIKE '%solar%' OR COLUMN_NAME LIKE '%energy_area%' OR COLUMN_NAME LIKE '%cadastral%') ORDER BY TABLE_NAME,COLUMN_NAME`
 };
 for(const [k,q] of Object.entries(queries)){try{console.log('\n'+k,JSON.stringify(await p.$queryRawUnsafe(q)))}catch(e){console.log('\n'+k+' ERROR',e.message)}}
})().finally(()=>p.$disconnect());
