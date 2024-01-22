import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';

import {CustomersService} from "../../../core/core-services/customers/customers.service";
import {Coordinate} from "mapbox-gl";
import {AppMapComponent} from "../../../shared/infrastructure/components/map/map.component";
import {CommunitiesApiService} from "../../communities/communities.service";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})

export class SearchComponent implements OnInit {

  customers:any=[];
  communities=[];
  @ViewChild(AppMapComponent) map!:AppMapComponent ;

  constructor(private customersService: CustomersService, private communitiesService: CommunitiesApiService){

  }

  ngOnInit() {

    //this.communitiesService.get

    this.customersService.getCustomersCups().subscribe(async (res: any) => {
      this.customers = res.data;
      this.customers.map((customer:any)=>{
        console.log("customer",customer)
        if(customer.geolocalization){
          this.map.addMarker(customer.geolocalization.y,customer.geolocalization.x)
        }

      })
    })

    this.communitiesService.get().subscribe((communities:any)=>{
      console.log("communities: ",communities)
      this.communities = communities.data;
      this.communities.map((community:any)=>{
        if(community.geolocation){
          this.map.addMarker(community.geolocation.y,community.geolocation.x)
        }
      })
    })

  }



}
