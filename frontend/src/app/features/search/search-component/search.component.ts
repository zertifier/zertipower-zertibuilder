import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';

import {CustomersService} from "../../../core/core-services/customers/customers.service";
import {Coordinate} from "mapbox-gl";
import {AppMapComponent} from "../../../shared/infrastructure/components/map/map.component";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})

export class SearchComponent implements OnInit {

  customers:any=[];
  @ViewChild(AppMapComponent) map!:AppMapComponent ;

  constructor(private customersService: CustomersService){

  }

  ngOnInit() {

    this.customersService.getCustomersCups().subscribe(async (res: any) => {
      this.customers = res.data;
      this.customers.map((customer:any)=>{
        console.log("customer",customer)

        if(customer.geolocalization){
          this.map.addMarker(customer.geolocalization.y,customer.geolocalization.x)
        }

      })
    })

  }



}
