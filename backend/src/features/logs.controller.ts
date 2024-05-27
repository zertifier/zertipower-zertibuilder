import {
    Controller,
    Post,
    Get,
    Delete,
    Put,
    Body,
    Param,
    Query,
  } from "@nestjs/common";
  import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
  import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
  import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
  import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
  import { ApiTags } from "@nestjs/swagger";
  import { Auth } from "src/features/auth/infrastructure/decorators";
  import mysql from "mysql2/promise";
  export const RESOURCE_NAME = "locations";
  
@ApiTags(RESOURCE_NAME)
@Controller("energyRegistersLogs")
export class LogsController {

    private conn: mysql.Pool;
    
    constructor(
      private prisma: PrismaService,
      private datatable: Datatable,
      private mysql: MysqlService
    ) {
      this.conn = this.mysql.pool;
    }
  
    @Get()
    async Logs() {
        try{
            const query = `SELECT * FROM logs`
            const [ROWS]: any[] = await this.conn.query(query);
            return HttpResponse.success("locations fetched successfully").withData(
              ROWS
            );
          } catch (e:any) {
            console.log("error getting locations", e);
            return HttpResponse.failure;
        }
    }

    @Post("datatable")
    @Auth(RESOURCE_NAME)
    async datatables(@Body() body: any) {
      const data = await this.datatable.getData(
        body,
        `SELECT * FROM logs`
      );
      return HttpResponse.success("Datatables fetched successfully").withData(
        data
      );
    }

    @Get(":id")
    @Auth(RESOURCE_NAME)
    async getById(@Param("id") id: string) {
      const data = await this.prisma.log.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      return HttpResponse.success("cups fetched successfully").withData(data)
      
    }

}
