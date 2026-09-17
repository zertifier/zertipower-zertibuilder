import { Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { PrismaService } from '../../../../shared/infrastructure/services/prisma-service/prisma-service';

export interface MeterBacktestPoint { time: string; value: number; }

/** Historical time-series predictor for the individual meter platform. */
@Injectable()
export class HistoricalMeterPredictionService {
  constructor(private prisma: PrismaService) {}

  async predict(cupsId: number, referenceDate?: string, allowHistoricalFallback = false) {
    const mode = process.env.HISTORICAL_VALIDATION_MODE === 'true';
    const configured = process.env.HISTORICAL_REFERENCE_DATE;
    const ref = referenceDate || (mode ? configured : undefined) || moment.utc().format('YYYY-MM-DD');
    if (!moment.utc(ref, 'YYYY-MM-DD', true).isValid()) throw new Error('Invalid historical reference date');
    const start = moment.utc(ref).add(1, 'day').format('YYYY-MM-DD');
    const end = moment.utc(ref).add(6, 'days').format('YYYY-MM-DD');
    const history = await this.prisma.energyHourly.findMany({
      where: { cupsId, production: { not: null }, infoDt: { lte: moment.utc(ref).endOf('day').toDate() } },
      select: { infoDt: true, production: true }, orderBy: { infoDt: 'asc' },
    });
    if (history.length < 24 * 7) throw new Error('Insufficient historical meter data');
    const latest = await this.prisma.energyHourly.findFirst({ where: { cupsId, production: { not: null } }, orderBy: { infoDt: 'desc' }, select: { infoDt: true } });
    if (!allowHistoricalFallback && !mode && !referenceDate && (!latest?.infoDt || moment.utc(latest.infoDt).isBefore(moment.utc().subtract(7, 'days')))) return { mode: 'current', referenceDate: null, data: [], history: { first: history[0].infoDt, last: latest?.infoDt, records: history.length } };
    const byKey = new Map<string, number[]>();
    for (const row of history) {
      if (!row.infoDt || row.production == null) continue;
      const d = moment.utc(row.infoDt); const key = `${d.day()}-${d.hour()}`;
      const values = byKey.get(key) || []; values.push(Number(row.production)); byKey.set(key, values);
    }
    const prediction: MeterBacktestPoint[] = [];
    for (let d = moment.utc(start); d.format('YYYY-MM-DD') <= end; d.add(1, 'day')) {
      let total = 0;
      for (let h = 0; h < 24; h++) {
        const values = byKey.get(`${d.day()}-${h}`) || [];
        total += values.length ? values.slice(-8).reduce((a, b) => a + b, 0) / Math.min(values.length, 8) : 0;
      }
      prediction.push({ time: d.clone().add(12, 'hours').toISOString(), value: Number(total.toFixed(2)) });
    }
    const actualRows = await this.prisma.energyHourly.findMany({ where: { cupsId, production: { not: null }, infoDt: { gte: moment.utc(start).toDate(), lte: moment.utc(end).endOf('day').toDate() } }, select: { infoDt: true, production: true } });
    const actual = new Map<string, number>();
    for (const row of actualRows) if (row.infoDt && row.production != null) { const key = moment.utc(row.infoDt).format('YYYY-MM-DD'); actual.set(key, (actual.get(key) || 0) + Number(row.production)); }
    const comparison = prediction.map(point => { const day = moment.utc(point.time).format('YYYY-MM-DD'); const real = Number((actual.get(day) || 0).toFixed(2)); return { date: day, prediction: point.value, real, error: Number((point.value - real).toFixed(2)) }; });
    const errors = comparison.map(x => x.prediction - x.real); const mae = errors.reduce((a, x) => a + Math.abs(x), 0) / errors.length; const rmse = Math.sqrt(errors.reduce((a, x) => a + x * x, 0) / errors.length); const nonZero = comparison.filter(x => x.real !== 0); const mape = nonZero.length ? nonZero.reduce((a, x) => a + Math.abs(x.error / x.real), 0) / nonZero.length * 100 : null;
    return { mode: mode || referenceDate ? 'historical-backtest' : 'current', referenceDate: ref, data: prediction, history: { first: history[0].infoDt, last: history[history.length - 1].infoDt, records: history.length }, comparison, metrics: { mae: Number(mae.toFixed(4)), rmse: Number(rmse.toFixed(4)), mape: mape == null ? null : Number(mape.toFixed(2)) }, leakageCutoff: ref };
  }

  async predictCommunity(communityId: number, referenceDate?: string) {
    const cups = await this.prisma.cups.findMany({ where: { communityId, active: true, type: { in: ['consumer', 'prosumer'] } }, select: { id: true } });
    const members = await Promise.all(cups.map(async cup => { try { return await this.predict(cup.id, referenceDate, true); } catch { return null; } }));
    const valid = members.filter(Boolean) as any[];
    if (!valid.length) return { mode: 'current', referenceDate: null, data: [], membersTotal: cups.length, membersWithHistory: 0 };
    const totals = new Map<string, number>();
    for (const result of valid) for (const point of result.data) totals.set(point.time, (totals.get(point.time) || 0) + point.value);
    const data = [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([time, value]) => ({ time, value: Number(value.toFixed(2)) }));
    const comparisons = data.map(point => ({ date: moment.utc(point.time).format('YYYY-MM-DD'), prediction: point.value }));
    return { mode: valid[0].mode, referenceDate: valid[0].referenceDate, data, membersTotal: cups.length, membersWithHistory: valid.length,
      membersWithoutHistory: cups.length - valid.length, comparisons, source: 'historical-meter-community-sum' };
  }
}
