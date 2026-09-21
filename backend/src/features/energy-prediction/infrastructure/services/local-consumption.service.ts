import { BadRequestException, Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { PrismaService } from '../../../../shared/infrastructure/services/prisma-service/prisma-service';

export interface ConsumptionObservation { infoDt: Date | null; kwhIn: number | null; }
export function dailyConsumptionSamples(records: ConsumptionObservation[]) {
  const days = new Map<string, { total: number; hours: Set<number>; invalid: boolean }>();
  for (const record of records) {
    if (!record.infoDt || !Number.isFinite(record.infoDt.getTime())) continue;
    const date = record.infoDt.toISOString().slice(0, 10);
    const day = days.get(date) ?? { total: 0, hours: new Set<number>(), invalid: false };
    const hour = record.infoDt.getUTCHours();
    if (day.hours.has(hour) || record.kwhIn == null || !Number.isFinite(record.kwhIn) || record.kwhIn < 0 || record.infoDt.getUTCMinutes() !== 0) day.invalid = true;
    day.hours.add(hour);
    if (record.kwhIn != null && Number.isFinite(record.kwhIn) && record.kwhIn >= 0) day.total += record.kwhIn;
    days.set(date, day);
  }
  // Imported SQL timestamps are treated as stored calendar days. Reject incomplete/duplicate days.
  return [...days].filter(([, d]) => !d.invalid && d.hours.size === 24)
    .map(([date, d]) => ({ date, consumption: d.total })).sort((a, b) => a.date.localeCompare(b.date));
}

export function estimateConsumption(samples: { date: string; consumption: number }[], date: string) {
  const weekday = moment.utc(date).day();
  const matching = samples.filter(s => moment.utc(s.date).day() === weekday).slice(-8);
  if (!matching.length) throw new BadRequestException('Insufficient complete historical days for ' + date);
  return matching.reduce((sum, day) => sum + day.consumption, 0) / matching.length;
}

@Injectable()
export class LocalConsumptionService {
  constructor(private prisma: PrismaService) {}
  async community(communityId: number, startDate: string, endDate: string) {
    if (!Number.isSafeInteger(communityId) || communityId <= 0 ||
        !moment.utc(startDate, 'YYYY-MM-DD', true).isValid() || !moment.utc(endDate, 'YYYY-MM-DD', true).isValid() ||
        startDate > endDate || moment.utc(endDate).diff(moment.utc(startDate), 'days') > 6) throw new BadRequestException('Invalid consumption prediction range');
    const cups = await this.prisma.cups.findMany({ where: { communityId, active: true, type: { in: ['consumer', 'prosumer'] } }, select: { id: true, customerId: true } });
    if (!cups.length) throw new BadRequestException('No active community members');
    const activeShares = await this.prisma.shares.findMany({ where: { communityId, status: 'ACTIVE', customerId: { not: null } }, select: { customerId: true } });
    const memberIds = [...new Set(activeShares.map(row => Number(row.customerId)).filter(id => Number.isSafeInteger(id) && id > 0))];
    const memberSet = new Set(memberIds);
    const memberCups = new Map<number, number[]>();
    for (const cup of cups) {
      if (cup.customerId == null || !memberSet.has(cup.customerId)) continue;
      const ids = memberCups.get(cup.customerId) ?? []; ids.push(cup.id); memberCups.set(cup.customerId, ids);
    }
    const latest = await this.prisma.energyHourly.groupBy({ by: ['cupsId'],
      where: { cupsId: { in: cups.map(c => c.id) }, kwhIn: { not: null }, infoDt: { lt: moment.utc(startDate).toDate() } },
      _max: { infoDt: true },
    });
    const cutoffByCups = new Map(latest.filter(row => row._max.infoDt != null).map(row => [row.cupsId!, row._max.infoDt!]));
    if (!cutoffByCups.size) throw new BadRequestException('No community consumption history');
    const earliest = Math.min(...[...cutoffByCups.values()].map(date => moment.utc(date).startOf('day').subtract(55, 'days').valueOf()));
    const rows = await this.prisma.energyHourly.findMany({ where: { cupsId: { in: cups.map(c => c.id) },
      infoDt: { gte: new Date(earliest), lt: moment.utc(startDate).toDate() } },
      select: { cupsId: true, infoDt: true, kwhIn: true }, orderBy: { infoDt: 'asc' } });
    const grouped = new Map<number, ConsumptionObservation[]>();
    for (const row of rows) {
      const cutoff = cutoffByCups.get(row.cupsId!);
      if (!cutoff || !row.infoDt || row.infoDt < moment.utc(cutoff).startOf('day').subtract(55, 'days').toDate() || row.infoDt > cutoff) continue;
      const records = grouped.get(row.cupsId!) ?? [];
      records.push(row); grouped.set(row.cupsId!, records);
    }
    const memberSamples: { memberId: number; samples: { date: string; consumption: number }[] }[] = [];
    const missingMemberIds: number[] = [];
    for (const memberId of memberIds) {
      const cupIds = memberCups.get(memberId) ?? [];
      const perCup = cupIds.map(cupId => dailyConsumptionSamples(grouped.get(cupId) ?? []));
      const byDate = new Map<string, number>();
      const completeDates = perCup.length ? perCup.reduce((set, samples) => {
        const dates = new Set(samples.map(sample => sample.date));
        return new Set([...set].filter(date => dates.has(date)));
      }, new Set(perCup[0].map(sample => sample.date))) : new Set<string>();
      for (const samples of perCup) for (const sample of samples) if (completeDates.has(sample.date)) byDate.set(sample.date, (byDate.get(sample.date) ?? 0) + sample.consumption);
      const samples = [...byDate].map(([date, consumption]) => ({ date, consumption })).sort((a, b) => a.date.localeCompare(b.date));
      if (!samples.length) { missingMemberIds.push(memberId); continue; }
      memberSamples.push({ memberId, samples });
    }
    if (!memberSamples.length) throw new BadRequestException('No complete community consumption days');
    const historyFrom = memberSamples.map(s => s.samples[0].date).sort()[0];
    const historyTo = memberSamples.map(s => s.samples[s.samples.length - 1].date).sort().reverse()[0];
    const result: { date: string; consumption: number; source: string; historyFrom: string; historyTo: string;
      members: number; supplies: number; observedMembers: number; estimatedMembers: number; missingCupsIds: number[]; duplicateMemberIds: number[] }[] = [];
    for (const date = moment.utc(startDate); date.format('YYYY-MM-DD') <= endDate; date.add(1, 'day')) {
      const key = date.format('YYYY-MM-DD');
      const observedTotal = memberSamples.reduce((sum, member) => sum + estimateConsumption(member.samples, key), 0);
      // Members without usable history are represented by the observed per-member average.
      const communityTotal = observedTotal / memberSamples.length * memberIds.length;
      result.push({ date: key, consumption: Number(communityTotal.toFixed(2)),
        source: 'local-historical-community-estimate', historyFrom, historyTo, members: memberIds.length, supplies: cups.length,
        observedMembers: memberSamples.length, estimatedMembers: missingMemberIds.length,
        missingCupsIds: [...new Set(cups.filter(cup => cup.customerId == null || missingMemberIds.includes(cup.customerId)).map(cup => cup.id))],
        duplicateMemberIds: [...memberCups].filter(([, ids]) => ids.length > 1).map(([memberId]) => memberId) });
    }
    return result;
  }
}
