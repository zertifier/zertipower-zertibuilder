import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import { CoreServicesModule } from "./core-services.module";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: CoreServicesModule,
})
export class EnergyService {

  baseUrl = `${environment.api_url}/energy/energy-flow`;
  constructor(private http:HttpClient) {}

  getYearByCups(year:number,cups:number){
    let url = `${environment.api_url}/energy-registers-hourly/monthly/${year}?cups=${cups}`;
    return this.http.get(url);
  }

  getWeekByCups(year:number,cups:number,week:number){
    let url = `${environment.api_url}/energy-registers-hourly/weekly/${week}?year=${year}&cups=${cups}`;
    return this.http.get(url);
  }

  getHoursByCups(cups:number,date:string){
    let url = `${environment.api_url}/energy-registers-hourly/hourly/${date}?cups=${cups}`;
    return this.http.get(url);
  }

  //TODO:
  getYearByCommunity(year:number,communityId:number){
    let url = ''//`${environment.api_url}/energy-registers-hourly/hourly/${date}?cups=${cups}`;
    return this.http.get(url);
  }







}
