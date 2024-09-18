import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import { CoreServicesModule } from "./core-services.module";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: CoreServicesModule,
})
export class EnergyService {

   baseUrl = `${environment.api_url}/energy-hourly`;
  
  cupsBaseUrl = `${environment.api_url}/cups`;
  communityBaseUrl = `${environment.api_url}/community`;

  constructor(private http:HttpClient) {}

  // getYearByCups(year:number,cups:number){
  //   let url = `${this.baseUrl}/monthly/${year}?cups=${cups}`;
  //   return this.http.get(url);
  // }

  getDatatable(){
    let url = `${this.baseUrl}/datatable`;
    return this.http.get(url);
  }

  getYearByCups(year:number,origin:string,cups:number){
    let url = `${this.cupsBaseUrl}/${cups}/stats/${origin}/yearly/${year}`;
    return this.http.get(url);
  }

  getYearByCommunityCups(year:number,origin:string,cups:number){
    let url = `${this.communityBaseUrl}/${cups}/stats/${origin}/yearly/${year}`;
    return this.http.get(url);
  }

  // getWeekByCups(date:string,cups:number){
  //   let url = `${this.baseUrl}/weekly/${date}?cups=${cups}`;
  //   return this.http.get(url);
  // }

  getMonthByCups(date:string,origin:string,cups:number){
    let url = `${this.cupsBaseUrl}/${cups}/stats/${origin}/monthly/${date}`;
    return this.http.get(url);
  }

  getMonthCommunityByCups(date:string,origin:string,cups:number){
    let url = `${this.communityBaseUrl}/${cups}/stats/monthly/${date}`;
    return this.http.get(url);
  }

  getDayByCups(cups:number,origin:string,date:string){
    let url = `${this.cupsBaseUrl}/${cups}/stats/${origin}/daily/${date}`;
    return this.http.get(url);
  }

  //TODO:
  getYearByCommunity(year:number,communityId:number){
    let url = ''//`${this.baseUrl}/hourly/${date}?cups=${cups}`;
    return this.http.get(url);
  }

}
