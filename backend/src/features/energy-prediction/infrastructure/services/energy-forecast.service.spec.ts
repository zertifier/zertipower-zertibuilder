import { EnergyForecastService } from './energy-forecast.service';

describe('solar production API adapter', () => {
  const originalEnv = { ...process.env };
  let service: EnergyForecastService;
  let get: jest.Mock;
  const response = () => ({
    dies: Array.from({ length: 7 }, (_, index) => {
      const date = `2026-09-${15 + index}`;
      return { data: date, hores: [
        { data_hora: date + 'T00:00', previsio_solar_kwh: 0 },
        { data_hora: date + 'T12:00', previsio_solar_kwh: 2.345 },
      ] };
    }),
  });

  beforeEach(() => {
    process.env.SOLAR_API_AUTH_CODE = 'test-only';
    process.env.SOLAR_INSTALLATIONS_JSON = '{}';
    service = new EnergyForecastService();
    get = jest.fn();
    (service as any).httpClient = { get };
  });
  afterEach(() => { process.env = { ...originalEnv }; });

  it('keeps kWh unchanged, includes night zeroes and requests all seven local dates', async () => {
    get.mockResolvedValue({ data: response() });
    const installation = service.getInstallation({ id: 1, lat: 42, lng: 2 });
    const result = await service.getProductionForecast(installation, '2026-09-15', '2026-09-21');
    expect(result[0]).toEqual({ time: '2026-09-15T00:00', value: 0 });
    expect(result[1]).toEqual({ time: '2026-09-15T12:00', value: 2.345 });
    expect(result[result.length - 1].time).toBe('2026-09-21T12:00');
    expect(get.mock.calls[0][1]).toEqual(expect.objectContaining({
      headers: { authcode: 'test-only' },
      params: expect.objectContaining({
        data_inici: '2026-09-15', data_final: '2026-09-21', kwp: 7.22,
        preu_punta_eur_kwh: 0.18, preu_pla_eur_kwh: 0.12, preu_vall_eur_kwh: 0.08,
      }),
    }));
  });

  it('uses CUPS coordinates and permits per-installation overrides', () => {
    process.env.SOLAR_INSTALLATIONS_JSON = '{"1":{"kwp":12,"azimut":0}}';
    expect(service.getInstallation({ id: 1, lat: 0, lng: 0 })).toEqual(expect.objectContaining({
      kwp: 12, latitud: 0, longitud: 0, azimut: 0,
    }));
    expect(service.getInstallation({ id: 1, lat: 0, lng: 0 }).orientacio).toBeUndefined();
  });

  it('uses Montolivet coordinates when its CUPS has no location', () => {
    expect(service.getInstallation({ id: 46, lat: null, lng: null },
      { lat: 42.181703, lng: 2.477629 })).toEqual(expect.objectContaining({
      latitud: 42.181703, longitud: 2.477629, kwp: 7.22,
    }));
  });

  it('prefers the installation location and never mixes coordinate sources', () => {
    const community = { lat: 42, lng: 2 };
    expect(service.getInstallation({ id: 46, lat: 41, lng: 1 }, community))
      .toEqual(expect.objectContaining({ latitud: 41, longitud: 1 }));
    expect(service.getInstallation({ id: 46, lat: 41, lng: null }, community))
      .toEqual(expect.objectContaining({ latitud: 42, longitud: 2 }));
    process.env.SOLAR_INSTALLATIONS_JSON = '{"46":{"latitud":40,"longitud":0,"kwp":15}}';
    expect(service.getInstallation({ id: 46, lat: 41, lng: 1 }, community))
      .toEqual(expect.objectContaining({ latitud: 40, longitud: 0, kwp: 15 }));
    process.env.SOLAR_INSTALLATIONS_JSON = '{"46":{"latitud":40}}';
    expect(() => service.getInstallation({ id: 46, lat: null, lng: null }, community))
      .toThrow('Configure both');
  });

  it('rejects a two-day response instead of presenting a partial seven-day forecast', async () => {
    get.mockResolvedValue({ data: { dies: response().dies.slice(0, 2) } });
    await expect(service.getProductionForecast(service.getInstallation({ id: 1, lat: null, lng: null }),
      '2026-09-15', '2026-09-21')).rejects.toThrow('does not cover');
  });

  it('does not turn missing readings or API failures into zero generation', async () => {
    const data = response();
    (data.dies[0].hores[0] as any).previsio_solar_kwh = null;
    get.mockResolvedValue({ data });
    const installation = service.getInstallation({ id: 1, lat: null, lng: null });
    await expect(service.getProductionForecast(installation, '2026-09-15', '2026-09-21'))
      .rejects.toThrow('Invalid solar forecast hour');
    get.mockRejectedValue(new Error('private request information'));
    await expect(service.getProductionForecast(installation, '2026-09-15', '2026-09-21'))
      .rejects.toThrow('Solar forecast API request failed');
  });
});
