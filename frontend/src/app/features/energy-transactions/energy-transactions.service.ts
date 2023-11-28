import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface EnergyTransactionsApiInterface {
  id: number;
  cupsId: number;
  infoDt: Date;
  kwhIn: number;
  kwhOut: number;
  kwhSurplus: number;
  blockId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnergyTransactionsApiDTO {
  id: number;
  cupsId: number;
  infoDt: string;
  kwhIn: number;
  kwhOut: number;
  kwhSurplus: number;
  blockId: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: "root",
})
export class EnergyTransactionsApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<EnergyTransactionsApiInterface> {
    return this.httpClient.get<HttpResponse<EnergyTransactionsApiDTO>>(`${environment.api_url}/energy-transactions`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getById(id: number): Observable<EnergyTransactionsApiInterface> {
    return this.httpClient.get<HttpResponse<EnergyTransactionsApiDTO>>(`${environment.api_url}/energy-transactions/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  save(data: EnergyTransactionsApiInterface): Observable<EnergyTransactionsApiInterface> {
    return this.httpClient.post<HttpResponse<EnergyTransactionsApiDTO>>(`${environment.api_url}/energy-transactions`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  update(id: number, data: EnergyTransactionsApiInterface): Observable<EnergyTransactionsApiInterface> {
    return this.httpClient.put<HttpResponse<EnergyTransactionsApiDTO>>(`${environment.api_url}/energy-transactions/${id}`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/energy-transactions/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: EnergyTransactionsApiDTO): EnergyTransactionsApiInterface {
  return {
    id: dto.id,
    cupsId: dto.cupsId,
    infoDt: moment(dto.infoDt, "YYYY-MM-DD HH:mm").toDate(),
    kwhIn: dto.kwhIn,
    kwhOut: dto.kwhOut,
    kwhSurplus: dto.kwhSurplus,
    blockId: dto.blockId,
    createdAt: moment(dto.createdAt, "YYYY-MM-DD HH:mm").toDate(),
    updatedAt: moment(dto.updatedAt, "YYYY-MM-DD HH:mm").toDate(),
  }
}

function mapToDTO(dto: EnergyTransactionsApiInterface): EnergyTransactionsApiDTO {
  return {
    id: dto.id,
    cupsId: dto.cupsId,
    infoDt: moment.utc(dto.infoDt).format("YYYY-MM-DD HH:mm"),
    kwhIn: dto.kwhIn,
    kwhOut: dto.kwhOut,
    kwhSurplus: dto.kwhSurplus,
    blockId: dto.blockId,
    createdAt: moment.utc(dto.createdAt).format("YYYY-MM-DD HH:mm"),
    updatedAt: moment.utc(dto.updatedAt).format("YYYY-MM-DD HH:mm"),
  }
}
