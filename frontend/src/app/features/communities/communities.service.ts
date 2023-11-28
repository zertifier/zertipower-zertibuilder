import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface CommunitiesApiInterface {
  id: number;
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunitiesApiDTO {
  id: number;
  name: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: "root",
})
export class CommunitiesApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<CommunitiesApiInterface> {
    return this.httpClient.get<HttpResponse<CommunitiesApiDTO>>(`${environment.api_url}/communities`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getById(id: number): Observable<CommunitiesApiInterface> {
    return this.httpClient.get<HttpResponse<CommunitiesApiDTO>>(`${environment.api_url}/communities/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  save(data: CommunitiesApiInterface): Observable<CommunitiesApiInterface> {
    return this.httpClient.post<HttpResponse<CommunitiesApiDTO>>(`${environment.api_url}/communities`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  update(id: number, data: CommunitiesApiInterface): Observable<CommunitiesApiInterface> {
    return this.httpClient.put<HttpResponse<CommunitiesApiDTO>>(`${environment.api_url}/communities/${id}`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/communities/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: CommunitiesApiDTO): CommunitiesApiInterface {
  return {
    id: dto.id,
    name: dto.name,
    location: dto.location,
    createdAt: moment(dto.createdAt, "YYYY-MM-DD HH:mm").toDate(),
    updatedAt: moment(dto.updatedAt, "YYYY-MM-DD HH:mm").toDate(),
  }
}

function mapToDTO(dto: CommunitiesApiInterface): CommunitiesApiDTO {
  return {
    id: dto.id,
    name: dto.name,
    location: dto.location,
    createdAt: moment.utc(dto.createdAt).format("YYYY-MM-DD HH:mm"),
    updatedAt: moment.utc(dto.updatedAt).format("YYYY-MM-DD HH:mm"),
  }
}
