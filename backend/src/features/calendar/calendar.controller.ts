import { Controller, Post, Get, Delete, Put, Body, Param } from '@nestjs/common';
import { HttpResponse } from 'src/shared/infrastructure/http/HttpResponse';
import { PrismaService } from 'src/shared/infrastructure/services/prisma-service/prisma-service';
import { MysqlService } from 'src/shared/infrastructure/services/mysql-service/mysql.service';
import { Datatable } from 'src/shared/infrastructure/services/datatable/Datatable';
import { SaveCalendarDTO } from './save-calendar-dto';
import * as moment from 'moment';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/features/auth/infrastructure/decorators';

export const RESOURCE_NAME = 'calendar';

@ApiTags(RESOURCE_NAME)
@Controller('calendar')
export class CalendarController {
  constructor(
    private prisma: PrismaService,
    private datatable: Datatable
  ) {}

  @Get()
  @Auth(RESOURCE_NAME)
  async get() {
    const data = await this.prisma.calendar.findMany();
    const mappedData = data.map(this.mapData)
    return HttpResponse.success('calendar fetched successfully').withData(data);
  }

  @Get(':id')
  @Auth(RESOURCE_NAME)
  async getById(@Param('id') id: string) {
    const data = await this.prisma.calendar.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('calendar fetched successfully').withData(this.mapData(data));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveCalendarDTO) {
    const data = await this.prisma.calendar.create({ data: body });
    return HttpResponse.success('calendar saved successfully').withData(data);
  }

  @Put(':id')
  @Auth(RESOURCE_NAME)
  async update(@Param('id') id: string, @Body() body: SaveCalendarDTO) {
    const data = await this.prisma.calendar.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body
    });
    return HttpResponse.success('calendar updated successfully').withData(data);
  }

  @Delete(':id')
  @Auth(RESOURCE_NAME)
  async remove(@Param('id') id: string) {
    const data = await this.prisma.calendar.delete({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('calendar removed successfully').withData(data);
  }

  @Post('datatable')
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(body, `SELECT id, day,weekday,day_type,festive_type,festivity
                  FROM calendar`);
    return HttpResponse.success('Datatables fetched successfully').withData(data);
  }

  mapData(data: any) {
    const mappedData: any = {};
      mappedData.day = data.day
      mappedData.weekday = data.weekday
      mappedData.dayType = data.dayType
      mappedData.festiveType = data.festiveType
      mappedData.festivity = data.festivity
    return mappedData;
  }
}
