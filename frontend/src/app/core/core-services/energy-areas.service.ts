import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import { CoreServicesModule } from "./core-services.module";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: CoreServicesModule,
})
export class EnergyAreasService {

  baseUrl = `${environment.api_url}/energy-areas`;

  constructor(private http: HttpClient) {
  }

  getByCommunity(communityId: number) {
    let url = `${environment.api_url}/by-community?id=${communityId}`;
    return this.http.get(url);
  }

  /**
   *
   * @param lat
   * @param lng
   * @param radius in kilometers   */
  getByArea(lat: number, lng: number, radius: number = 1) {
    console.log("ep by area")
    let url = `${this.baseUrl}/by-area?lat=${lat}&lng=${lng}&radius=${radius}`;
    return this.http.get(url);
  }

}

