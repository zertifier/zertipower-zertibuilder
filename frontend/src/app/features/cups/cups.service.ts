import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface CupsApiInterface {
  id: number;
  cups: string;
  providerId: number;
  communityId: number;
  ubication: string;
  geolocalization: string;
  customerId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CupsApiDTO {
  id: number;
  cups: string;
  providerId: number;
  communityId: number;
  ubication: string;
  geolocalization: string;
  customerId: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: "root",
})
export class CupsApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<CupsApiInterface> {
    return this.httpClient.get<HttpResponse<CupsApiDTO>>(`${environment.api_url}/cups`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getById(id: number): Observable<CupsApiInterface> {
    return this.httpClient.get<HttpResponse<CupsApiDTO>>(`${environment.api_url}/cups/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  save(data: CupsApiInterface): Observable<CupsApiInterface> {
    return this.httpClient.post<HttpResponse<CupsApiDTO>>(`${environment.api_url}/cups`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  update(id: number, data: CupsApiInterface): Observable<CupsApiInterface> {
    return this.httpClient.put<HttpResponse<CupsApiDTO>>(`${environment.api_url}/cups/${id}`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/cups/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: CupsApiDTO): CupsApiInterface {
  return {
    id: dto.id,
    cups: dto.cups,
    providerId: dto.providerId,
    communityId: dto.communityId,
    ubication: dto.ubication,
    geolocalization: dto.geolocalization,
    customerId: dto.customerId,
    createdAt: moment(dto.createdAt, "YYYY-MM-DD HH:mm").toDate(),
    updatedAt: moment(dto.updatedAt, "YYYY-MM-DD HH:mm").toDate(),
  }
}

function mapToDTO(dto: CupsApiInterface): CupsApiDTO {
  return {
    id: dto.id,
    cups: dto.cups,
    providerId: dto.providerId,
    communityId: dto.communityId,
    ubication: dto.ubication,
    geolocalization: dto.geolocalization,
    customerId: dto.customerId,
    createdAt: moment.utc(dto.createdAt).format("YYYY-MM-DD HH:mm"),
    updatedAt: moment.utc(dto.updatedAt).format("YYYY-MM-DD HH:mm"),
  }
}
