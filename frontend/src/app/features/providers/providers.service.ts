import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface ProvidersApiInterface {
  id: number;
  provider: string;
}

export interface ProvidersApiDTO {
  id: number;
  provider: string;
}

@Injectable({
  providedIn: "root",
})
export class ProvidersApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<ProvidersApiInterface> {
    return this.httpClient.get<HttpResponse<ProvidersApiDTO>>(`${environment.api_url}/providers`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getById(id: number): Observable<ProvidersApiInterface> {
    return this.httpClient.get<HttpResponse<ProvidersApiDTO>>(`${environment.api_url}/providers/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  save(data: ProvidersApiInterface): Observable<ProvidersApiInterface> {
    return this.httpClient.post<HttpResponse<ProvidersApiDTO>>(`${environment.api_url}/providers`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  update(id: number, data: ProvidersApiInterface): Observable<ProvidersApiInterface> {
    return this.httpClient.put<HttpResponse<ProvidersApiDTO>>(`${environment.api_url}/providers/${id}`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/providers/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: ProvidersApiDTO): ProvidersApiInterface {
  return {
    id: dto.id,
    provider: dto.provider,
  }
}

function mapToDTO(dto: ProvidersApiInterface): ProvidersApiDTO {
  return {
    id: dto.id,
    provider: dto.provider,
  }
}
