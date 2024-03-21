import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import Swal from "sweetalert2";
import { CoreServicesModule } from "./core-services.module";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {environment} from "../../../environments/environment";


@Injectable({
  providedIn: CoreServicesModule,
})
export class CustomersService {

  baseUrl = `${environment.api_url}/customers`;
  constructor(private http:HttpClient) {}

  getCustomers(){
    let url = `${this.baseUrl}`;
    return this.http.get(url);
  }

  getCustomersCups(){
    let url = `${this.baseUrl}/cups`;
    console.log(url, "URL")
    return this.http.get(url);
  }

  getCustomerById(communityId:number){

  }





}
