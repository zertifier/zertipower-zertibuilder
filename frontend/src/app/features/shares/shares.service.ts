import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpResponse } from 'src/app/shared/infrastructure/http/HttpResponse';

export interface SharesInterface {
  id: number;
  community_id: number;
  customer_id: number;
  shares:number;
  status:string;
  // createdAt: Date;
  // updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SharesService {

  constructor(private httpClient: HttpClient) { }

  get(): Observable<SharesInterface> {
    return this.httpClient.get<HttpResponse<any>>(`${environment.api_url}/shares`)
      .pipe(map(response => response.data));
  }

  getById(id:number): Observable<SharesInterface> {
    return this.httpClient.get<HttpResponse<any>>(`${environment.api_url}/shares/${id}`)
      .pipe(map(response => response.data));
  }

  save(data: SharesInterface): Observable<SharesInterface> {
    return this.httpClient.post<HttpResponse<SharesInterface>>(`${environment.api_url}/shares`, data)
      .pipe(map(response => response.data));
  }

  update(id: number, data: SharesInterface): Observable<SharesInterface> {
    return this.httpClient.put<HttpResponse<SharesInterface>>(`${environment.api_url}/shares/${id}`, data)
      .pipe(map(response => response.data));
  }

  remove(id: number): Observable<void> {
    return this.httpClient.delete<HttpResponse<void>>(`${environment.api_url}/shares/${id}`)
      .pipe(map(response => response.data));
  }

}
