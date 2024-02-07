import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { HttpResponse } from "../../../../../shared/infrastructure/http/HttpResponse";
import { CreateReportDTO } from "./DTOs/CreateReportDTO";
import { PrismaReportsRepository } from "../../repositories/prisma-reports-repository/prisma-reports-repository";
import { ReportDTOMapper } from "./DTOs/ReportDTOMapper";
import { QueryFilterDto } from "../../../../../shared/infrastructure/http/QueryFiltersDto";
import {
  FilterSchema,
  HttpUtils,
} from "../../../../../shared/infrastructure/http/HttpUtils";
import {
  BadRequestError,
  InfrastructureError,
} from "../../../../../shared/domain/error/common";
import { ByReportId } from "../../../domain/ByReportId";
import { ExecuteReportDTO } from "./DTOs/ExecuteReportDTO";
import { TextTemplateService } from "../../../../../shared/infrastructure/services/text-template.service";
import { MysqlService } from "../../../../../shared/infrastructure/services";
import { ReportParam, ReportParamTypes } from "../../../domain/report-param";
import * as moment from "moment";
import * as mysql from "mysql2";
import { HandlebarsViewsService } from "../../../../../shared/infrastructure/services/handlebars-views.service";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "../../../../auth/infrastructure/decorators";
import { Datatable } from "../../../../../shared/infrastructure/services/datatable/Datatable";

const filters: Array<FilterSchema> = [
  {
    field: "id",
    value: "integer",
  },
  {
    field: "name",
    value: "string",
  },
];

export const RESOURCE_NAME = "reports";

@Controller(RESOURCE_NAME)
@ApiTags(RESOURCE_NAME)
export class ReportsController {
  constructor(
    private reportsRepository: PrismaReportsRepository,
    private textTemplate: TextTemplateService,
    private mysqlService: MysqlService,
    private handlebarsService: HandlebarsViewsService,
    private datatable: Datatable
  ) {}

