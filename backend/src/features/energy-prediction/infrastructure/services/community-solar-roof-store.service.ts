import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/services/prisma-service/prisma-service';
import { RoofInput, validateRoof } from './roof-simulation.service';

export interface CommunityRoofRecord extends RoofInput {
  communityId: number;
  roofReference: string;
  areaM2: number;
  panelCount: number;
}
export interface OwnedCommunityRoof extends CommunityRoofRecord { customerId: number; }

@Injectable()
export class CommunitySolarRoofStoreService {
  private ready?: Promise<void>;
  constructor(private prisma: PrismaService) {}

  private ensureTable() {
    // Separate from legacy, unowned community_solar_roofs. Never infer ownership.
    if (!this.ready) {
      this.ready = this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS member_solar_configurations (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          community_id INT NOT NULL,
          customer_id INT NOT NULL,
          roof_reference VARCHAR(100) NOT NULL,
          latitude DOUBLE NOT NULL, longitude DOUBLE NOT NULL,
          area_m2 DOUBLE NOT NULL, tilt DOUBLE NOT NULL, azimuth DOUBLE NOT NULL,
          panel_count INT NOT NULL, kwp DOUBLE NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY community_roof (community_id, roof_reference),
          INDEX member (community_id, customer_id),
          FOREIGN KEY (community_id) REFERENCES communities(id),
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `).then(() => undefined).catch(error => { this.ready = undefined; throw error; });
    }
    return this.ready;
  }

  private validate(raw: CommunityRoofRecord): CommunityRoofRecord {
    if (!raw || !Number.isSafeInteger(raw.communityId) || raw.communityId <= 0 ||
        typeof raw.roofReference !== 'string' || !raw.roofReference.trim() || raw.roofReference.length > 100 ||
        typeof raw.areaM2 !== 'number' || !Number.isFinite(raw.areaM2) || raw.areaM2 <= 0 ||
        !Number.isSafeInteger(raw.panelCount) || raw.panelCount <= 0) {
      throw new BadRequestException('Invalid calculator configuration');
    }
    return { ...validateRoof(raw), communityId: raw.communityId,
      roofReference: raw.roofReference.trim(), areaM2: raw.areaM2, panelCount: raw.panelCount };
  }

  async customerForUser(userId: number, communityId: number): Promise<number> {
    if (!Number.isSafeInteger(communityId) || communityId <= 0) throw new BadRequestException('Invalid community ID');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { customer_id: true } });
    if (!user?.customer_id) throw new ForbiddenException('User has no customer account');
    const membership = await this.prisma.shares.findFirst({
      where: { customerId: user.customer_id, communityId, status: 'ACTIVE' }, select: { id: true },
    });
    if (!membership) throw new ForbiddenException('User is not an active community participant');
    return user.customer_id;
  }

  async save(raw: CommunityRoofRecord, userId: number) {
    const record = this.validate(raw);
    const customerId = await this.customerForUser(userId, record.communityId);
    await this.ensureTable();
    // Conditional upsert is atomic: another participant cannot replace the owner or its data.
    const fields = ['latitude', 'longitude', 'area_m2', 'tilt', 'azimuth', 'panel_count', 'kwp'];
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO member_solar_configurations
        (community_id, customer_id, roof_reference, latitude, longitude, area_m2, tilt, azimuth, panel_count, kwp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE ${fields.map(field =>
        `${field}=IF(customer_id=VALUES(customer_id),VALUES(${field}),${field})`).join(', ')}
    `, record.communityId, customerId, record.roofReference, record.latitude, record.longitude,
      record.areaM2, record.tilt, record.azimuth, record.panelCount, record.kwp);
    const owner = await this.prisma.$queryRawUnsafe<{ customerId: number }[]>(
      'SELECT customer_id customerId FROM member_solar_configurations WHERE community_id=? AND roof_reference=?',
      record.communityId, record.roofReference);
    if (Number(owner[0]?.customerId) !== customerId) throw new ConflictException('Roof already belongs to another participant');
    return { ...record, customerId };
  }

  async list(communityId: number): Promise<OwnedCommunityRoof[]> {
    if (!Number.isSafeInteger(communityId) || communityId <= 0) throw new BadRequestException('Invalid community ID');
    await this.ensureTable();
    const rows = await this.prisma.$queryRawUnsafe<OwnedCommunityRoof[]>(`
      SELECT community_id communityId, customer_id customerId, roof_reference roofReference,
        latitude, longitude, area_m2 areaM2, tilt, azimuth, panel_count panelCount, kwp
      FROM member_solar_configurations WHERE community_id = ? ORDER BY id
    `, communityId);
    return rows.map(row => ({ ...this.validate(row), customerId: Number(row.customerId) }));
  }

  async remove(communityId: number, roofReference: string, userId: number) {
    const customerId = await this.customerForUser(userId, communityId);
    if (typeof roofReference !== 'string' || !roofReference.trim()) throw new BadRequestException('Invalid roof reference');
    await this.ensureTable();
    await this.prisma.$executeRawUnsafe(
      'DELETE FROM member_solar_configurations WHERE community_id=? AND customer_id=? AND roof_reference=?',
      communityId, customerId, roofReference.trim());
  }
}
