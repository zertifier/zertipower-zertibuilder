import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
import { SaveEnergyRegistersHourlyDto } from "./save-energy-registers-hourly-dto";
import { ApiTags } from "@nestjs/swagger";
import { Auth } from "src/features/auth/infrastructure/decorators";
import { ErrorCode } from "../../shared/domain/error";
import mysql from "mysql2/promise";
import { MysqlService } from "../../shared/infrastructure/services";

export const RESOURCE_NAME = "energyRegistersHourly";

@ApiTags(RESOURCE_NAME)
@Controller("energy-registers-hourly")
export class EnergyRegistersHourlyController {
  private conn: mysql.Pool;
  constructor(
    private prisma: PrismaService,
    private datatable: Datatable,
    private mysql: MysqlService
  ) {
    this.conn = this.mysql.pool;
  }

  @Get('/monthly/:year')
  @Auth(RESOURCE_NAME)
  async getCups(@Param('year') year: string) {
    try {
      const { year } = req.params;
      const { cups, wallet, community } = req.query;
      let query:any;
      let registers:any
      let monthsName:string[] = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ]
      let yearlyRegisters = []
      let defaultMonth = {month:'',import:0,generation:0}

      if (cups) {
        query = `SELECT month, import, generation
                               FROM energy_registers_original_monthly
                               WHERE cups_id = ?
                                 AND year = ?
                                 order by month`
      }else if(community){
        query = `SELECT month, import, generation
                            FROM energy_registers_original_monthly
                            LEFT JOIN cups c ON cups_id = c.id
                            WHERE c.community_id = ?
                            AND year = ?
                            ORDER BY month`
      }else if(wallet){
        //todo
      }

      const [ROWS] = await dbConnection.query(
        query,
        [community || cups || wallet , year])
      registers = ROWS;

      for(let i= 0;i<monthsName.length;i++) {

        let monthData = registers.find(register =>
          monthsName.indexOf(monthsName[i]) +1 === register.month
        )
        if (monthData) {
          monthData.month = monthsName[i]
          yearlyRegisters.push(monthData)
        } else {
          defaultMonth.month = monthsName[i]
          yearlyRegisters.push({...defaultMonth})
        }
      }

      return HttpResponse.success('customers fetched successfully').withData(yearlyRegisters);
    } catch(e){
      console.log("error getting energy");
    }
  }

  @Post("datatable")
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    try{
      const data = await this.datatable.getData(body, `SELECT
                                                            info_datetime,
                                                            cups_id,
                                                            import,
                                                            consumption,
                                                            export,
                                                            generation
                                                     FROM energy_registers_hourly`);
      return HttpResponse.success("Datatables fetched successfully").withData(data);
    }catch(e){
      console.log("Error datatables: ",e);
      return HttpResponse.failure(
        'error getting datatables data',
        ErrorCode.UNEXPECTED
      );
    }

  }

  mapData(data: any) {
    const mappedData: any = {};
    mappedData.cupsId = data.cupsId;
    mappedData.infoDatetime = data.infoDatetime;
    mappedData.import = data.import;
    mappedData.consumption = data.consumption;
    mappedData.export = data.export;
    mappedData.generation = data.generation;
    return mappedData;
  }
}
