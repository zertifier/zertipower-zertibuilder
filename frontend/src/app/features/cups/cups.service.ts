import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface CupsApiInterface {
  id: number;
  cups: string;
  type:string;
  providerId: number;
  communityId: number;
  locationId:number;
  address:string;
  lat:number;
  lng:number;
  datadis:number
  smartMeter:number;
  inverter:number;
  datadisUser:string;
  datadisPwd:string;
  smartMeterModel:string;
  smartMeterApiKey:string;
  inverterModel:string;
  inverterApiKey:string;
  customerId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CupsApiDTO {
  id: number;
  cups: string;
  type:string;
  providerId: number;
  communityId: number;
  locationId:number;
  address:string;
  lat:number;
  lng:number;
  datadis:number
  smartMeter:number;
  inverter:number;
  datadisUser:string;
  datadisPwd:string;
  smartMeterModel:string;
  smartMeterApiKey:string;
  inverterModel:string;
  inverterApiKey:string;
  customerId: number;
  createdAt?: Date;
  updatedAt?: Date;
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
    console.log("body data", data)
    return this.httpClient.put<HttpResponse<CupsApiDTO>>(`${environment.api_url}/cups/${id}`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/cups/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: CupsApiDTO): CupsApiInterface {
  console.log(dto)
  return {
    id: dto.id,
    cups: dto.cups,
    type:dto.type,
    providerId: dto.providerId,
    communityId: dto.communityId,
    locationId: dto.locationId,
    customerId: dto.customerId,
    address:dto.address,
    lat:dto.lat,
    lng:dto.lng,
    datadis:dto.datadis,
    smartMeter:dto.smartMeter,
    inverter:dto.inverter,
    datadisUser:dto.datadisUser,
    datadisPwd:dto.datadisPwd,
    smartMeterModel:dto.smartMeterModel,
    smartMeterApiKey:dto.smartMeterApiKey,
    inverterModel:dto.inverterModel,
    inverterApiKey:dto.inverterApiKey,
    createdAt: moment(dto.createdAt, "YYYY-MM-DD HH:mm").toDate(),
    updatedAt: moment(dto.updatedAt, "YYYY-MM-DD HH:mm").toDate(),
  }
}

function mapToDTO(dto: CupsApiInterface): CupsApiDTO {
  return {
    id: dto.id,
    cups: dto.cups,
    type:dto.type,
    providerId: dto.providerId,
    communityId: dto.communityId,
    locationId: dto.locationId,
    address:dto.address,
    lat:dto.lat,
    lng:dto.lng,
    datadis:dto.datadis,
    smartMeter:dto.smartMeter,
    inverter:dto.inverter,
    datadisUser:dto.datadisUser,
    datadisPwd:dto.datadisPwd,
    smartMeterModel:dto.smartMeterModel,
    smartMeterApiKey:dto.smartMeterApiKey,
    inverterModel:dto.inverterModel,
    inverterApiKey:dto.inverterApiKey,
    customerId: dto.customerId,
    //createdAt: moment.utc(dto.createdAt).format("YYYY-MM-DD HH:mm"),
    //updatedAt: moment.utc(dto.updatedAt).format("YYYY-MM-DD HH:mm"),
  }
}
