import { CommunitySolarRoofStoreService } from './community-solar-roof-store.service';

describe('selected calculator roof persistence', () => {
  const record = { communityId: 7, energyAreaId: 3103, roofReference: 'alias',
    latitude: 42.18, longitude: 2.47, areaM2: 60, tilt: 25, azimuth: 0, panelCount: 18, kwp: 8 };
  let prisma: any, store: CommunitySolarRoofStoreService;
  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({customer_id: 2}) },
      shares: { findFirst: jest.fn().mockResolvedValue({id: 10}) },
      communities: { findUnique: jest.fn().mockResolvedValue({locationId: 1}) },
      energyArea: { findUnique: jest.fn().mockResolvedValue({id: 3103, locationId: 1, cadastralReference: 'canonical', kWhInversor: null}) },
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      $queryRawUnsafe: jest.fn().mockResolvedValue([{customerId: 2}]),
    };
    store = new CommunitySolarRoofStoreService(prisma);
  });
  it('persists the exact selected configuration without requiring or estimating inverter power', async () => {
    const result = await store.save(record, 9);
    expect(result).toEqual({...record, roofReference: 'canonical', customerId: 2, inverterPowerKw: null});
    expect(prisma.shares.findFirst).toHaveBeenCalledWith({where: {customerId: 2, communityId: 7, status: 'ACTIVE'}, select: {id: true}});
    const insert = prisma.$executeRawUnsafe.mock.calls.find((call: any[]) => call[0].includes('INSERT INTO'));
    expect(insert.slice(1)).toEqual([7, 2, 'canonical', 42.18, 2.47, 60, 25, 0, 18, 8, 3103, null]);
    expect(insert[0]).toContain('IF(customer_id=VALUES(customer_id)');
  });
  it('uses a stored nameplate rating or an explicitly entered rating', async () => {
    prisma.energyArea.findUnique.mockResolvedValue({id: 3103, locationId: 1, cadastralReference: 'canonical', kWhInversor: 7});
    expect((await store.save(record, 9)).inverterPowerKw).toBe(7);
    expect((await store.save({...record, inverterPowerKw: 6}, 9)).inverterPowerKw).toBe(6);
  });
  it('rejects non-members and roofs outside the selected community location before writing', async () => {
    prisma.shares.findFirst.mockResolvedValue(null);
    await expect(store.save(record, 9)).rejects.toThrow('not an active');
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
    prisma.shares.findFirst.mockResolvedValue({id: 10});
    prisma.communities.findUnique.mockResolvedValue({locationId: 2});
    await expect(store.save(record, 9)).rejects.toThrow('community location');
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });
  it('rejects attempts to replace another member’s configuration', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([{customerId: 99}]);
    await expect(store.save(record, 9)).rejects.toThrow('another participant');
  });
  it('lists only saved rows in the requested community, without retrieving location geometries', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([{...record, roofReference: 'canonical', customerId: 2, inverterPowerKw: null}]);
    expect(await store.list(7)).toHaveLength(1);
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('FROM member_solar_configurations WHERE community_id = ?'), 7);
    expect(prisma.energyArea.findUnique).not.toHaveBeenCalled();
    expect(prisma.communities.findUnique).not.toHaveBeenCalled();
  });
});
