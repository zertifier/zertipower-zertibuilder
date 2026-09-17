import { BadRequestException, Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { PrismaService } from '../../../../shared/infrastructure/services/prisma-service/prisma-service';
import { dailyConsumptionSamples } from './local-consumption.service';

export function consumptionProfile(groups: {date:string;consumption:number}[][], member:boolean) {
  const samples=groups.flat();
  if (!samples.length) {
    const monthlyKwh=[260,230,220,190,170,160,150,150,180,210,230,250];
    return {source:'estimate-no-history', label:'Consum estimat de la calculadora; no hi ha dades introduïdes.',
      monthlyKwh, annualKwh:monthlyKwh.reduce((sum,value)=>sum+value,0), observedDays:0, historyFrom:null,historyTo:null};
  }
  // Prefer the member's latest complete calendar year when actually present.
  const years=[...new Set(samples.map(s=>s.date.slice(0,4)))].sort().reverse();
  for (const year of member ? years : []) {
    const days=samples.filter(s=>s.date.startsWith(year));
    if (days.length===moment.utc(year+'-12-31').dayOfYear()) {
      const monthlyKwh=Array.from({length:12},(_,m)=>Number(days.filter(d=>Number(d.date.slice(5,7))===m+1).reduce((n,d)=>n+d.consumption,0).toFixed(2)));
      return {source:'member-measured-history',label:`Consum mesurat del membre: any ${year}.`,monthlyKwh,
        annualKwh:Number(monthlyKwh.reduce((a,b)=>a+b,0).toFixed(2)),observedDays:days.length,historyFrom:days[0].date,historyTo:days[days.length-1].date};
    }
  }
  // Every observed member has equal weight. Missing months use that member's observed daily average.
  const monthlyKwh=Array.from({length:12},(_,m)=> {
    const means=groups.filter(g=>g.length).map(g=>{
      const matching=g.filter(d=>Number(d.date.slice(5,7))===m+1);
      const data=matching.length?matching:g;
      return data.reduce((n,d)=>n+d.consumption,0)/data.length;
    });
    return Number((means.reduce((a,b)=>a+b,0)/means.length * moment.utc([moment.utc().year(),m]).daysInMonth()).toFixed(2));
  });
  const dates=samples.map(s=>s.date).sort();
  return {source:member?'estimate-member-history':'estimate-community-history',
    label:member?'Estimació anualitzada amb l’històric disponible del membre.':'Estimació per habitatge amb l’històric comunitari; sense comptador associat a aquesta coberta.',
    monthlyKwh,annualKwh:Number(monthlyKwh.reduce((a,b)=>a+b,0).toFixed(2)),observedDays:samples.length,
    observedPoints:groups.filter(g=>g.length).length,historyFrom:dates[0],historyTo:dates[dates.length-1]};
}
@Injectable()
export class CalculatorConsumptionService {
  constructor(private prisma:PrismaService) {}
  async get(communityId:number,cupsId?:number): Promise<ReturnType<typeof consumptionProfile> & {cupsId?:number|null}> {
    if (!Number.isSafeInteger(communityId)||communityId<=0||
        (cupsId!==undefined&&(!Number.isSafeInteger(cupsId)||cupsId<=0))) throw new BadRequestException('Invalid consumption selection');
    const cups=await this.prisma.cups.findMany({where:{communityId,active:true,type:{in:['consumer','prosumer']}},select:{id:true}});
    if (cupsId!==undefined&&!cups.some(c=>c.id===cupsId)) throw new BadRequestException('Consumption point is not active in this community');
    const groups: {date:string;consumption:number}[][]=[];
    const ids=cupsId===undefined?cups.map(c=>c.id):[cupsId];
    for(const id of ids) {
      const latest=await this.prisma.energyHourly.findFirst({where:{cupsId:id,kwhIn:{not:null},infoDt:{lt:new Date()}},orderBy:{infoDt:'desc'},select:{infoDt:true}});
      if(!latest?.infoDt) continue;
      // Include the latest complete year when available, plus the current partial year.
      const from=moment.utc(latest.infoDt).subtract(1,'year').startOf('year').toDate();
      const rows=await this.prisma.energyHourly.findMany({where:{cupsId:id,infoDt:{gte:from,lte:latest.infoDt}},select:{infoDt:true,kwhIn:true},orderBy:{infoDt:'asc'}});
      const days=dailyConsumptionSamples(rows);if(days.length) groups.push(days);
    }
    if(cupsId===undefined&&!groups.length&&cups.length) {
      // A roof without an associated CUPS still gets the community's measured
      // profile when available. This is an estimate and remains labelled as
      // such; the generic 300 kWh fallback is only used when this has no data.
      const rows=await this.prisma.energyHourly.findMany({where:{cupsId:{in:cups.map(c=>c.id)},kwhIn:{not:null}},select:{cupsId:true,infoDt:true,kwhIn:true},orderBy:{infoDt:'desc'},take:50000});
      const byDate=new Map<string,number>();
      for(const row of rows){ if(!row.infoDt||row.kwhIn==null) continue; const key=moment.utc(row.infoDt).format('YYYY-MM-DD'); byDate.set(key,(byDate.get(key)||0)+Number(row.kwhIn)); }
      const communitySamples=[...byDate].map(([date,consumption])=>({date,consumption}));
      if(communitySamples.length) return {...consumptionProfile([communitySamples],false),cupsId:null};
    }
    if(cupsId!==undefined&&!groups.length) {
      const fallback=await this.get(communityId);
      return {...fallback,label:'El membre no té històric complet. '+fallback.label};
    }
    return {...consumptionProfile(groups,cupsId!==undefined),cupsId:cupsId??null};
  }
}