  @Get()
  @Auth(RESOURCE_NAME)
  async getReports(@Query() query: QueryFilterDto) {
    const criteria = HttpUtils.parseFiltersFromQueryFilters(query, filters);
    const reports = await this.reportsRepository.getReports(criteria);
    return HttpResponse.success("Reports fetched successfully").withData(
      reports.map(ReportDTOMapper.reportToDto)
    );
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async createReport(@Body() body: CreateReportDTO) {
    const report = ReportDTOMapper.dtoToReport(body);

    const savedReport = await this.reportsRepository.createReport(report);

    return HttpResponse.success("Report created successfully").withData(
      ReportDTOMapper.reportToDto(savedReport)
    );
  }

  @Put(":id")
  @Auth(RESOURCE_NAME)
  async updateReport(
    @Param("id") requestId: string,
    @Body() body: CreateReportDTO
  ) {
    const report = ReportDTOMapper.dtoToReport(body);
    const parsedId = parseInt(requestId);
    if (!parsedId) {
      throw new BadRequestError("Id must be a number");
    }

    report.id = parsedId;

    const updatedReport = await this.reportsRepository.updateReport(report);

    return HttpResponse.success("Report updated successfully").withData(
      ReportDTOMapper.reportToDto(updatedReport)
    );
  }

  @Delete()
  @Auth(RESOURCE_NAME)
  async deleteReport(@Query() query: QueryFilterDto) {
    const criteria = HttpUtils.parseFiltersFromQueryFilters(query, filters);
    await this.reportsRepository.deleteReport(criteria);
    return HttpResponse.success("Reports removed successfully");
  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async reportsDatatables(@Body() body: any) {
    const data = this.datatable.getData(body, `SELECT id, name FROM reports`);
    return HttpResponse.success("Reports fetched successfully").withData(data);
  }

  /**
   * Gets report data and returns the corresponding entries
   */
  @Post("execute/:id")
  @Auth(RESOURCE_NAME)
  async executeReport(
    @Param("id") requestedId: string,
    @Body() body: ExecuteReportDTO
  ) {
    const reports = await this.reportsRepository.getReports(
      new ByReportId(parseInt(requestedId))
    );
    const desiredReport = reports[0];
    if (!desiredReport) {
      // TODO create report not found error
      throw new BadRequestError("Report not found");
    }

    this.validateParams(body.parameters, desiredReport.params);

    const fullSql = this.textTemplate.parse(desiredReport.sql, body.parameters);
    const data = this.datatable.getData(body.datatables, fullSql);
    return HttpResponse.success("Report executed successfully").withData(data);
  }

  @Post("data/:id")
  @Auth(RESOURCE_NAME)
  async getReportData(@Param("id") requestedId: string, @Body() params: any) {
    const reports = await this.reportsRepository.getReports(
      new ByReportId(parseInt(requestedId))
    );
    const desiredReport = reports[0];
    if (!desiredReport) {
      // TODO create report not found error
      throw new BadRequestError("Report not found");
    }

    this.validateParams(params, desiredReport.params);

    const fullSql = this.textTemplate.parse(desiredReport.sql, params);
    let rows;
    try {
      rows = await this.mysqlService.pool.query(fullSql);
    } catch (err) {
      throw new InfrastructureError("Error getting report data").withMetadata(
        err
      );
    }

    return HttpResponse.success("report data collected successfully").withData(
      rows[0]
    );
  }

  @Get("render/:id")
  @Auth(RESOURCE_NAME)
  async renderReport(@Param("id") requestedId: string, @Query() params: any) {
    const reports = await this.reportsRepository.getReports(
      new ByReportId(parseInt(requestedId))
    );
    const desiredReport = reports[0];
    if (!desiredReport) {
      // TODO create report not found error
      throw new BadRequestError("Report not found");
    }

    this.validateParams(params, desiredReport.params);

    const fullSql = this.textTemplate.parse(desiredReport.sql, params);
    let rows;
    try {
      rows = await this.mysqlService.pool.query<mysql.RowDataPacket[]>(fullSql);
    } catch (err) {
      throw new InfrastructureError("Error getting report data").withMetadata(
        err
      );
    }

    // Parsing dates
    const data = rows[0].map((row) => {
      const parsedRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        if (value instanceof Date) {
          parsedRow[key] = moment(value).format("YYYY-MM-DD HH:mm");
          continue;
        }

        parsedRow[key] = value;
      }
      return parsedRow;
    });

    const content = await this.handlebarsService.renderView(
      "reports/base-template.hbs",
      {
        data,
        columns: desiredReport.columns,
      }
    );

    return HttpResponse.success("Report rendered successfully").withData(
      content
    );
  }

  validateParams(parameters: any, reportParams: ReportParam[]) {
    // Validate params
    for (const param of reportParams) {
      const parameter = parameters[param.name];
      if (!parameter) {
        throw new BadRequestError(
          `Param '${param.name}' of type ${param.type} required`
        );
      }

      let parsedParameter: number;
      switch (param.type) {
        case ReportParamTypes.DECIMAL:
          parsedParameter = parseFloat(parameter);
          if (!parsedParameter) {
            throw new BadRequestError(`'${param.name}' is not a number`);
          }
          break;
        case ReportParamTypes.INTEGER:
          parsedParameter = parseInt(parameter);
          if (!parsedParameter) {
            throw new BadRequestError(`'${param.name}' is not a number`);
          }
          if (Math.floor(parsedParameter) !== parsedParameter) {
            throw new BadRequestError(
              `'${param.name}' is not an integer number`
            );
          }
          break;
        case ReportParamTypes.DATE:
          if (typeof parameter !== "string") {
            throw new BadRequestError(`'${param.name}' is not a string`);
          }
          const date = moment(parameter, "YYYY-MM-DD HH:mm");
          if (!date.isValid()) {
            throw new BadRequestError(`'${param.name}' is not a valid date`);
          }
          break;
        case ReportParamTypes.STRING:
          if (typeof parameter !== "string") {
            throw new BadRequestError(`'${param.name}' is not a string`);
          }
          break;
        case ReportParamTypes.BOOLEAN:
          if (typeof parameter !== "boolean") {
            throw new BadRequestError(`'${param.name}' is not a boolean`);
          }
          break;
      }
    }
  }
}
