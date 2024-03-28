import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import { CoreServicesModule } from "./core-services.module";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: CoreServicesModule,
})
export class DatadisEnergyService {

    baseUrl = `${environment.api_url}/datadisEnergy`;

    constructor(private http:HttpClient) {
      
    }

//datadis

  getYearByCups(year:number,cups:number){
    let url = `${this.baseUrl}/monthly/${year}?cups=${cups}`;
    return this.http.get(url);
  }

  getWeekByCups(date:string,cups:number){
    let url = `${this.baseUrl}/weekly/${date}?cups=${cups}`;
    return this.http.get(url);
  }

  getHoursByCups(cups:number,date:string){
    let url = `${this.baseUrl}/hourly/${date}?cups=${cups}`;
    return this.http.get(url);
  }

}