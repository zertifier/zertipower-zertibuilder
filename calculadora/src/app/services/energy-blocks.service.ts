import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import moment from 'moment';
import { HttpResponse } from '../interfaces/http-response';
import { environment } from '../../environments/environment';

export interface EnergyBlocksApiInterface {
  id: number;
  reference: string;
  providerId:number;
  expirationDt: Date;
  activeInit: Date;
  activeEnd: Date;
  consumptionPrice: number;
  generationPrice: number;
}

export interface EnergyBlocksApiDTO {
  id: number;
  reference: string;
  providerId:number;
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
    console.log(data)
    console.log(mapToDTO(data))
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
    providerId: dto.providerId,
    expirationDt: moment(dto.expirationDt, "YYYY-MM-DD HH:mm:ss").toDate(),
    activeInit: new Date(dto.activeInit), // Convertimos directamente a un objeto Date
    activeEnd: new Date(dto.activeEnd),
    //activeInit: moment(dto.activeInit, "YYYY-MM-DD  HH:mm:ss").toDate(),
    //activeEnd: moment(dto.activeEnd, "YYYY-MM-DD HH:mm:ss").toDate(),
    consumptionPrice: dto.consumptionPrice,
    generationPrice: dto.generationPrice,
  }
}

function mapToDTO(dto: EnergyBlocksApiInterface): EnergyBlocksApiDTO {
  return {
    id: dto.id,
    reference: dto.reference,
    providerId: dto.providerId,
    expirationDt: dto.expirationDt.toString(), //moment.utc(dto.expirationDt).format("YYYY-MM-DD HH:mm:ss"),
    activeInit: moment(dto.activeInit,"HH:mm").format("HH:mm"),
    activeEnd: moment(dto.activeEnd,"HH:mm").format("HH:mm"),
    consumptionPrice: dto.consumptionPrice,
    generationPrice: dto.generationPrice,
  }
}
