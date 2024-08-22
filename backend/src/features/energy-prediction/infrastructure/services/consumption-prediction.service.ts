import { Injectable } from '@nestjs/common';
import axios from "axios";
import { EnvironmentService } from "../../../../shared/infrastructure/services";
import { InfrastructureError } from "../../../../shared/domain/error/common";
import * as https from "node:https";

@Injectable()
export class ConsumptionPredictionService {

    private httpClient = axios.create({
        baseURL: this.environment.getEnv().ENERGY_PREDICTION_API
    });

    constructor(private environment: EnvironmentService) { }

    async getCupsConsumption(cupsId: number, startDate: string, endDate: string) {
        try {
            const response = await this.httpClient.get(`/cups/${cupsId}/consumption?start_date=${startDate}&end_date=${endDate}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching cups consumption:', error.response?.data || error.message);
            throw Error('Failed to fetch cups consumption data.');
        }
    }

    async getCommunityConsumption(communityId: number, startDate: string, endDate: string) {
        try {
            const response = await this.httpClient.get(`/communities/${communityId}/consumption?start_date=${startDate}&end_date=${endDate}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching community consumption:', error.response?.data || error.message);
            throw Error('Failed to fetch community consumption data.');
        }
    }

}