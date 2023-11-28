import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/services';
import { Report } from '../../../domain/report';
import {
  InfrastructureError,
  InvalidArgumentError,
} from '../../../../../shared/domain/error/common';
import { Criteria } from '../../../../../shared/domain/criteria/Criteria';
import {
  toPrismaFilters,
  toPrismaSorting,
} from '../../../../../shared/infrastructure/prisma/criteria';
import { DateValueObject } from '../../../../../shared/domain/value-object';

@Injectable()
export class PrismaReportsRepository {
  constructor(private prisma: PrismaService) {}

  async getReports(criteria: Criteria): Promise<Array<Report>> {
    const reports = new Array<Report>();
    let result;
    try {
      result = await this.prisma.report.findMany({
        where: toPrismaFilters(criteria),
        orderBy: toPrismaSorting(criteria),
        take: criteria.limit.value || undefined,
        skip: criteria.offset.value || undefined,
      });
    } catch (err) {
      throw new InfrastructureError('Error getting reports').withMetadata(err);
    }

    for (const resultElement of result) {
      reports.push({
        name: resultElement.name,
        sql: resultElement.sql,
        params: JSON.parse(resultElement.params),
        columns: JSON.parse(resultElement.columns),
        id: resultElement.id,
        updatedAt: new DateValueObject(resultElement.updated_at),
        createdAt: new DateValueObject(resultElement.created_at),
      });
    }

    return reports;
  }

  async createReport(report: Report): Promise<Report> {
    let result;
    try {
      result = await this.prisma.report.create({
        data: {
          columns: JSON.stringify(report.columns),
          params: JSON.stringify(report.params),
          name: report.name,
          sql: report.sql,
        },
        select: {
          id: true,
          params: true,
          sql: true,
          name: true,
          columns: true,
          created_at: true,
          updated_at: true,
        },
      });
    } catch (err) {
      throw new InfrastructureError('Error creating report').withMetadata(err);
    }

    return {
      id: result.id,
      params: JSON.parse(result.params),
      columns: JSON.parse(result.columns),
      sql: report.sql,
      name: report.name,
      createdAt: new DateValueObject(result.created_at),
      updatedAt: new DateValueObject(result.updated_at),
    };
  }

  async updateReport(report: Report): Promise<Report> {
    if (!report.id) {
      throw new InvalidArgumentError('Report id not defined');
    }

    let result;
    try {
      result = await this.prisma.report.update({
        where: {
          id: report.id,
        },
        data: {
          name: report.name,
          sql: report.sql,
          params: JSON.stringify(report.params),
          columns: JSON.stringify(report.columns),
        },
      });
    } catch (err) {
      throw new InfrastructureError('Error updating report').withMetadata(err);
    }

    return {
      id: result.id,
      name: result.name,
      sql: result.sql,
      columns: JSON.parse(result.columns),
      params: JSON.parse(result.params),
      createdAt: new DateValueObject(result.created_at),
      updatedAt: new DateValueObject(result.updated_at),
    };
  }

  async deleteReport(criteria: Criteria): Promise<void> {
    try {
      await this.prisma.report.deleteMany({
        where: toPrismaFilters(criteria),
      });
    } catch (err) {
      throw new InfrastructureError('Error removing report').withMetadata(err);
    }
  }
}
