const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
(async()=>{for(const q of [
 "SELECT MIN(kwh_in) min_kwh,MAX(kwh_in) max_kwh,AVG(kwh_in) avg_kwh,COUNT(*) row_count FROM energy_hourly eh JOIN cups c ON c.id=eh.cups_id WHERE c.community_id=7 AND c.active=1 AND c.type IN ('consumer','prosumer') AND eh.kwh_in IS NOT NULL",
 "SELECT cups_id,DATE(info_dt) day,COUNT(*) n,COUNT(DISTINCT HOUR(info_dt)) hours FROM energy_hourly eh JOIN cups c ON c.id=eh.cups_id WHERE c.community_id=7 AND c.active=1 AND c.type IN ('consumer','prosumer') AND eh.kwh_in IS NOT NULL GROUP BY cups_id,DATE(info_dt) HAVING n<>hours OR hours<>24 LIMIT 20",
 "SELECT COUNT(DISTINCT c.customer_id) members,COUNT(DISTINCT c.id) supplies,COUNT(DISTINCT CASE WHEN eh.cups_id IS NOT NULL THEN c.customer_id END) members_with_history FROM cups c LEFT JOIN energy_hourly eh ON eh.cups_id=c.id AND eh.kwh_in IS NOT NULL WHERE c.community_id=7 AND c.active=1 AND c.type IN ('consumer','prosumer')"
 ]) console.log(JSON.stringify(await p.$queryRawUnsafe(q),(_,v)=>typeof v==='bigint'?Number(v):v));})().finally(()=>p.$disconnect());
