import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface EnergyHourlyApiInterface {
  id: number;
  infoDt: Date;
  cups: string;
  kwhIn: number;
  kwhOut: number;
  kwhOutVirtual: number;
  kwhInPrice: number;
  kwhOutPrice: number;
  shares: number;
  type: string;
  origin: string;
}

export interface EnergyHourlyApiDTO {
  id: number;
  infoDt: string;
  cups: string;
  kwhIn: number;
  kwhOut: number;
  kwhOutVirtual: number;
  kwhInPrice: number;
  kwhOutPrice: number;
  shares: number;
  type: string;
  origin: string;
}

@Injectable({
  providedIn: "root",
})
export class EnergyHourlyApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<EnergyHourlyApiInterface> {
    return this.httpClient.get<HttpResponse<EnergyHourlyApiDTO>>(`${environment.api_url}/energy-hourly`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getById(id: number): Observable<EnergyHourlyApiInterface> {
    return this.httpClient.get<HttpResponse<EnergyHourlyApiDTO>>(`${environment.api_url}/energy-hourly/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  // save(data: EnergyHourlyApiInterface): Observable<EnergyHourlyApiInterface> {
  //   return this.httpClient.post<HttpResponse<EnergyHourlyApiDTO>>(`${environment.api_url}/energy-hourly`, mapToDTO(data))
  //     .pipe(map(response => mapToApiInterface(response.data)));
  // }

  // update(id: number, data: EnergyHourlyApiInterface): Observable<EnergyHourlyApiInterface> {
  //   return this.httpClient.put<HttpResponse<EnergyHourlyApiDTO>>(`${environment.api_url}/energy-hourly/${id}`, mapToDTO(data))
  //     .pipe(map(response => mapToApiInterface(response.data)));
  // }

  // remove(id: number): Observable<void> {
  //   return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/energy-hourly/${id}`)
  //     .pipe(map(response => response.data));
  // }
}

export function mapToApiInterface(dto: EnergyHourlyApiDTO): EnergyHourlyApiInterface {
  return {
    id: dto.id,
    infoDt: moment(dto.infoDt, "YYYY-MM-DD HH:mm").toDate(),
    cups: dto.cups,
    kwhIn: dto.kwhIn,
    kwhOut: dto.kwhOut,
    kwhOutVirtual: dto.kwhOutVirtual,
    kwhInPrice: dto.kwhInPrice,
    kwhOutPrice: dto.kwhOutPrice,
    shares: dto.shares,
    type: dto.type,
    origin: dto.origin,
  };
}

export function mapToDTO(apiInterface: EnergyHourlyApiInterface): EnergyHourlyApiDTO {
  return {
    id: apiInterface.id,
    infoDt: moment.utc(apiInterface.infoDt).format("YYYY-MM-DD HH:mm"),
    cups: apiInterface.cups,
    kwhIn: apiInterface.kwhIn,
    kwhOut: apiInterface.kwhOut,
    kwhOutVirtual: apiInterface.kwhOutVirtual,
    kwhInPrice: apiInterface.kwhInPrice,
    kwhOutPrice: apiInterface.kwhOutPrice,
    shares: apiInterface.shares,
    type: apiInterface.type,
    origin: apiInterface.origin,
  };
}
