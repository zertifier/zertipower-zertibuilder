import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';

import {CustomersService} from "../../../core/core-services/customers.service";
import {Coordinate} from "mapbox-gl";
import {AppMapComponent} from "../../../shared/infrastructure/components/map/map.component";
import {CommunitiesApiService} from "../../communities/communities.service";
import {EnergyAreasService} from "../../../core/core-services/energy-areas.service";
import * as turf from '@turf/turf'
import { log } from 'console';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})

export class SearchComponent implements AfterViewInit {

  customers:any=[];
  communities=[];
  @ViewChild(AppMapComponent) map!:AppMapComponent ;

  constructor(private customersService: CustomersService, private communitiesService: CommunitiesApiService,private energyAreasService:EnergyAreasService){}

  ngAfterViewInit() {

    //this.communitiesService.get

    this.customersService.getCustomersCups().subscribe(async (res: any) => {
      console.log("res",res)
      this.customers = res.data;
      this.customers.map((customer:any)=>{
        //console.log("customer",customer)
        if(customer.geolocalization){
          //this.map.addMarker(customer.geolocalization.y,customer.geolocalization.x)
        }
      })
    })

    this.communitiesService.get().subscribe((communities:any)=>{
      console.log("communities: ",communities)
      this.communities = communities.data;
      console.log("communities: ",this.communities)
      this.communities.map((community:any)=>{
        if(community.lat && community.lng){
          console.log(community.lat && community.lng)
          let marker = this.map.addMarker(community.lat,community.lng)
          marker.addListener('click',()=>{
             console.log("click on ", community.name)
             this.map.addCircle(community.lat,community.lng,200)
             this.energyAreasService.getByArea(community.lat,community.lng,100)
               .subscribe((res:any)=>{
                 console.log("get by area", res.fata)
                 const energyPolygons = this.groupArrayByAttribute(res.data, 'energy_area_id');
                   energyPolygons.map(energyPolygon=>{
                     let polygon = energyPolygon.map((energyCoords:any)=>{
                         return {lat:parseFloat(energyCoords.lat),lng:parseFloat(energyCoords.lng)};
                     })
                        polygon = this.orderCoords(polygon);
                       this.map.addPolygon(polygon,'red')
                 })
               })
          })
        }
      })
    })

  }

  groupArrayByAttribute(array:[], attribute:string) {
      const groupedArrays: [][] = [];

      // Creamos un mapa para almacenar los arrays agrupados temporalmente
      const tempMap = new Map<number | string, []>();

      // Iteramos sobre el array para agrupar los elementos según el atributo especificado
      array.forEach(item => {
        const value = item[attribute];
        if (!tempMap.has(value)) {
          tempMap.set(value, []);
        }
        tempMap.get(value)?.push(item);
      });

      // Convertimos el mapa en un array de arrays y lo devolvemos
      tempMap.forEach(value => groupedArrays.push(value));

      return groupedArrays;
    }

  orderCoords(coords:any) {
    let orderedCoords:any = [];
    let simpleCords = coords.map((obj:any) => [obj.lat, obj.lng]);
    // Calcular la envoltura convexa de los puntos
    const convexHull = turf.convex(turf.points(simpleCords));
    // Obtener las coordenadas del polígono convexo
    orderedCoords = convexHull!.geometry.coordinates[0].map(coord => ({ lat: coord[0], lng: coord[1] }));
    return orderedCoords;
  }

}
