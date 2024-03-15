import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import { CoreServicesModule } from "./core-services.module";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: CoreServicesModule,
})
export class LogsService {

  baseUrl = `${environment.api_url}/energyRegistersLogs`;

  constructor(private http: HttpClient) {
  }

  byId(id:number) {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get(url);
  }

}

