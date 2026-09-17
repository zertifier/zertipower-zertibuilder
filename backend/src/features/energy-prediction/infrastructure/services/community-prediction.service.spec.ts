import { CommunityPredictionService } from './community-prediction.service';
import { consumptionProfile } from './calculator-consumption.service';
import * as moment from 'moment-timezone';

describe('calculator selected community prediction',()=>{
 const roof={communityId:7,energyAreaId:1,roofReference:'one',latitude:42,longitude:2,areaM2:120,panelCount:36,kwp:16,tilt:25,azimuth:0};
 const roofs={getMemberRoofs:jest.fn()};const solar={simulate:jest.fn()};
 const service=new CommunityPredictionService(roofs as any,solar as any);
 beforeEach(()=>{
  roofs.getMemberRoofs.mockResolvedValue({roofs:[{...roof,memberId:14}],membersTotal:1,membersActive:1,completeRoofs:1,estimatedRoofs:0,discardedRoofs:0,discarded:[]});
  solar.simulate.mockReset();
  solar.simulate.mockImplementation(async (input,window)=>{
   const hourly=Array.from({length:144},(_,i)=>({time:moment.tz(window.start,'Europe/Madrid').add(i,'hours').format(),value:input.kwp/24}));
   return {input,hourly,daily:Array.from({length:6},(_,i)=>({date:moment.utc(window.start).add(i,'days').format('YYYY-MM-DD'),kwh:input.kwp}))};
  });
 });
 it('sums every selected capacity and returns exactly D+1 through D+6 without inverter or historical input',async()=>{
  roofs.getMemberRoofs.mockResolvedValue({roofs:[{...roof,memberId:14},{...roof,memberId:14},{...roof,memberId:19,energyAreaId:2,roofReference:'two',kwp:8}],membersTotal:2,membersActive:2,completeRoofs:3,estimatedRoofs:0,discardedRoofs:0,discarded:[]});
  const result=await service.details(7);
  expect(result.forecast).toHaveLength(6);expect(result.forecast.map(p=>p.value)).toEqual(Array(6).fill(24));
  expect(solar.simulate).toHaveBeenCalledTimes(2);
  expect(result.start).toBe(moment.tz('Europe/Madrid').add(1,'day').format('YYYY-MM-DD'));
  expect(result.end).toBe(moment.tz('Europe/Madrid').add(6,'days').format('YYYY-MM-DD'));
  expect(roofs.getMemberRoofs).toHaveBeenCalledWith(7);
 });
 it('has no fallback to the municipality catalogue',async()=>{
  roofs.getMemberRoofs.mockResolvedValue({roofs:[],membersTotal:2,membersActive:2,completeRoofs:0,estimatedRoofs:0,discardedRoofs:1,discarded:[{reason:'unattributed'}]});expect(await service.predict(7)).toEqual([]);expect(solar.simulate).not.toHaveBeenCalled();
 });
 it('rejects duplicates with conflicting physical data',async()=>{
  roofs.getMemberRoofs.mockResolvedValue({roofs:[{...roof,memberId:14},{...roof,memberId:14,kwp:7}],membersTotal:1,membersActive:1,completeRoofs:2,estimatedRoofs:0,discardedRoofs:0,discarded:[]});await expect(service.predict(7)).rejects.toThrow('Conflicting');
 });
 it('never returns a partial community if the weather provider fails',async()=>{
  solar.simulate.mockRejectedValue(new Error('weather unavailable'));await expect(service.predict(7)).rejects.toThrow('weather unavailable');
 });
});
describe('calculator consumption provenance',()=>{
 it('uses the measured complete year, preserving month and annual sums',()=>{
  const days=Array.from({length:365},(_,i)=>({date:moment.utc('2025-01-01').add(i,'day').format('YYYY-MM-DD'),consumption:4}));
  const result=consumptionProfile([days],true);expect(result.source).toBe('member-measured-history');
  expect(result.monthlyKwh[0]).toBe(124);expect(result.annualKwh).toBe(1460);
 });
 it('explicitly marks partial historical annualization as estimated',()=>{
  const result=consumptionProfile([[{date:'2025-08-01',consumption:4}]],true);
  expect(result.source).toBe('estimate-member-history');expect(result.annualKwh).toBe(result.monthlyKwh.reduce((a,b)=>a+b,0));
 });
 it('only uses the old fallback when no observations exist and labels it',()=>{
  const result=consumptionProfile([],false);expect(result.source).toBe('estimate-no-history');expect(result.label).toContain('Estimació');
 });
});
