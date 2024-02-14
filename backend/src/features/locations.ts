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
@Controller("locations")
export class LocationsController {

    private conn: mysql.Pool;
    
    constructor(
      private prisma: PrismaService,
      private datatable: Datatable,
      private mysql: MysqlService
    ) {
      this.conn = this.mysql.pool;
    }
  
    @Get()
    @Auth(RESOURCE_NAME)
    async getLocations() {
        try{
            const query = `SELECT * FROM locations`
            const [ROWS]: any[] = await this.conn.query(query);
            return HttpResponse.success("locations fetched successfully").withData(
              ROWS
            );
          } catch (e:any) {
            console.log("error getting locations", e);
            return HttpResponse.failure;
        }
    }

}
   