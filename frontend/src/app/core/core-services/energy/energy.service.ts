import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import { CoreServicesModule } from "../core-services.module";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {environment} from "../../../../environments/environment";

@Injectable({
  providedIn: CoreServicesModule,
})
export class EnergyService {

  baseUrl = `${environment.api_url}/energy/energy-flow`;
  constructor(private http:HttpClient) {}

  getYearByCups(year:number,cups:number){
    let url = `${this.baseUrl}/${year}?cups=${cups}`;
    return this.http.get(url);
  }

  getYearByCommunity(year:number,communityId:number){

  }





}
