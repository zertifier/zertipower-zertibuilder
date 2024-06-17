import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class LocationService {

  baseUrl = `${environment.api_url}/locations`;

  constructor(private http: HttpClient) {
  }

  getLocations() {
    return this.http.get(this.baseUrl);
  }

}

