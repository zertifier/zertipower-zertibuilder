export interface EnergyBalanceMonth {
  production: number;
  consumption: number;
  selfConsumption: number;
  export: number;
  import: number;
}

export interface EnergyBalance {
  months: EnergyBalanceMonth[];
  annual: EnergyBalanceMonth;
  source: 'hourly' | 'monthly-profile-estimate';
}

/** Apply min/max at hourly resolution. Monthly inputs use an explicit profile estimate. */
export function calculateEnergyBalance(production: number[], consumption: number[], hourlyProduction?: number[][], hourlyConsumption?: number[][]): EnergyBalance {
  if (production.length !== 12 || consumption.length !== 12) throw new Error('Energy balance requires twelve months');
  const hourly = !!hourlyProduction && !!hourlyConsumption && hourlyProduction.length === 12 && hourlyConsumption.length === 12;
  const months = production.map((generated, month) => {
    const p = hourly ? hourlyProduction![month] : daylightProfile(generated);
    const c = hourly ? hourlyConsumption![month] : Array(24).fill(consumption[month] / 24);
    if (!p.length || p.length !== c.length) throw new Error('Hourly profiles must have equal length');
    let selfConsumption = 0, exported = 0, imported = 0;
    for (let i = 0; i < p.length; i++) {
      const pv = Math.max(0, Number(p[i]) || 0), load = Math.max(0, Number(c[i]) || 0);
      selfConsumption += Math.min(pv, load);
      exported += Math.max(pv - load, 0);
      imported += Math.max(load - pv, 0);
    }
    return { production: round(generated), consumption: round(consumption[month]), selfConsumption: round(selfConsumption), export: round(exported), import: round(imported) };
  });
  const annual = months.reduce((sum, m) => ({ production: sum.production + m.production, consumption: sum.consumption + m.consumption,
    selfConsumption: sum.selfConsumption + m.selfConsumption, export: sum.export + m.export, import: sum.import + m.import }),
    { production: 0, consumption: 0, selfConsumption: 0, export: 0, import: 0 });
  return { months, annual: Object.fromEntries(Object.entries(annual).map(([k, v]) => [k, round(v)])) as unknown as EnergyBalanceMonth,
    source: hourly ? 'hourly' : 'monthly-profile-estimate' };
}

function daylightProfile(total: number): number[] {
  const weights = Array.from({ length: 24 }, (_, hour) => hour >= 6 && hour <= 18 ? Math.max(0, Math.sin((hour - 6) / 12 * Math.PI)) : 0);
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map(weight => total * weight / sum);
}
function round(value: number) { return Number(value.toFixed(2)); }
