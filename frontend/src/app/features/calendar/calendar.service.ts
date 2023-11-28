import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';
import moment from 'moment';

export interface CalendarApiInterface {
  day: Date;
  weekday: string;
  dayType: string;
  festiveType: string;
  festivity: string;
}

export interface CalendarApiDTO {
  day: string;
  weekday: string;
  dayType: string;
  festiveType: string;
  festivity: string;
}

@Injectable({
  providedIn: "root",
})
export class CalendarApiService {
  constructor(private httpClient: HttpClient) {}

  get(): Observable<CalendarApiInterface> {
    return this.httpClient.get<HttpResponse<CalendarApiDTO>>(`${environment.api_url}/calendar`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  getById(id: number): Observable<CalendarApiInterface> {
    return this.httpClient.get<HttpResponse<CalendarApiDTO>>(`${environment.api_url}/calendar/${id}`)
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  save(data: CalendarApiInterface): Observable<CalendarApiInterface> {
    return this.httpClient.post<HttpResponse<CalendarApiDTO>>(`${environment.api_url}/calendar`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  update(id: number, data: CalendarApiInterface): Observable<CalendarApiInterface> {
    return this.httpClient.put<HttpResponse<CalendarApiDTO>>(`${environment.api_url}/calendar/${id}`, mapToDTO(data))
      .pipe(map(response => mapToApiInterface(response.data)));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/calendar/${id}`)
      .pipe(map(response => response.data));
  }
}

function mapToApiInterface(dto: CalendarApiDTO): CalendarApiInterface {
  return {
    day: moment(dto.day, "YYYY-MM-DD HH:mm").toDate(),
    weekday: dto.weekday,
    dayType: dto.dayType,
    festiveType: dto.festiveType,
    festivity: dto.festivity,
  }
}

function mapToDTO(dto: CalendarApiInterface): CalendarApiDTO {
  return {
    day: moment.utc(dto.day).format("YYYY-MM-DD HH:mm"),
    weekday: dto.weekday,
    dayType: dto.dayType,
    festiveType: dto.festiveType,
    festivity: dto.festivity,
  }
}
