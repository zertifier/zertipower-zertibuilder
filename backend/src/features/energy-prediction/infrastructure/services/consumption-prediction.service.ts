import { Injectable } from '@nestjs/common';
import axios from "axios";
import { EnvironmentService } from "../../../../shared/infrastructure/services";

@Injectable()
export class ConsumptionPredictionService {

    private httpClient = axios.create({
        baseURL: this.environment.getEnv().ENERGY_PREDICTION_API
    });

    constructor(private environment: EnvironmentService) { }

    async getCupsConsumption(cupsId: number, startDate: string, endDate: string) {
        try {
            const response = await this.httpClient.get(`/cups/${cupsId}/consumption?start_date=${startDate}&end_date=${endDate}`);
            return this.normalizeConsumptionData(response.data);
        } catch (error: any) {
            console.error('Error fetching cups consumption:', error.response?.data || error.message);
            throw Error('Failed to fetch cups consumption data.');
        }
    }

    async getCommunityConsumption(communityId: number, startDate: string, endDate: string) {
        try {
            const response = await this.httpClient.get(`/communities/${communityId}/consumption?start_date=${startDate}&end_date=${endDate}`);
            return this.normalizeConsumptionData(response.data);
        } catch (error: any) {
            console.error('Error fetching community consumption:', error.response?.data || error.message);
            throw Error('Failed to fetch community consumption data.');
        }
    }

    private normalizeConsumptionData(data: any) {
        if (!data) return data;

        const divideValue = (val: any) => {
            if (typeof val === 'number') {
                return val > 500 ? Number((val / 1000).toFixed(2)) : val;
            }
            return val;
        };

        if (Array.isArray(data)) {
            return data.map((item: any) => ({
                ...item,
                value: divideValue(item.value),
                consumption: divideValue(item.consumption),
                kwh: divideValue(item.kwh),
            }));
        }

        if (typeof data === 'object') {
            const copy = { ...data };
            if (Array.isArray(copy.values)) {
                copy.values = copy.values.map((item: any) => ({
                    ...item,
                    value: divideValue(item.value),
                    consumption: divideValue(item.consumption),
                }));
            }
            if (Array.isArray(copy.data)) {
                copy.data = copy.data.map((item: any) => ({
                    ...item,
                    value: divideValue(item.value),
                    consumption: divideValue(item.consumption),
                }));
            }
            return copy;
        }

        return data;
    }
}