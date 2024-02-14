import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import { CoreServicesModule } from "./core-services.module";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: CoreServicesModule,
})
export class LocationService {

  baseUrl = `${environment.api_url}/locations`;

  constructor(private http: HttpClient) {
  }

  getLocations() {
    return this.http.get(this.baseUrl);
  }

}

