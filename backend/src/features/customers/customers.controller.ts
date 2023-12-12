import { Controller, Post, Get, Delete, Put, Body, Param } from '@nestjs/common';
import { HttpResponse } from 'src/shared/infrastructure/http/HttpResponse';
import { PrismaService } from 'src/shared/infrastructure/services/prisma-service/prisma-service';
import { MysqlService } from 'src/shared/infrastructure/services/mysql-service/mysql.service';
import { Datatable } from 'src/shared/infrastructure/services/datatable/Datatable';
import { SaveCustomersDTO } from './save-customers-dto';
import * as moment from 'moment';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/features/auth/infrastructure/decorators';
import mysql from "mysql2/promise";
export const RESOURCE_NAME = 'customers';

@ApiTags(RESOURCE_NAME)
@Controller('customers')
export class CustomersController {
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
  async get() {
    const data = await this.prisma.customers.findMany();
    const mappedData = data.map(this.mapData)
    return HttpResponse.success('customers fetched successfully').withData(data);
  }

  @Get('/cups')
  @Auth(RESOURCE_NAME)
  async getCups(@Param('cups') cups: string) {
    try {
      let url = `SELECT * FROM cups LEFT JOIN customers on cups.customer_id = customers.id`;
      const data = await this.conn.query(url);
      return HttpResponse.success('customers fetched successfully').withData(data);
    } catch(e){
      console.log("error getting customers-cups");
    }
  }

  @Get(':id')
  @Auth(RESOURCE_NAME)
  async getById(@Param('id') id: string) {
    const data = await this.prisma.customers.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('customers fetched successfully').withData(this.mapData(data));
  }

  @Post()
  @Auth(RESOURCE_NAME)
  async create(@Body() body: SaveCustomersDTO) {
    const data = await this.prisma.customers.create({ data: body });
    return HttpResponse.success('customers saved successfully').withData(data);
  }

  @Put(':id')
  @Auth(RESOURCE_NAME)
  async update(@Param('id') id: string, @Body() body: SaveCustomersDTO) {
    const data = await this.prisma.customers.updateMany({
      where: {
        id: parseInt(id),
      },
      data: body
    });
    return HttpResponse.success('customers updated successfully').withData(data);
  }

  @Delete(':id')
  @Auth(RESOURCE_NAME)
  async remove(@Param('id') id: string) {
    const data = await this.prisma.customers.delete({
      where: {
        id: parseInt(id)
      }
    });
    return HttpResponse.success('customers removed successfully').withData(data);
  }

  @Post('datatable')
  @Auth(RESOURCE_NAME)
  async datatables(@Body() body: any) {
    const data = await this.datatable.getData(body, `SELECT id,name,wallet_address,created_at,updated_at
                  FROM customers`);
    return HttpResponse.success('Datatables fetched successfully').withData(data);
  }

  mapData(data: any) {
    const mappedData: any = {};
      mappedData.id = data.id
      mappedData.name = data.name
      mappedData.walletAddress = data.walletAddress
      mappedData.createdAt = data.createdAt
      mappedData.updatedAt = data.updatedAt
    return mappedData;
  }
}
