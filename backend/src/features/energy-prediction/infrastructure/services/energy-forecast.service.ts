import {Injectable} from '@nestjs/common';
import {Axios} from "axios";
import {EnvironmentService} from "../../../../shared/infrastructure/services";
import {InfrastructureError} from "../../../../shared/domain/error/common";

const VAR_CODES = {
  WEATHER_FORECAST_SOLAR_RAD: '',
  WEATHER_SOLAR_RAD: ''
}

export enum Granularity {
  RAW = 0,
  FIVE_MINUTES = 1,
  QUARTERHOURLY = 2,
  HOURLY = 3,
  DAILY = 4,
  MONTHLY = 5,
}

@Injectable()
export class EnergyForecastService {
  private httpClient = new Axios({baseURL: this.environment.getEnv().RADIATION_API});
  private projectId = '';
  private plantId = '';
  private solarRadiationForecastVarId = '';
  private solarRadiationVarId = '';
  private token = '';
  private user = this.environment.getEnv().RADIATION_API_CREDENTIALS.split(":")[0];
  private password = this.environment.getEnv().RADIATION_API_CREDENTIALS.split(":")[0];

  constructor(private environment: EnvironmentService) {
    this.httpClient.interceptors.request.use(async (config) => {
      if (!this.token) {
        await this.login();
      }
      config.headers.set('Authorization', `Bearer ${this.token}`);
      return config;
    });
    this.httpClient.interceptors.response.use((res) => {
      if (res.status === 401) {
        this.token = '';
      }
      return res;
    });
  }

  public async login() {
    const response = await this.httpClient.post<{
      token: string,
      projectList: {
        id: string,
        name: string,
        plantsList: {
          id: string,
          name: string,
          identifier: string,
          timeZone: string
        }[]
      }[]
    }>('/wthirdparty/v1/auth/login', {
      User: this.user,
      Password: this.password
    });

    const project = response.data.projectList[0];
    if (!project) {
      throw new InfrastructureError('Cannot login to wattabit');
    }
    this.projectId = project.id;

    const plant = project.plantsList[0];
    if (!plant) {
      throw new InfrastructureError('Cannot login to wattabit')
    }
    this.plantId = plant.id;

    const varsResponse = await this.httpClient.post<{
      supplyName: string,
      name: string,
      units: string,
      code: string,
      id: string,
      projectVarId: string
    }[]>('/wthirdparty/v1/data/GetMonitoringVarsByPlant', {
      ProjectId: this.projectId,
      PlantId: this.plantId
    });

    const solarRadVarData = varsResponse.data.find(r => VAR_CODES.WEATHER_SOLAR_RAD === r.code);
    if (!solarRadVarData) {
      throw new InfrastructureError('Cannot get WEATHER_SOLAR_RAD var monitoring info');
    }
    this.solarRadiationVarId = solarRadVarData.id;

    const solarRadForecastVarData = varsResponse.data.find(r => VAR_CODES.WEATHER_FORECAST_SOLAR_RAD === r.code);
    if (!solarRadForecastVarData) {
      throw new InfrastructureError('Cannot get WEATHER_FORECAST_SOLAR_RAD var monitoring info');
    }
    this.solarRadiationForecastVarId = solarRadForecastVarData.id;

    this.token = response.data.token;
  }

  private async requestData(params: {
    varId: string,
    projectId: string,
    plantId: string,
    granularity: number,
    start: Date,
    end: Date
  }): Promise<{ value: number, time: string }[]> {
    const response = await this.httpClient.post<{
      plantId: string,
      values: {
        value: number,
        time: string
      }[]
    }[]>("/wthirdparty/v1/data/MonitoringDataByPlant", {
      ProjectId: params.projectId,
      PlantId: params.plantId,
      Granularity: params.granularity,
      Start: params.start.toISOString(),
      End: params.end.toISOString(),
    });

    const plantData = response.data[0];

    return plantData.values;
  }

  public async getRadiationForecast(from: Date, to: Date): Promise<{ value: number, time: Date }[]> {
    const response = await this.requestData({
      start: from,
      end: to,
      granularity: Granularity.HOURLY,
      varId: this.solarRadiationForecastVarId,
      plantId: this.plantId,
      projectId: this.projectId
    });
    return response.map(v => {
      return {
        value: v.value,
        time: new Date(v.time)
      }
    });
  }

  public async getRadiation(from: Date, to: Date): Promise<{ value: number, time: Date }[]> {
    const response = await this.requestData({
      start: from,
      end: to,
      granularity: Granularity.HOURLY,
      varId: this.solarRadiationVarId,
      plantId: this.plantId,
      projectId: this.projectId
    });
    return response.map(v => {
      return {
        value: v.value,
        time: new Date(v.time)
      }
    });
  }
}
