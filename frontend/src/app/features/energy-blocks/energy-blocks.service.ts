import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface EnergyBlocksApiInterface {
  id: number;
  reference: string;
  expirationDt: Date;
  activeInit: Date;
  activeEnd: Date;
  consumptionPrice: number;
  generationPrice: number;
}

export interface EnergyBlocksApiDTO {
  id: number;
  reference: string;
  expirationDt: string;
  activeInit: string;
  activeEnd: string;
  consumptionPrice: number;
  generationPrice: number;
}

@Injectable({
  providedIn: "root",
})
export class EnergyBlocksApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<EnergyBlocksApiInterface> {
    return this.httpClient.get<HttpResponse<EnergyBlocksApiDTO>>(`${environment.api_url}/energy-blocks`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getById(id: number): Observable<EnergyBlocksApiInterface> {
    return this.httpClient.get<HttpResponse<EnergyBlocksApiDTO>>(`${environment.api_url}/energy-blocks/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  save(data: EnergyBlocksApiInterface): Observable<EnergyBlocksApiInterface> {
    return this.httpClient.post<HttpResponse<EnergyBlocksApiDTO>>(`${environment.api_url}/energy-blocks`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  update(id: number, data: EnergyBlocksApiInterface): Observable<EnergyBlocksApiInterface> {
    return this.httpClient.put<HttpResponse<EnergyBlocksApiDTO>>(`${environment.api_url}/energy-blocks/${id}`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/energy-blocks/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: EnergyBlocksApiDTO): EnergyBlocksApiInterface {
  return {
    id: dto.id,
    reference: dto.reference,
    expirationDt: moment(dto.expirationDt, "YYYY-MM-DD HH:mm").toDate(),
    activeInit: moment(dto.activeInit, "YYYY-MM-DD HH:mm").toDate(),
    activeEnd: moment(dto.activeEnd, "YYYY-MM-DD HH:mm").toDate(),
    consumptionPrice: dto.consumptionPrice,
    generationPrice: dto.generationPrice,
  }
}

function mapToDTO(dto: EnergyBlocksApiInterface): EnergyBlocksApiDTO {
  return {
    id: dto.id,
    reference: dto.reference,
    expirationDt: moment.utc(dto.expirationDt).format("YYYY-MM-DD HH:mm"),
    activeInit: moment.utc(dto.activeInit).format("YYYY-MM-DD HH:mm"),
    activeEnd: moment.utc(dto.activeEnd).format("YYYY-MM-DD HH:mm"),
    consumptionPrice: dto.consumptionPrice,
    generationPrice: dto.generationPrice,
  }
}
