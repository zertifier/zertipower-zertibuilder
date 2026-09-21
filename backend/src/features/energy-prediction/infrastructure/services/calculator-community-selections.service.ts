import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/services/prisma-service/prisma-service';
import { RoofInput, validateRoof } from './roof-simulation.service';
export interface CalculatorSelection extends RoofInput {
  communityId: number; energyAreaId: number; roofReference: string; areaM2: number; panelCount: number; memberId?: number | null;
  monthlyGenerationKwh?: number[]; monthlyConsumptionKwh?: number[];
  calculatorValues?: Record<string, number>;
  consumptionSource?: string; consumptionLabel?: string; consumptionCupsId?: number | null;
  source?: 'simulation' | 'member';
}
@Injectable()
export class CalculatorCommunitySelectionsService {
  private ready?: Promise<unknown>;
  constructor(private prisma: PrismaService) {}
  private ensureTable() {
    if (!this.ready) this.ready = this.prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS calculator_community_selections (
 community_id INT NOT NULL, energy_area_id INT NOT NULL, configuration_json LONGTEXT NOT NULL,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (community_id, energy_area_id),
 FOREIGN KEY (community_id) REFERENCES communities(id),
 FOREIGN KEY (energy_area_id) REFERENCES energy_areas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`).catch(e => {this.ready=undefined; throw e;});
    return this.ready;
  }
  private id(value: number) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new BadRequestException('Invalid selection ID');
  }
  async save(raw: CalculatorSelection) {
    this.id(raw.communityId); this.id(raw.energyAreaId);
    const input = validateRoof(raw);
    if (raw.areaM2 == null || raw.panelCount == null) throw new BadRequestException('Missing calculator surface or panels');
    const community = await this.prisma.communities.findUnique({where:{id:raw.communityId}});
    const area = await this.prisma.energyArea.findUnique({where:{id:raw.energyAreaId}});
    if (!area || !community || community.locationId == null || area.locationId !== community.locationId) {
      throw new BadRequestException('Selected area does not belong to the community location');
    }
    const record: CalculatorSelection = { ...input, areaM2:raw.areaM2, panelCount:raw.panelCount,
      communityId:raw.communityId, energyAreaId:raw.energyAreaId,
      roofReference:area.cadastralReference || area.reference || String(area.id) };
    for (const field of ['monthlyGenerationKwh','monthlyConsumptionKwh'] as const) {
      const values=raw[field];
      if (values !== undefined) {
        if (!Array.isArray(values) || values.length!==12 || values.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0)) {
          throw new BadRequestException('Invalid monthly calculator values');
        }
        record[field]=values;
      }
    }
    if (raw.calculatorValues !== undefined) {
      if (!raw.calculatorValues || typeof raw.calculatorValues !== 'object' || Array.isArray(raw.calculatorValues)) {
        throw new BadRequestException('Invalid calculator values');
      }
      record.calculatorValues = {};
      for (const key of ['valle', 'llano', 'punta', 'vallePrice', 'llanoPrice', 'puntaPrice', 'generationPrice', 'totalCost', 'yearlySavings']) {
        const value = raw.calculatorValues[key];
        if (value === undefined) continue;
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new BadRequestException('Invalid calculator value: ' + key);
        record.calculatorValues[key] = value;
      }
    }
    record.consumptionSource = String(raw.consumptionSource || 'unspecified').slice(0,80);
    record.consumptionLabel = String(raw.consumptionLabel || '').slice(0,500);
    record.source = raw.source === 'member' ? 'member' : 'simulation';
    if (raw.consumptionCupsId != null) {
      this.id(raw.consumptionCupsId);
      const cup=await this.prisma.cups.findFirst({where:{id:raw.consumptionCupsId,communityId:raw.communityId}});
      if (!cup) throw new BadRequestException('Consumption point is outside this community');
      record.consumptionCupsId=raw.consumptionCupsId;
      record.memberId = (await this.prisma.cups.findUnique({where:{id:raw.consumptionCupsId},select:{customerId:true}}))?.customerId ?? null;
    }
    if (raw.memberId != null) {
      this.id(raw.memberId);
      const member = await this.prisma.shares.findFirst({where:{communityId:raw.communityId,customerId:raw.memberId,status:'ACTIVE'},select:{id:true}});
      if (!member) throw new BadRequestException('Member is not active in this community');
      record.memberId = raw.memberId;
    }
    await this.ensureTable();
    await this.prisma.$executeRawUnsafe(`INSERT INTO calculator_community_selections
      (community_id,energy_area_id,configuration_json) VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE configuration_json=VALUES(configuration_json)`,record.communityId,record.energyAreaId,JSON.stringify(record));
    return record;
  }
  async list(communityId:number):Promise<CalculatorSelection[]> {
    this.id(communityId); await this.ensureTable();
    const rows=await this.prisma.$queryRawUnsafe<{configuration_json:string}[]>(
      'SELECT configuration_json FROM calculator_community_selections WHERE community_id=? ORDER BY energy_area_id',communityId);
    return rows.map(row=>JSON.parse(row.configuration_json));
  }
  async remove(communityId:number,energyAreaId:number) {
    this.id(communityId);this.id(energyAreaId);await this.ensureTable();
    await this.prisma.$executeRawUnsafe('DELETE FROM calculator_community_selections WHERE community_id=? AND energy_area_id=?',communityId,energyAreaId);
  }
}
