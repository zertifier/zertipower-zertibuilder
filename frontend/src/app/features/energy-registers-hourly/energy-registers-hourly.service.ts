import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface EnergyRegistersHourlyApiInterface {
  id: number;
  infoDt: Date;
  cupsId: number;
  import: number;
  consumption: number;
  export: number;
  generation: number;
  surplus:number;
  generationPrice: number;
  generationCost: number;
  consumptionPrice: number;
  consumptionCost: number;
}

export interface EnergyRegistersHourlyApiDTO {
  id: number;
  infoDt: string;
  cupsId: number;
  import: number;
  consumption: number;
  export: number;
  surplus:number;
  generation: number;
  generationPrice: number;
  generationCost: number;
  consumptionPrice: number;
  consumptionCost: number;
}

@Injectable({
  providedIn: "root",
})
export class EnergyRegistersHourlyApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<EnergyRegistersHourlyApiInterface> {
    return this.httpClient.get<HttpResponse<EnergyRegistersHourlyApiDTO>>(`${environment.api_url}/energy-registers-hourly`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getById(id: number): Observable<EnergyRegistersHourlyApiInterface> {
    return this.httpClient.get<HttpResponse<EnergyRegistersHourlyApiDTO>>(`${environment.api_url}/energy-registers-hourly/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  save(data: EnergyRegistersHourlyApiInterface): Observable<EnergyRegistersHourlyApiInterface> {
    return this.httpClient.post<HttpResponse<EnergyRegistersHourlyApiDTO>>(`${environment.api_url}/energy-registers-hourly`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  update(id: number, data: EnergyRegistersHourlyApiInterface): Observable<EnergyRegistersHourlyApiInterface> {
    return this.httpClient.put<HttpResponse<EnergyRegistersHourlyApiDTO>>(`${environment.api_url}/energy-registers-hourly/${id}`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/energy-registers-hourly/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: EnergyRegistersHourlyApiDTO): EnergyRegistersHourlyApiInterface {
  return {
    id: dto.id,
    infoDt: moment(dto.infoDt, "YYYY-MM-DD HH:mm").toDate(),
    cupsId: dto.cupsId,
    import: dto.import,
    consumption: dto.consumption,
    export: dto.export,
    surplus: dto.surplus,
    generation: dto.generation,
    generationPrice: dto.generationPrice,
    generationCost: dto.generationCost,
    consumptionPrice: dto.consumptionPrice,
    consumptionCost: dto.consumptionCost,
  }
}

function mapToDTO(dto: EnergyRegistersHourlyApiInterface): EnergyRegistersHourlyApiDTO {
  return {
    id: dto.id,
    infoDt: moment.utc(dto.infoDt).format("YYYY-MM-DD HH:mm"),
    cupsId: dto.cupsId,
    import: dto.import,
    consumption: dto.consumption,
    export: dto.export,
    surplus: dto.surplus,
    generation: dto.generation,
    generationPrice: dto.generationPrice,
    generationCost: dto.generationCost,
    consumptionPrice: dto.consumptionPrice,
    consumptionCost: dto.consumptionCost,
  }
}
