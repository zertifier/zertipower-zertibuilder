import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface EnergyRegistersApiInterface {
  id: number;
  infoDt: Date;
  cupsId: number;
  import: number;
  consumption: number;
  export: number;
  generation: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnergyRegistersApiDTO {
  id: number;
  infoDt: string;
  cupsId: number;
  import: number;
  consumption: number;
  export: number;
  generation: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: "root",
})
export class EnergyRegistersApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<EnergyRegistersApiInterface> {
    return this.httpClient.get<HttpResponse<EnergyRegistersApiDTO>>(`${environment.api_url}/energy-registers`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getById(id: number): Observable<EnergyRegistersApiInterface> {
    return this.httpClient.get<HttpResponse<EnergyRegistersApiDTO>>(`${environment.api_url}/energy-registers/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  save(data: EnergyRegistersApiInterface): Observable<EnergyRegistersApiInterface> {
    return this.httpClient.post<HttpResponse<EnergyRegistersApiDTO>>(`${environment.api_url}/energy-registers`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  update(id: number, data: EnergyRegistersApiInterface): Observable<EnergyRegistersApiInterface> {
    return this.httpClient.put<HttpResponse<EnergyRegistersApiDTO>>(`${environment.api_url}/energy-registers/${id}`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/energy-registers/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: EnergyRegistersApiDTO): EnergyRegistersApiInterface {
  return {
    id: dto.id,
    infoDt: moment(dto.infoDt, "YYYY-MM-DD HH:mm").toDate(),
    cupsId: dto.cupsId,
    import: dto.import,
    consumption: dto.consumption,
    export: dto.export,
    generation: dto.generation,
    createdAt: moment(dto.createdAt, "YYYY-MM-DD HH:mm").toDate(),
    updatedAt: moment(dto.updatedAt, "YYYY-MM-DD HH:mm").toDate(),
  }
}

function mapToDTO(dto: EnergyRegistersApiInterface): EnergyRegistersApiDTO {
  console.log(dto, "DTO")
  return {
    id: dto.id,
    infoDt: moment.utc(dto.infoDt).format("YYYY-MM-DD HH:mm"),
    cupsId: dto.cupsId,
    import: dto.import,
    consumption: dto.consumption,
    export: dto.export,
    generation: dto.generation,
    createdAt: moment.utc(dto.createdAt).format("YYYY-MM-DD HH:mm"),
    updatedAt: moment.utc(dto.updatedAt).format("YYYY-MM-DD HH:mm"),
  }
}
