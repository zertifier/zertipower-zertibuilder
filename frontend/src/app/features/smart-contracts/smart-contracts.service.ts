import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface SmartContractsApiInterface {
  id: number;
  contractAddress: string;
  blockchainId: number;
}

export interface SmartContractsApiDTO {
  id: number;
  contractAddress: string;
  blockchainId: number;
}

@Injectable({
  providedIn: "root",
})
export class SmartContractsApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<SmartContractsApiInterface> {
    return this.httpClient.get<HttpResponse<SmartContractsApiDTO>>(`${environment.api_url}/smart-contracts`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getById(id: number): Observable<SmartContractsApiInterface> {
    return this.httpClient.get<HttpResponse<SmartContractsApiDTO>>(`${environment.api_url}/smart-contracts/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  save(data: SmartContractsApiInterface): Observable<SmartContractsApiInterface> {
    return this.httpClient.post<HttpResponse<SmartContractsApiDTO>>(`${environment.api_url}/smart-contracts`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  update(id: number, data: SmartContractsApiInterface): Observable<SmartContractsApiInterface> {
    return this.httpClient.put<HttpResponse<SmartContractsApiDTO>>(`${environment.api_url}/smart-contracts/${id}`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/smart-contracts/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: SmartContractsApiDTO): SmartContractsApiInterface {
  return {
    id: dto.id,
    contractAddress: dto.contractAddress,
    blockchainId: dto.blockchainId,
  }
}

function mapToDTO(dto: SmartContractsApiInterface): SmartContractsApiDTO {
  return {
    id: dto.id,
    contractAddress: dto.contractAddress,
    blockchainId: dto.blockchainId,
  }
}
