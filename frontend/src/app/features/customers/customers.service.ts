import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface CustomersApiInterface {
  id: number;
  name: string;
  dni: string;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomersApiDTO {
  id: number;
  name: string;
  dni: string;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: "root",
})
export class CustomersApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<CustomersApiInterface> {
    return this.httpClient.get<HttpResponse<any>>(`${environment.api_url}/customers`)
      .pipe(map(response => response.data));
  }

  getById(id: number): Observable<CustomersApiInterface> {
    return this.httpClient.get<HttpResponse<CustomersApiDTO>>(`${environment.api_url}/customers/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getCustomerCups(customerId: number): Observable<any> {
    return this.httpClient.get(`${environment.api_url}/customers/cups/${customerId}`)
      .pipe(map((response:any) => (response.data)));
  }

  save(data: CustomersApiInterface): Observable<CustomersApiInterface> {
    return this.httpClient.post<HttpResponse<CustomersApiDTO>>(`${environment.api_url}/customers`, data)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  update(id: number, data: CustomersApiInterface): Observable<CustomersApiInterface> {
    return this.httpClient.put<HttpResponse<CustomersApiDTO>>(`${environment.api_url}/customers/${id}`, data)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/customers/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: CustomersApiDTO): CustomersApiInterface {
  return {
    id: dto.id,
    name: dto.name,
    dni:dto.dni,
    walletAddress: dto.walletAddress,
    createdAt: moment(dto.createdAt, "YYYY-MM-DD HH:mm").toDate(),
    updatedAt: moment(dto.updatedAt, "YYYY-MM-DD HH:mm").toDate(),
  }
}

function mapToDTO(dto: CustomersApiInterface): CustomersApiDTO {
  return {
    id: dto.id,
    name: dto.name,
    dni: dto.dni,
    walletAddress: dto.walletAddress,
    createdAt: moment.utc(dto.createdAt).format("YYYY-MM-DD HH:mm"),
    updatedAt: moment.utc(dto.updatedAt).format("YYYY-MM-DD HH:mm"),
  }
}
