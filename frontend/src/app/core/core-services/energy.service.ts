import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import { CoreServicesModule } from "./core-services.module";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: CoreServicesModule,
})
export class EnergyService {

  baseUrl = `${environment.api_url}/energy-registers-hourly`;
  constructor(private http:HttpClient) {}

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

  //TODO:
  getYearByCommunity(year:number,communityId:number){
    let url = ''//`${this.baseUrl}/hourly/${date}?cups=${cups}`;
    return this.http.get(url);
  }







}
