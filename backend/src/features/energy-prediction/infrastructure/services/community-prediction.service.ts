import { BadGatewayException, Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { CommunityMemberRoofsService } from './community-member-roofs.service';
import { RoofSimulationService, validateRoof } from './roof-simulation.service';
@Injectable()
export class CommunityPredictionService {
  constructor(private roofs:CommunityMemberRoofsService,private solar:RoofSimulationService) {}
  async details(communityId:number) {
    const resolved=await this.roofs.getMemberRoofs(communityId);
    const unique=new Map<number,typeof resolved.roofs[number]>();
    for(const roof of resolved.roofs) {
      validateRoof(roof);
      const previous=unique.get(roof.energyAreaId);
      if(previous && ['latitude','longitude','kwp','tilt','azimuth'].some(k=>(previous as any)[k] !== (roof as any)[k])) {
        throw new BadGatewayException('Conflicting selected roof configurations');
      }
      unique.set(roof.energyAreaId,roof);
    }
    const start=moment.tz('Europe/Madrid').add(1,'day').format('YYYY-MM-DD');
    const end=moment.tz(start,'Europe/Madrid').add(5,'days').format('YYYY-MM-DD');
    const totals=new Map<string,number>();let expected:string[]|undefined;
    const predictions=[];
    for(const roof of unique.values()) {
      // No production cache shared between different capacities or geometries.
      const prediction=await this.solar.simulate(roof,{start,end});
      const times=prediction.hourly.map(p=>p.time);
      if(new Set(times).size!==times.length || (expected && (times.length!==expected.length||times.some((t,i)=>t!==expected![i])))) {
        throw new BadGatewayException('Selected roofs returned different forecast intervals');
      }
      expected=times;
      for(const p of prediction.hourly) totals.set(p.time,(totals.get(p.time)||0)+p.value);
      predictions.push({energyAreaId:roof.energyAreaId,roofReference:roof.roofReference,source:roof.source || 'member',memberId:roof.memberId,
        input:prediction.input,daily:prediction.daily});
    }
    const daily=new Map<string,number>();
    for(const [time,value] of totals) {const date=moment.parseZone(time).format('YYYY-MM-DD');daily.set(date,(daily.get(date)||0)+value);}
    if(unique.size && daily.size!==6) throw new BadGatewayException('Incomplete six-day community forecast');
    const forecast=[...daily].sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({time:moment.tz(date+'T12:00:00','Europe/Madrid').format(),value:Number(value.toFixed(2))}));
    return {...resolved, forecast,predictions,selectedRoofs:unique.size,predictorRequests:predictions.length,
      source:'calculator-gti-v1',weatherSource:'Open-Meteo',performanceRatio:0.8,
      assumptions:['No inverter clipping; inverter rating not provided','No local shading model'],start,end};
  }
  async predict(communityId:number) {return (await this.details(communityId)).forecast;}
}
