const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{for(const q of [
 'SHOW TABLES',
 'SHOW CREATE TABLE community_solar_roofs',
 'SELECT * FROM community_solar_roofs WHERE community_id=7',
 'SELECT * FROM member_solar_configurations WHERE community_id=7',
 "SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND COLUMN_NAME IN ('customer_id','community_id','energy_area_id','roof_reference') ORDER BY TABLE_NAME"
 ,"SELECT c.id,c.name,c.email,COUNT(DISTINCT cp.id) cups,MAX(cp.address) address FROM customers c LEFT JOIN cups cp ON cp.customer_id=c.id AND cp.community_id=7 WHERE c.id IN (SELECT customer_id FROM shares WHERE community_id=7 AND status='ACTIVE') GROUP BY c.id"
 ,"SELECT * FROM community_solar_roofs"
 ]){try{console.log(JSON.stringify(await p.$queryRawUnsafe(q)))}catch(e){console.log('ERROR',e.message)}}})().finally(()=>p.$disconnect());
