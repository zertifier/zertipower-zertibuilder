import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
} from "@nestjs/common";
import { HttpResponse } from "src/shared/infrastructure/http/HttpResponse";
import { PrismaService } from "src/shared/infrastructure/services/prisma-service/prisma-service";
import { MysqlService } from "src/shared/infrastructure/services/mysql-service/mysql.service";
import { Datatable } from "src/shared/infrastructure/services/datatable/Datatable";
import { ApiTags } from "@nestjs/swagger";
import mysql from "mysql2/promise";
import { BlockchainService } from "src/shared/infrastructure/services/blockchain-service";
import { ErrorCode } from "src/shared/domain/error";

export const RESOURCE_NAME = "blockchainEnergyData";


@ApiTags(RESOURCE_NAME)
@Controller("blockchain-energy-data")
export class BlockchainEnergyDataController {

  private conn: mysql.Pool;

  constructor(private prisma: PrismaService, private datatable: Datatable, private mysql: MysqlService, private blockchainService: BlockchainService) {
    this.conn = this.mysql.pool;
  }

  @Get("interval/:cups/:type/:timestampStart/:timestampEnd")
  async getEnergyHistoricInterval(@Param("cups") cups: string, @Param("type") type: string, @Param("timestampStart") timestampStart: string, @Param("timestampEnd") timestampEnd: string) {
    let energyData: any;
    console.log(cups, type, timestampStart, timestampEnd)
    try{
      energyData = await this.blockchainService.getEnergyHistoricInterval(cups, type, timestampStart, timestampEnd)
      return HttpResponse.success("Energy data fetched successfully").withData(
        energyData
      );
    } catch (e) {
      return HttpResponse.failure(`Error getting interval energyData: ${e}`, ErrorCode.UNEXPECTED)
    }
    
  }


  @Get(":cups/:type/:timestamp")
  async getEnergyValue(@Param("cups") cups: string, @Param("type") type: string, @Param("timestamp") timestamp: string) {
    console.log(cups, type, timestamp)
    let energyData: any;
    try {
      energyData = await this.blockchainService.getEnergyValue(cups, type, timestamp)
      return HttpResponse.success("Energy data fetched successfully").withData(
        energyData
      );
    } catch (e) {
      return HttpResponse.failure(`Error getting energyData: ${e}`, ErrorCode.UNEXPECTED)
    }
  }

  @Post(":cups/:type/:timestamp")
  async postEnergyValue(@Param("cups") cups: string, @Param("type") type: string, @Param("timestamp") timestamp: string,@Body() body: any) {
    console.log(cups, type, timestamp, body.kWh)
    let energyData: any;
    try {
      energyData = await this.blockchainService.setEnergyValue(cups, type, timestamp,body.kWh)
      return HttpResponse.success("Energy data registered successfully").withData(
        energyData
      );
    } catch (e) {
      return HttpResponse.failure(`Error registering energyData: ${e}`, ErrorCode.UNEXPECTED)
    }
  }

  @Post("timestamp-value-interval/:cups/:type")
  async setEnergyValueArray(@Param("cups") cups: string, @Param("type") type: string, @Body() body: any[]) {
    console.log("setEnergyValueArray")
    try {
      for (let i = 0; i < body.length; i++) {
        let tx: any = await this.blockchainService.setEnergyValue(cups, type, body[i].timestamp, body[i].value);
        body[i].tx = tx.hash;
      }
    } catch (e) {
      return HttpResponse.failure(`Error setting energyData: ${e}`, ErrorCode.UNEXPECTED)
    }
    return HttpResponse.success("Energy data saved successfully").withData(
      body
    );
  }

  @Post("batch/:cups")
  async setBatchEnergyInterval(@Param("cups") cups: string, @Body() body: any) {
    try {
      const blockchainResponse = await this.blockchainService.setEnergyHistoricInterval(cups, body.types, body.timestamps, body.values)
      return HttpResponse.success("Energy data saved successfully").withData(
        blockchainResponse
      );
    } catch (e) {
      return HttpResponse.failure(`Error setting energyData: ${e}`, ErrorCode.UNEXPECTED)
    }
  }

  @Get("meter/:cups")
  async getMeter(@Param("cups") cups: string) {

    let energy: any = {};

    try {

      energy.meter = await this.blockchainService.getNumericMetadata(cups, "meter")

      energy.consumption = await this.blockchainService.getNumericMetadata(cups, "consumption")

      energy.export = await this.blockchainService.getNumericMetadata(cups, "export")

    } catch (e) {
      return HttpResponse.failure(`Error setting energyData: ${e}`, ErrorCode.UNEXPECTED)
    }
    return HttpResponse.success("Energy data saved successfully").withData(
      energy
    );
  }

  //Get text metadata

  //Get number metadata


}