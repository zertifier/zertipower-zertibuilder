import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface CupsInterface {
  id: number;
  cups: string;
  type:string;
  providerId: number;
  communityId: number;
  locationId:number;
  address:string;
  lat:number;
  lng:number;
  datadisActive:number
  smartMeterActive:number;
  inverterActive:number;
  datadisUser:string;
  datadisPassword:string;
  smartMeterModel:string;
  smartMeterApiKey:string;
  inverterModel:string;
  inverterApiKey:string;
  sensorModel:string;
  sensorApiKey:string;
  customerId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: "root",
})
export class CupsApiService {

  constructor(private httpClient: HttpClient) {}

  get(): Observable<CupsInterface> {
    return this.httpClient.get<HttpResponse<CupsInterface>>(`${environment.api_url}/cups`)
      .pipe(map(response => (response.data)));
  }

  getById(id: number): Observable<CupsInterface> {
    return this.httpClient.get<HttpResponse<any>>(`${environment.api_url}/cups/${id}`)
      .pipe(map(response => (response.data)));
  }

  save(data: CupsInterface): Observable<CupsInterface> {
    return this.httpClient.post<HttpResponse<CupsInterface>>(`${environment.api_url}/cups`, data)
      .pipe(map(response => (response.data)));
  }

  update(id: number, data: CupsInterface): Observable<CupsInterface> {
    console.log("body data", data)
    return this.httpClient.put<HttpResponse<CupsInterface>>(`${environment.api_url}/cups/${id}`, data)
      .pipe(map(response => (response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/cups/${id}`)
      .pipe(map(response => response.data));
  }
}

