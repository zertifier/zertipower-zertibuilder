import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface ProposalsApiInterface {
  proposal: string;
  description: string;
  communityId: number;
  expirationDt: Date;
  status: string;
  daoId: number;
}

export interface ProposalsApiDTO {
  proposal: string;
  description: string;
  communityId: number;
  expirationDt: string;
  status: string;
  daoId: number;
}

@Injectable({
  providedIn: "root",
})
export class ProposalsApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<ProposalsApiInterface> {
    return this.httpClient.get<HttpResponse<ProposalsApiDTO>>(`${environment.api_url}/proposals`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getById(id: number): Observable<ProposalsApiInterface> {
    return this.httpClient.get<HttpResponse<ProposalsApiDTO>>(`${environment.api_url}/proposals/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  save(data: ProposalsApiInterface): Observable<ProposalsApiInterface> {
    return this.httpClient.post<HttpResponse<ProposalsApiDTO>>(`${environment.api_url}/proposals`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  update(id: number, data: ProposalsApiInterface): Observable<ProposalsApiInterface> {
    return this.httpClient.put<HttpResponse<ProposalsApiDTO>>(`${environment.api_url}/proposals/${id}`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/proposals/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: ProposalsApiDTO): ProposalsApiInterface {
  return {
    proposal: dto.proposal,
    description: dto.description,
    communityId: dto.communityId,
    expirationDt: moment(dto.expirationDt, "YYYY-MM-DD HH:mm").toDate(),
    status: dto.status,
    daoId: dto.daoId,
  }
}

function mapToDTO(dto: ProposalsApiInterface): ProposalsApiDTO {
  return {
    proposal: dto.proposal,
    description: dto.description,
    communityId: dto.communityId,
    expirationDt: moment.utc(dto.expirationDt).format("YYYY-MM-DD HH:mm"),
    status: dto.status,
    daoId: dto.daoId,
  }
}
