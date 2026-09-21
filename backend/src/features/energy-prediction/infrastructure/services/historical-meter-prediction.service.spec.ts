import { HistoricalMeterPredictionService } from './historical-meter-prediction.service';
import * as moment from 'moment-timezone';

describe('meter prediction calendar window', () => {
  it.each(['2026-09-18', '2025-08-17', '2026-12-29'])('predicts six days starting on %s with no training leakage', async (reference) => {
    const base = moment.utc(reference);
    const rows = Array.from({ length: 24 * 14 }, (_, i) => ({
      infoDt: base.clone().subtract(14, 'days').add(i, 'hours').toDate(), production: 2,
    }));
    // A large observation on D0 must never enter the training window.
    const allRows = [...rows, { infoDt: base.toDate(), production: 99999 }];
    const findMany = jest.fn(async ({ where }) => allRows.filter(row =>
      where.infoDt.lt ? row.infoDt < where.infoDt.lt : row.infoDt >= where.infoDt.gte && row.infoDt <= where.infoDt.lte));
    const prisma = { energyHourly: { findMany, findFirst: jest.fn().mockResolvedValue(allRows[allRows.length - 1]) } };
    const result = await new HistoricalMeterPredictionService(prisma as any).predict(1, reference);
    expect(result.data.map(point => point.time.slice(0, 10))).toEqual(
      Array.from({ length: 6 }, (_, i) => base.clone().add(i, 'days').format('YYYY-MM-DD')));
    expect(result.data.map(point => point.value)).toEqual(Array(6).fill(48));
    expect(result.leakageCutoff).toBe(base.clone().subtract(1, 'day').format('YYYY-MM-DD'));
    expect(result.history.last).toEqual(rows[rows.length - 1].infoDt);
  });
});
