import { Report } from '../../../../domain/report';
import { CreateReportDTO } from './CreateReportDTO';
import { ReportResponseDTO } from './ReportResponseDTO';
import { InvalidArgumentError } from '../../../../../../shared/domain/error/common';

export class ReportDTOMapper {
  public static dtoToReport(dto: CreateReportDTO): Report {
    return {
      columns: dto.columns,
      name: dto.name,
      sql: dto.sql,
      params: dto.params,
    };
  }

  public static reportToDto(report: Report): ReportResponseDTO {
    if (!report.id) {
      throw new InvalidArgumentError('Report must have id');
    }

    if (!report.createdAt || !report.updatedAt) {
      throw new InvalidArgumentError(
        'Report must have creation and modification dates',
      );
    }

    const response = new ReportResponseDTO();
    response.name = report.name;
    response.sql = report.sql;
    response.columns = report.columns;
    response.params = report.params;
    response.id = report.id;
    response.createdAt = report.createdAt.toUtcDateTimeString();
    response.updatedAt = report.updatedAt.toUtcDateTimeString();

    return response;
  }
}
